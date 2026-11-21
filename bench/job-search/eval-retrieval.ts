/**
 * Benchmark 7b & 7c: Retrieval Evaluation (`bench/job-search/eval-retrieval.ts`)
 *
 * Evaluates keyword (ts_rank_cd) vs semantic (cosine) vs hybrid (RRF k=60, top-50)
 * against local Supabase using authenticated SQL RPCs:
 *   - 7b: Known-item retrieval on n=200 queries from `bench/job-search/queries.json`
 *         -> Recall@1, Recall@5, Recall@10, MRR, NDCG@10 (overall & per style)
 *         -> Concrete examples where keyword beats semantic and vice versa
 *   - 7c: Category precision on 50 resume-style queries
 *         -> Precision@10 (relevant = same category)
 *
 * Caches query embeddings in `bench/job-search/.cache/query-embeddings-cache.jsonl`
 * so repeated runs make 0 extra Gemini API calls.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ensureTestUsers, getLocalSupabaseEnv } from '../lib/supabase-env';
import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
  embedBatch,
  toPgVector,
} from '../../lib/embeddings';
import { RRF_CANDIDATE_K, RRF_K, type JobSearchHit, type JobSearchMode } from '../../lib/job-search';
import type { EvalQuery, EvalQueryFile, QueryStyle } from './generate-queries';

const QUERIES_PATH = path.resolve(process.cwd(), 'bench/job-search/queries.json');
const QUERY_EMBED_CACHE_PATH = path.resolve(
  process.cwd(),
  'bench/job-search/.cache/query-embeddings-cache.jsonl'
);

function loadEnvFiles() {
  for (const envFile of ['.env.local', '.env']) {
    const full = path.resolve(process.cwd(), envFile);
    if (!fs.existsSync(full)) continue;
    for (const rawLine of fs.readFileSync(full, 'utf8').split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq <= 0) continue;
      const k = line.slice(0, eq).trim();
      const v = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

function hashText(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function loadQueryCache(): Map<string, number[]> {
  const map = new Map<string, number[]>();
  if (!fs.existsSync(QUERY_EMBED_CACHE_PATH)) return map;
  for (const line of fs.readFileSync(QUERY_EMBED_CACHE_PATH, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (
        obj.hash &&
        Array.isArray(obj.embedding) &&
        obj.embedding.length === EMBEDDING_DIMENSIONS
      ) {
        map.set(obj.hash, obj.embedding);
      }
    } catch {
      // ignore partial line
    }
  }
  return map;
}

function appendQueryCache(entries: Array<{ hash: string; embedding: number[] }>) {
  if (entries.length === 0) return;
  fs.mkdirSync(path.dirname(QUERY_EMBED_CACHE_PATH), { recursive: true });
  const payload =
    entries
      .map((e) =>
        JSON.stringify({
          hash: e.hash,
          model: EMBEDDING_MODEL,
          embedding: e.embedding.map((v) => Number(v.toFixed(7))),
        })
      )
      .join('\n') + '\n';
  fs.appendFileSync(QUERY_EMBED_CACHE_PATH, payload, 'utf8');
}

interface MetricAgg {
  n: number;
  recallAt1: number;
  recallAt5: number;
  recallAt10: number;
  mrr: number;
  ndcgAt10: number;
}

function computeQueryMetrics(hits: JobSearchHit[], goldSourceIds: string[]) {
  const goldSet = new Set(goldSourceIds);
  let firstGoldRank: number | null = null;
  let dcg = 0;

  for (let i = 0; i < Math.min(hits.length, 10); i++) {
    const rank = i + 1;
    if (goldSet.has(hits[i].source_id)) {
      if (firstGoldRank === null) firstGoldRank = rank;
      dcg += 1 / Math.log2(rank + 1);
    }
  }

  let idcg = 0;
  const maxRelevant = Math.min(goldSet.size, 10);
  for (let i = 0; i < maxRelevant; i++) {
    idcg += 1 / Math.log2(i + 2);
  }

  return {
    firstGoldRank,
    hitAt1: firstGoldRank !== null && firstGoldRank <= 1 ? 1 : 0,
    hitAt5: firstGoldRank !== null && firstGoldRank <= 5 ? 1 : 0,
    hitAt10: firstGoldRank !== null && firstGoldRank <= 10 ? 1 : 0,
    rr: firstGoldRank !== null ? 1 / firstGoldRank : 0,
    ndcg10: idcg > 0 ? dcg / idcg : 0,
  };
}

function aggregateMetrics(
  rows: Array<ReturnType<typeof computeQueryMetrics>>
): MetricAgg {
  const n = rows.length || 1;
  const avg = (fn: (r: ReturnType<typeof computeQueryMetrics>) => number) =>
    Number((rows.reduce((s, r) => s + fn(r), 0) / n).toFixed(4));
  return {
    n: rows.length,
    recallAt1: avg((r) => r.hitAt1),
    recallAt5: avg((r) => r.hitAt5),
    recallAt10: avg((r) => r.hitAt10),
    mrr: avg((r) => r.rr),
    ndcgAt10: avg((r) => r.ndcg10),
  };
}

async function main() {
  loadEnvFiles();

  if (!fs.existsSync(QUERIES_PATH)) {
    throw new Error(
      `Missing ${QUERIES_PATH}. Run 'npx tsx bench/job-search/generate-queries.ts' first.`
    );
  }

  const queryFile: EvalQueryFile = JSON.parse(fs.readFileSync(QUERIES_PATH, 'utf8'));
  const queries = queryFile.queries;

  const env = getLocalSupabaseEnv();
  const [user] = await ensureTestUsers(env, 1);

  // Confirm DB posting count
  const { count: dbCount, error: countErr } = await user.client
    .from('job_postings')
    .select('*', { count: 'exact', head: true });
  if (countErr) {
    throw new Error(`Failed to count job_postings: ${countErr.message}`);
  }

  // Embed all queries (using disk cache first, throttled for Free Tier RPM)
  const cache = loadQueryCache();
  const missing: Array<{ query: EvalQuery; hash: string }> = [];
  for (const q of queries) {
    const h = hashText(q.query);
    if (!cache.has(h)) {
      missing.push({ query: q, hash: h });
    }
  }

  console.log(
    `Corpus rows in DB: ${dbCount} | Queries: ${queries.length} | Cache hits: ${queries.length - missing.length} | To embed: ${missing.length}`
  );

  if (missing.length > 0) {
    const batchSize = 45;
    const throttleDelayMs = Math.ceil((batchSize / 85) * 60_000);
    const totalBatches = Math.ceil(missing.length / batchSize);
    for (let b = 0; b < totalBatches; b++) {
      const t0 = Date.now();
      const slice = missing.slice(b * batchSize, (b + 1) * batchSize);
      const vecs = await embedBatch(
        slice.map((s) => s.query.query),
        {
          taskType: 'RETRIEVAL_QUERY',
          batchSize: slice.length,
          maxRetries: 5,
          initialDelayMs: 2000,
        }
      );
      const toSave: Array<{ hash: string; embedding: number[] }> = [];
      for (let i = 0; i < slice.length; i++) {
        cache.set(slice[i].hash, vecs[i]);
        toSave.push({ hash: slice[i].hash, embedding: vecs[i] });
      }
      appendQueryCache(toSave);
      console.log(`  Embedded query batch ${b + 1}/${totalBatches}`);
      if (b < totalBatches - 1) {
        const waitMs = throttleDelayMs - (Date.now() - t0);
        if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));
      }
    }
  }

  const modes: JobSearchMode[] = ['keyword', 'semantic', 'hybrid'];
  const perModePerQuery: Record<
    JobSearchMode,
    Array<{
      q: EvalQuery;
      hits: JobSearchHit[];
      metrics: ReturnType<typeof computeQueryMetrics>;
    }>
  > = {
    keyword: [],
    semantic: [],
    hybrid: [],
  };

  for (const q of queries) {
    const vecStr = toPgVector(cache.get(hashText(q.query))!);

    const [kwRes, semRes, hybRes] = await Promise.all([
      user.client.rpc('search_jobs_keyword', {
        p_query: q.query,
        p_limit: 10,
        p_exclude_tracked: false,
      }),
      user.client.rpc('search_jobs_semantic', {
        p_query_embedding: vecStr,
        p_limit: 10,
        p_exclude_tracked: false,
      }),
      user.client.rpc('search_jobs_hybrid', {
        p_query: q.query,
        p_query_embedding: vecStr,
        p_limit: 10,
        p_rrf_k: RRF_K,
        p_candidate_k: RRF_CANDIDATE_K,
        p_exclude_tracked: false,
      }),
    ]);

    if (kwRes.error) throw new Error(`keyword RPC error: ${kwRes.error.message}`);
    if (semRes.error) throw new Error(`semantic RPC error: ${semRes.error.message}`);
    if (hybRes.error) throw new Error(`hybrid RPC error: ${hybRes.error.message}`);

    const mapData: Record<JobSearchMode, JobSearchHit[]> = {
      keyword: (kwRes.data || []) as JobSearchHit[],
      semantic: (semRes.data || []) as JobSearchHit[],
      hybrid: (hybRes.data || []) as JobSearchHit[],
    };

    for (const m of modes) {
      perModePerQuery[m].push({
        q,
        hits: mapData[m],
        metrics: computeQueryMetrics(mapData[m], q.goldSourceIds),
      });
    }
  }

  // Overall table
  const overallSummary = modes.map((mode) => ({
    mode,
    ...aggregateMetrics(perModePerQuery[mode].map((x) => x.metrics)),
  }));

  console.log('\n=== 7b. Known-Item Retrieval — Overall (n=200) ===');
  console.table(overallSummary);

  // Per-style breakdown
  const styles: QueryStyle[] = ['keyword', 'paraphrase', 'resume'];
  const perStyleSummary: Array<{ style: QueryStyle; mode: JobSearchMode } & MetricAgg> = [];
  for (const style of styles) {
    for (const mode of modes) {
      const subset = perModePerQuery[mode]
        .filter((x) => x.q.style === style)
        .map((x) => x.metrics);
      perStyleSummary.push({ style, mode, ...aggregateMetrics(subset) });
    }
  }

  console.log('\n=== 7b. Known-Item Retrieval — Per Query Style ===');
  console.table(perStyleSummary);

  // Find concrete examples where keyword beats semantic (higher RR / lower gold rank)
  const kwBeatsSem: Array<{
    id: string;
    style: QueryStyle;
    category: string;
    sourceTitle: string;
    queryPreview: string;
    keywordRank: number | null;
    semanticRank: number | null;
    hybridRank: number | null;
  }> = [];

  const semBeatsKw: typeof kwBeatsSem = [];

  for (let i = 0; i < queries.length; i++) {
    const kwEntry = perModePerQuery.keyword[i];
    const semEntry = perModePerQuery.semantic[i];
    const hybEntry = perModePerQuery.hybrid[i];

    const kwRR = kwEntry.metrics.rr;
    const semRR = semEntry.metrics.rr;

    const record = {
      id: kwEntry.q.id,
      style: kwEntry.q.style,
      category: kwEntry.q.category,
      sourceTitle: kwEntry.q.sourceTitle,
      queryPreview: kwEntry.q.query.slice(0, 110),
      keywordRank: kwEntry.metrics.firstGoldRank,
      semanticRank: semEntry.metrics.firstGoldRank,
      hybridRank: hybEntry.metrics.firstGoldRank,
    };

    if (kwRR > semRR) kwBeatsSem.push(record);
    else if (semRR > kwRR) semBeatsKw.push(record);
  }

  console.log(
    `\nWin counts (by reciprocal rank): keyword > semantic = ${kwBeatsSem.length} | semantic > keyword = ${semBeatsKw.length} | tie = ${queries.length - kwBeatsSem.length - semBeatsKw.length}`
  );
  console.log('Sample queries where keyword beat semantic (up to 8):');
  console.table(kwBeatsSem.slice(0, 8));

  // 7c. Category Precision@10 on 50 resume-style queries
  const catPrecisionSummary = modes.map((mode) => {
    const subset = perModePerQuery[mode].filter((x) => x.q.useForCategoryPrecision);
    const precisions = subset.map((entry) => {
      const top10 = entry.hits.slice(0, 10);
      if (top10.length === 0) return 0;
      const sameCat = top10.filter((h) => h.category === entry.q.category).length;
      return sameCat / 10;
    });
    const meanP10 =
      precisions.length > 0
        ? Number((precisions.reduce((a, b) => a + b, 0) / precisions.length).toFixed(4))
        : 0;
    const minP10 = precisions.length > 0 ? Math.min(...precisions) : 0;
    const maxP10 = precisions.length > 0 ? Math.max(...precisions) : 0;
    return {
      mode,
      n: subset.length,
      precisionAt10: meanP10,
      minP10,
      maxP10,
    };
  });

  console.log('\n=== 7c. Category Precision@10 (50 resume-style queries, relevant = same category) ===');
  console.table(catPrecisionSummary);

  console.log(
    JSON.stringify(
      {
        corpusRows: dbCount,
        overallSummary,
        perStyleSummary,
        winCounts: {
          keywordBeatsSemantic: kwBeatsSem.length,
          semanticBeatsKeyword: semBeatsKw.length,
          ties: queries.length - kwBeatsSem.length - semBeatsKw.length,
        },
        keywordBeatsSemanticExamples: kwBeatsSem.slice(0, 8),
        semanticBeatsKeywordExamples: semBeatsKw.slice(0, 5),
        catPrecisionSummary,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error('[eval-retrieval] Error:', err);
  process.exit(1);
});
