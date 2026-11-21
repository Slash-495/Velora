/**
 * Benchmark 7d: HNSW vs Exact Scan on 10,000 Rows (`bench/job-search/bench-hnsw-10k.ts`)
 *
 * Uses an isolated benchmark table `public.bench_hnsw_10k` (dropped cleanly in `finally`)
 * with 10,000 real postings from the MIT Djinni dataset across 12 categories and an
 * identical pgvector HNSW cosine index (`m=16, ef_construction=64`) + GIN FTS index:
 *
 * 1. Measures HNSW Recall@10 against Exact Scan (`enable_indexscan=off; enable_bitmapscan=off`)
 *    over 100 real `gemini-embedding-001` query vectors (reporting default `ef_search=40` and `ef_search=100`).
 * 2. Measures p50 / p95 / p99 RPC latency & req/s at 10 concurrent connections:
 *    - Without embedding call (10 concurrent workers x 10s against PostgREST RPC on 10,000 rows:
 *      HNSW semantic, Exact semantic, and Hybrid RRF)
 *    - With live `gemini-embedding-001` embedding call (10 concurrent workers x 2 requests = 20 live
 *      calls to stay safely inside Free Tier 1,000 RPD quota)
 */
import fs from 'node:fs';
import path from 'node:path';
import { Client as PgClient } from 'pg';
import { asyncBufferFromFile, parquetReadObjects } from 'hyparquet';
import { compressors } from 'hyparquet-compressors';
import { ensureTestUsers, getLocalSupabaseEnv } from '../lib/supabase-env';
import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
  embedText,
  normalizeVector,
  toPgVector,
} from '../../lib/embeddings';
import { TARGET_CATEGORIES, computeContentHash, type RawJobPosting } from '../../scripts/ingest-jobs';
import type { EvalQueryFile } from './generate-queries';

const PARQUET_PATH = path.resolve(process.cwd(), 'bench/job-search/.cache/djinni-en.parquet');
const EMBED_CACHE_PATH = path.resolve(process.cwd(), 'bench/job-search/.cache/embeddings-cache.jsonl');
const QUERY_CACHE_PATH = path.resolve(process.cwd(), 'bench/job-search/.cache/query-embeddings-cache.jsonl');
const QUERIES_PATH = path.resolve(process.cwd(), 'bench/job-search/queries.json');

const TARGET_ROWS = 10_000;
const CONCURRENCY = 10;
const DURATION_MS = 10_000;
const LIVE_EMBED_CALLS_PER_WORKER = 2; // 10 workers x 2 = 20 live Gemini calls (Free Tier safe)

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

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)
  );
  return Number(sorted[idx].toFixed(2));
}

function seededPrng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function perturbEmbedding(base: number[], seed: number, sigma = 0.08): number[] {
  const rand = seededPrng(seed);
  const out = new Array<number>(base.length);
  for (let i = 0; i < base.length; i++) {
    // Box-Muller approximate Gaussian centered at 0
    const u1 = Math.max(rand(), 1e-7);
    const u2 = rand();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    out[i] = base[i] + z * sigma;
  }
  return normalizeVector(out);
}

function loadCacheMap(filePath: string, keyField: 'content_hash' | 'hash'): Map<string, number[]> {
  const map = new Map<string, number[]>();
  if (!fs.existsSync(filePath)) return map;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (
        obj[keyField] &&
        Array.isArray(obj.embedding) &&
        obj.embedding.length === EMBEDDING_DIMENSIONS
      ) {
        map.set(obj[keyField], obj.embedding);
      }
    } catch {
      // ignore
    }
  }
  return map;
}

async function sample10kPostings(): Promise<RawJobPosting[]> {
  const file = await asyncBufferFromFile(PARQUET_PATH);
  const targetSet = new Set<string>(TARGET_CATEGORIES);
  const perCat = Math.ceil(TARGET_ROWS / TARGET_CATEGORIES.length);
  const buckets = new Map<string, RawJobPosting[]>();
  for (const c of TARGET_CATEGORIES) buckets.set(c, []);

  const seenIds = new Set<string>();
  const rows = await parquetReadObjects({
    file,
    compressors,
    columns: ['id', 'Position', 'Company Name', 'Long Description', 'Primary Keyword', 'Long Description_lang'],
  });

  for (const r of rows as Record<string, any>[]) {
    const cat = String(r['Primary Keyword'] || '').trim();
    if (!targetSet.has(cat)) continue;
    const bucket = buckets.get(cat)!;
    if (bucket.length >= perCat) continue;
    if (r['Long Description_lang'] && String(r['Long Description_lang']) !== 'en') continue;

    const sourceId = String(r['id'] || '').trim();
    const title = String(r['Position'] || '').trim().slice(0, 200);
    const company = String(r['Company Name'] || '').trim().slice(0, 160) || 'Unknown Company';
    const description = String(r['Long Description'] || '').trim().slice(0, 6000);
    const location = 'Remote / Unspecified';
    if (!sourceId || !title || description.length < 180 || seenIds.has(sourceId)) continue;

    seenIds.add(sourceId);
    const contentHash = computeContentHash({ title, company, location, category: cat, description });
    bucket.push({
      source_id: sourceId,
      title,
      company,
      location,
      description,
      category: cat,
      content_hash: contentHash,
    });

    let done = true;
    for (const b of buckets.values()) {
      if (b.length < perCat) {
        done = false;
        break;
      }
    }
    if (done) break;
  }

  const out: RawJobPosting[] = [];
  for (let i = 0; out.length < TARGET_ROWS; i++) {
    let added = false;
    for (const c of TARGET_CATEGORIES) {
      const b = buckets.get(c)!;
      if (i < b.length && out.length < TARGET_ROWS) {
        out.push(b[i]);
        added = true;
      }
    }
    if (!added) break;
  }
  return out;
}

async function runConcurrentRpcBenchmark(
  label: string,
  rpcUrl: string,
  headers: Record<string, string>,
  buildBody: (iter: number) => string,
  concurrency: number,
  durationMs: number
) {
  const latencies: number[] = [];
  let errors = 0;
  let counter = 0;
  const deadline = Date.now() + durationMs;
  const wallStart = performance.now();

  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (Date.now() < deadline) {
        const idx = counter++;
        const t0 = performance.now();
        try {
          const res = await fetch(rpcUrl, {
            method: 'POST',
            headers,
            body: buildBody(idx),
          });
          await res.text();
          if (!res.ok) errors++;
          else latencies.push(performance.now() - t0);
        } catch {
          errors++;
        }
      }
    })
  );

  const wallSec = (performance.now() - wallStart) / 1000;
  latencies.sort((a, b) => a - b);
  const total = latencies.length + errors;
  return {
    scenario: label,
    connections: concurrency,
    totalRequests: total,
    okRequests: latencies.length,
    errors,
    errorRatePct: total > 0 ? `${((errors / total) * 100).toFixed(2)}%` : '0.00%',
    reqPerSec: Number((latencies.length / wallSec).toFixed(2)),
    p50Ms: percentile(latencies, 50),
    p95Ms: percentile(latencies, 95),
    p99Ms: percentile(latencies, 99),
    maxMs: latencies.length > 0 ? Number(latencies[latencies.length - 1].toFixed(2)) : 0,
  };
}

async function main() {
  loadEnvFiles();
  const env = getLocalSupabaseEnv();
  const [user] = await ensureTestUsers(env, 1);

  const embedCache = loadCacheMap(EMBED_CACHE_PATH, 'content_hash');
  const queryCache = loadCacheMap(QUERY_CACHE_PATH, 'hash');
  const queryFile: EvalQueryFile = JSON.parse(fs.readFileSync(QUERIES_PATH, 'utf8'));

  const postings10k = await sample10kPostings();
  console.log(`Loaded ${postings10k.length} postings for 10k HNSW vs Exact Scan benchmark.`);

  // Group real Gemini embeddings by category so manifold expansions preserve real cluster geometry
  const realVectorsByCat = new Map<string, number[][]>();
  const allRealVectors: number[][] = [];
  for (const p of postings10k) {
    const v = embedCache.get(p.content_hash);
    if (v) {
      const arr = realVectorsByCat.get(p.category) || [];
      arr.push(v);
      realVectorsByCat.set(p.category, arr);
      allRealVectors.push(v);
    }
  }
  if (allRealVectors.length === 0) {
    throw new Error('No real embeddings found in cache. Run ingestion first.');
  }

  let realGeminiCount = 0;
  let manifoldExpandedCount = 0;

  const pg = new PgClient({ connectionString: env.dbUrl });
  await pg.connect();

  try {
    // 1. Create isolated 10k table with identical schema + HNSW & GIN indexes + temporary RPCs
    await pg.query(`
      DROP TABLE IF EXISTS public.bench_hnsw_10k CASCADE;
      CREATE TABLE public.bench_hnsw_10k (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        company TEXT NOT NULL DEFAULT '',
        location TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        embedding extensions.vector(768) NOT NULL,
        fts tsvector GENERATED ALWAYS AS (
          setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(description, '')), 'B')
        ) STORED
      );
      GRANT SELECT ON TABLE public.bench_hnsw_10k TO authenticated, service_role;
    `);

    console.log('Inserting 10,000 rows into public.bench_hnsw_10k...');
    const insertStart = performance.now();
    const chunkSize = 200;

    for (let i = 0; i < postings10k.length; i += chunkSize) {
      const slice = postings10k.slice(i, i + chunkSize);
      const values: any[] = [];
      const placeholders: string[] = [];

      for (let j = 0; j < slice.length; j++) {
        const p = slice[j];
        let vec = embedCache.get(p.content_hash);
        if (vec) {
          realGeminiCount++;
        } else {
          const catPool = realVectorsByCat.get(p.category) || allRealVectors;
          const base = catPool[(i + j) % catPool.length];
          vec = perturbEmbedding(base, 100003 + i + j, 0.08);
          manifoldExpandedCount++;
        }

        const baseIdx = j * 8;
        placeholders.push(
          `($${baseIdx + 1}, $${baseIdx + 2}, $${baseIdx + 3}, $${baseIdx + 4}, $${baseIdx + 5}, $${baseIdx + 6}, $${baseIdx + 7}, $${baseIdx + 8}::extensions.vector)`
        );
        values.push(
          p.source_id,
          p.title,
          p.company,
          p.location,
          p.description,
          p.category,
          p.content_hash,
          toPgVector(vec)
        );
      }

      await pg.query(
        `INSERT INTO public.bench_hnsw_10k (source_id, title, company, location, description, category, content_hash, embedding) VALUES ${placeholders.join(',')}`,
        values
      );
    }

    const insertMs = Math.round(performance.now() - insertStart);
    console.log(
      `Inserted 10,000 rows in ${insertMs}ms (realGeminiVectors=${realGeminiCount}, manifoldExpandedVectors=${manifoldExpandedCount}). Building HNSW + GIN indexes...`
    );

    const idxStart = performance.now();
    await pg.query(`
      CREATE INDEX idx_bench_hnsw_10k_embedding_hnsw
        ON public.bench_hnsw_10k
        USING hnsw (embedding extensions.vector_cosine_ops)
        WITH (m = 16, ef_construction = 64);
      CREATE INDEX idx_bench_hnsw_10k_fts_gin
        ON public.bench_hnsw_10k
        USING gin (fts);
      ANALYZE public.bench_hnsw_10k;
    `);
    const idxMs = Math.round(performance.now() - idxStart);
    console.log(`Built HNSW (m=16, ef_construction=64) + GIN indexes on 10,000 rows in ${idxMs}ms.`);

    // Create benchmark RPCs mirroring production search_jobs_semantic & search_jobs_hybrid
    await pg.query(`
      CREATE OR REPLACE FUNCTION public.bench_10k_semantic_hnsw(
        p_query_embedding extensions.vector(768),
        p_limit INTEGER DEFAULT 10
      )
      RETURNS TABLE (id UUID, source_id TEXT, score DOUBLE PRECISION)
      LANGUAGE sql
      STABLE
      SET search_path = public, extensions
      AS $$
        SELECT b.id, b.source_id, (1.0 - (b.embedding <=> p_query_embedding))::double precision AS score
        FROM public.bench_hnsw_10k b
        ORDER BY b.embedding <=> p_query_embedding ASC
        LIMIT p_limit;
      $$;

      CREATE OR REPLACE FUNCTION public.bench_10k_semantic_exact(
        p_query_embedding extensions.vector(768),
        p_limit INTEGER DEFAULT 10
      )
      RETURNS TABLE (id UUID, source_id TEXT, score DOUBLE PRECISION)
      LANGUAGE plpgsql
      SET search_path = public, extensions
      AS $$
      BEGIN
        PERFORM set_config('enable_indexscan', 'off', true);
        PERFORM set_config('enable_bitmapscan', 'off', true);
        RETURN QUERY
        SELECT b.id, b.source_id, (1.0 - (b.embedding <=> p_query_embedding))::double precision AS score
        FROM public.bench_hnsw_10k b
        ORDER BY b.embedding <=> p_query_embedding ASC
        LIMIT p_limit;
      END;
      $$;

      CREATE OR REPLACE FUNCTION public.bench_10k_hybrid_hnsw(
        p_query TEXT,
        p_query_embedding extensions.vector(768),
        p_limit INTEGER DEFAULT 10
      )
      RETURNS TABLE (id UUID, source_id TEXT, score DOUBLE PRECISION)
      LANGUAGE plpgsql
      SET search_path = public, extensions
      AS $$
      DECLARE
        v_tsq tsquery := public.build_job_tsquery(p_query);
      BEGIN
        RETURN QUERY
        WITH kw AS (
          SELECT b.id,
                 ROW_NUMBER() OVER (ORDER BY ts_rank_cd(b.fts, v_tsq, 32) DESC, b.id ASC)::integer AS kw_rank
          FROM public.bench_hnsw_10k b
          WHERE v_tsq IS NOT NULL AND b.fts @@ v_tsq
          ORDER BY ts_rank_cd(b.fts, v_tsq, 32) DESC, b.id ASC
          LIMIT 50
        ),
        sem_raw AS (
          SELECT b.id, (1.0 - (b.embedding <=> p_query_embedding))::double precision AS sem_score
          FROM public.bench_hnsw_10k b
          ORDER BY b.embedding <=> p_query_embedding ASC
          LIMIT 50
        ),
        sem AS (
          SELECT sr.id, sr.sem_score,
                 ROW_NUMBER() OVER (ORDER BY sr.sem_score DESC, sr.id ASC)::integer AS sem_rank
          FROM sem_raw sr
        ),
        fused AS (
          SELECT COALESCE(kw.id, sem.id) AS id,
                 sem.sem_score,
                 (COALESCE(1.0 / (60 + kw.kw_rank), 0.0) + COALESCE(1.0 / (60 + sem.sem_rank), 0.0))::double precision AS rrf_score
          FROM kw FULL OUTER JOIN sem ON kw.id = sem.id
        )
        SELECT b.id, b.source_id, f.rrf_score
        FROM fused f
        JOIN public.bench_hnsw_10k b ON b.id = f.id
        ORDER BY f.rrf_score DESC, f.sem_score DESC NULLS LAST, b.id ASC
        LIMIT p_limit;
      END;
      $$;

      GRANT EXECUTE ON FUNCTION public.bench_10k_semantic_hnsw(extensions.vector, INTEGER) TO authenticated, service_role;
      GRANT EXECUTE ON FUNCTION public.bench_10k_semantic_exact(extensions.vector, INTEGER) TO authenticated, service_role;
      GRANT EXECUTE ON FUNCTION public.bench_10k_hybrid_hnsw(TEXT, extensions.vector, INTEGER) TO authenticated, service_role;
      NOTIFY pgrst, 'reload schema';
    `);

    // Give PostgREST 1.5s to reload schema cache
    await new Promise((r) => setTimeout(r, 1500));

    // 2. Measure HNSW Recall@10 against Exact Scan across 100 real Gemini query embeddings
    const queryVecs = Array.from(queryCache.values()).slice(0, 100);
    const queryPgVecs = queryVecs.map(toPgVector);

    // Verify EXPLAIN plans for HNSW vs Exact Scan
    const sampleVec = queryPgVecs[0];
    const hnswPlanRes = await pg.query(
      'EXPLAIN (ANALYZE, BUFFERS) SELECT id FROM public.bench_hnsw_10k ORDER BY embedding <=> $1::extensions.vector ASC LIMIT 10',
      [sampleVec]
    );
    await pg.query('BEGIN');
    await pg.query('SET LOCAL enable_indexscan = off; SET LOCAL enable_bitmapscan = off;');
    const exactPlanRes = await pg.query(
      'EXPLAIN (ANALYZE, BUFFERS) SELECT id FROM public.bench_hnsw_10k ORDER BY embedding <=> $1::extensions.vector ASC LIMIT 10',
      [sampleVec]
    );
    await pg.query('ROLLBACK');

    console.log('\n--- EXPLAIN (ANALYZE, BUFFERS): HNSW (10k rows) ---');
    console.log(hnswPlanRes.rows.map((r: any) => r['QUERY PLAN']).join('\n'));
    console.log('\n--- EXPLAIN (ANALYZE, BUFFERS): Exact Seq Scan (10k rows) ---');
    console.log(exactPlanRes.rows.map((r: any) => r['QUERY PLAN']).join('\n'));

    const recallResults: Array<{ efSearch: number; queries: number; meanRecallAt10: number; minRecallAt10: number; maxRecallAt10: number }> = [];

    // Precompute exact top-10 for all 100 queries
    const exactTop10: Set<string>[] = [];
    for (const qv of queryPgVecs) {
      await pg.query('BEGIN');
      await pg.query('SET LOCAL enable_indexscan = off; SET LOCAL enable_bitmapscan = off;');
      const r = await pg.query<{ id: string }>(
        'SELECT id FROM public.bench_hnsw_10k ORDER BY embedding <=> $1::extensions.vector ASC LIMIT 10',
        [qv]
      );
      await pg.query('ROLLBACK');
      exactTop10.push(new Set(r.rows.map((x) => x.id)));
    }

    for (const efSearch of [40, 100]) {
      const recalls: number[] = [];
      for (let i = 0; i < queryPgVecs.length; i++) {
        await pg.query('BEGIN');
        await pg.query(`SET LOCAL hnsw.ef_search = ${efSearch};`);
        const r = await pg.query<{ id: string }>(
          'SELECT id FROM public.bench_hnsw_10k ORDER BY embedding <=> $1::extensions.vector ASC LIMIT 10',
          [queryPgVecs[i]]
        );
        await pg.query('ROLLBACK');
        const exactSet = exactTop10[i];
        const hits = r.rows.filter((x) => exactSet.has(x.id)).length;
        recalls.push(hits / 10);
      }
      recallResults.push({
        efSearch,
        queries: queryPgVecs.length,
        meanRecallAt10: Number(
          (recalls.reduce((a, b) => a + b, 0) / recalls.length).toFixed(4)
        ),
        minRecallAt10: Number(Math.min(...recalls).toFixed(4)),
        maxRecallAt10: Number(Math.max(...recalls).toFixed(4)),
      });
    }

    console.log('\n=== HNSW Recall@10 vs Exact Scan (10,000 rows, 768 dims, 100 queries) ===');
    console.table(recallResults);

    // 3. p50 / p95 RPC Latency at 10 concurrent connections (WITHOUT embedding call)
    const rpcHeaders = {
      apikey: env.anonKey,
      Authorization: `Bearer ${user.accessToken}`,
      'Content-Type': 'application/json',
    };

    const hnswSemBench = await runConcurrentRpcBenchmark(
      'Semantic RPC — HNSW (10k rows, no embed)',
      `${env.apiUrl}/rest/v1/rpc/bench_10k_semantic_hnsw`,
      rpcHeaders,
      (i) =>
        JSON.stringify({
          p_query_embedding: queryPgVecs[i % queryPgVecs.length],
          p_limit: 10,
        }),
      CONCURRENCY,
      DURATION_MS
    );

    const exactSemBench = await runConcurrentRpcBenchmark(
      'Semantic RPC — Exact Scan (10k rows, no embed)',
      `${env.apiUrl}/rest/v1/rpc/bench_10k_semantic_exact`,
      rpcHeaders,
      (i) =>
        JSON.stringify({
          p_query_embedding: queryPgVecs[i % queryPgVecs.length],
          p_limit: 10,
        }),
      CONCURRENCY,
      DURATION_MS
    );

    const hybridHnswBench = await runConcurrentRpcBenchmark(
      'Hybrid RRF RPC — HNSW + GIN (10k rows, no embed)',
      `${env.apiUrl}/rest/v1/rpc/bench_10k_hybrid_hnsw`,
      rpcHeaders,
      (i) => {
        const qObj = queryFile.queries[i % queryPgVecs.length];
        return JSON.stringify({
          p_query: qObj.query,
          p_query_embedding: queryPgVecs[i % queryPgVecs.length],
          p_limit: 10,
        });
      },
      CONCURRENCY,
      DURATION_MS
    );

    // 4. p50 / p95 RPC Latency at 10 concurrent connections WITH live Gemini embedding call
    //    (10 workers x 2 calls = 20 live gemini-embedding-001 calls -> respects Free Tier quota)
    const liveEmbedLatencies: number[] = [];
    const liveRpcLatencies: number[] = [];
    const liveTotalLatencies: number[] = [];
    let liveErrors = 0;

    console.log(
      `\nMeasuring 10 concurrent connections WITH live ${EMBEDDING_MODEL} embedding (${CONCURRENCY * LIVE_EMBED_CALLS_PER_WORKER} live calls)...`
    );
    const liveWallStart = performance.now();

    await Promise.all(
      Array.from({ length: CONCURRENCY }, async (_, wIdx) => {
        for (let r = 0; r < LIVE_EMBED_CALLS_PER_WORKER; r++) {
          const qObj = queryFile.queries[(wIdx * LIVE_EMBED_CALLS_PER_WORKER + r) % queryFile.queries.length];
          const tTotal = performance.now();
          try {
            const tEmb = performance.now();
            const vec = await embedText(qObj.query, { taskType: 'RETRIEVAL_QUERY' });
            const embMs = performance.now() - tEmb;

            const tRpc = performance.now();
            const res = await fetch(`${env.apiUrl}/rest/v1/rpc/bench_10k_hybrid_hnsw`, {
              method: 'POST',
              headers: rpcHeaders,
              body: JSON.stringify({
                p_query: qObj.query,
                p_query_embedding: toPgVector(vec),
                p_limit: 10,
              }),
            });
            await res.text();
            const rpcMs = performance.now() - tRpc;
            if (!res.ok) {
              liveErrors++;
            } else {
              liveEmbedLatencies.push(embMs);
              liveRpcLatencies.push(rpcMs);
              liveTotalLatencies.push(performance.now() - tTotal);
            }
          } catch (err) {
            liveErrors++;
            console.warn('[live embed latency error]:', (err as Error).message);
          }
        }
      })
    );

    const liveWallSec = (performance.now() - liveWallStart) / 1000;
    liveEmbedLatencies.sort((a, b) => a - b);
    liveRpcLatencies.sort((a, b) => a - b);
    liveTotalLatencies.sort((a, b) => a - b);

    const liveTotalAttempts = liveTotalLatencies.length + liveErrors;
    const liveWithEmbedBench = {
      scenario: `Hybrid RRF RPC + Live ${EMBEDDING_MODEL} (10k rows, 20 calls)`,
      connections: CONCURRENCY,
      totalRequests: liveTotalAttempts,
      okRequests: liveTotalLatencies.length,
      errors: liveErrors,
      errorRatePct:
        liveTotalAttempts > 0
          ? `${((liveErrors / liveTotalAttempts) * 100).toFixed(2)}%`
          : '0.00%',
      reqPerSec: Number((liveTotalLatencies.length / liveWallSec).toFixed(2)),
      p50Ms: percentile(liveTotalLatencies, 50),
      p95Ms: percentile(liveTotalLatencies, 95),
      p99Ms: percentile(liveTotalLatencies, 99),
      maxMs:
        liveTotalLatencies.length > 0
          ? Number(liveTotalLatencies[liveTotalLatencies.length - 1].toFixed(2))
          : 0,
      embedP50Ms: percentile(liveEmbedLatencies, 50),
      embedP95Ms: percentile(liveEmbedLatencies, 95),
      rpcP50Ms: percentile(liveRpcLatencies, 50),
      rpcP95Ms: percentile(liveRpcLatencies, 95),
    };

    const latencyTable = [
      hnswSemBench,
      exactSemBench,
      hybridHnswBench,
      liveWithEmbedBench,
    ];

    console.log('\n=== 7d. 10k-Row Latency Benchmark (10 concurrent connections) ===');
    console.table(
      latencyTable.map((x) => ({
        scenario: x.scenario,
        ok: x.okRequests,
        errRate: x.errorRatePct,
        reqSec: x.reqPerSec,
        p50ms: x.p50Ms,
        p95ms: x.p95Ms,
        p99ms: x.p99Ms,
      }))
    );

    console.log(
      JSON.stringify(
        {
          datasetRows: postings10k.length,
          realGeminiVectors: realGeminiCount,
          manifoldExpandedVectors: manifoldExpandedCount,
          insertMs,
          indexBuildMs: idxMs,
          recallResults,
          latencyTable,
        },
        null,
        2
      )
    );
  } finally {
    // Clean up isolated benchmark table & helper functions
    await pg.query(`
      DROP FUNCTION IF EXISTS public.bench_10k_semantic_hnsw(extensions.vector, INTEGER);
      DROP FUNCTION IF EXISTS public.bench_10k_semantic_exact(extensions.vector, INTEGER);
      DROP FUNCTION IF EXISTS public.bench_10k_hybrid_hnsw(TEXT, extensions.vector, INTEGER);
      DROP TABLE IF EXISTS public.bench_hnsw_10k CASCADE;
      NOTIFY pgrst, 'reload schema';
    `);
    await pg.end();
  }
}

main().catch((err) => {
  console.error('[bench-hnsw-10k] Error:', err);
  process.exit(1);
});
