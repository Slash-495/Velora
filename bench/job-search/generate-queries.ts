/**
 * Benchmark 7a: Known-Item Query Generator (`bench/job-search/generate-queries.ts`)
 *
 * Generates `n = 200` queries across 3 styles (`keyword`, `paraphrase`, `resume`)
 * from postings across all ingested categories and saves them ONCE to
 * `bench/job-search/queries.json` along with the exact prompts used.
 *
 * Will NOT overwrite an existing `queries.json` unless `--force` is passed.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { RawJobPosting } from '../../scripts/ingest-jobs';

const QUERIES_PATH = path.resolve(process.cwd(), 'bench/job-search/queries.json');
const CHECKPOINT_PATH = path.resolve(
  process.cwd(),
  'bench/job-search/.cache/queries-progress.jsonl'
);
const DEFAULT_SAMPLE_PATH = path.resolve(
  process.cwd(),
  'bench/job-search/.cache/sample-480.jsonl'
);
const GEMINI_GEN_MODEL = 'gemini-flash-latest';

export type QueryStyle = 'keyword' | 'paraphrase' | 'resume';

export interface EvalQuery {
  id: string;
  style: QueryStyle;
  query: string;
  goldSourceIds: string[];
  sourceTitle: string;
  sourceCompany: string;
  category: string;
  useForCategoryPrecision: boolean;
}

export interface EvalQueryFile {
  generatedAt: string;
  generatorModel: string;
  corpusFile: string;
  corpusSize: number;
  totalQueries: number;
  styleCounts: Record<QueryStyle, number>;
  categoryPrecisionCount: number;
  prompts: Record<QueryStyle, string>;
  queries: EvalQuery[];
}

const PROMPTS: Record<QueryStyle, string> = {
  keyword:
    'For each job posting below, extract 6 to 10 concise technical skills, tools, frameworks, or domain keywords copied directly from the job description (no company name, no full sentences, space-separated keyword query). Return ONLY a JSON array of objects [{"source_id": "...", "query": "..."}].',
  paraphrase:
    'For each job posting below, rewrite it as a 2 to 3 sentence candidate profile describing someone who fits this role. STRICT RULES: Do NOT include the job title verbatim, do NOT include the company name, and paraphrase responsibilities/concepts rather than copying rare sentences verbatim. Return ONLY a JSON array of objects [{"source_id": "...", "query": "..."}].',
  resume:
    'For each job posting below, write a realistic 3 to 4 sentence resume summary plus a short "Skills: ..." line for a strong candidate targeting this role. STRICT RULES: Do NOT mention the company name or copy the exact job title verbatim. Return ONLY a JSON array of objects [{"source_id": "...", "query": "..."}].',
};

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

async function callGeminiBatch(
  apiKey: string,
  style: QueryStyle,
  postings: RawJobPosting[]
): Promise<Map<string, string>> {
  const inputItems = postings.map((p) => ({
    source_id: p.source_id,
    title: p.title,
    company: p.company,
    category: p.category,
    description: p.description.replace(/\s+/g, ' ').trim().slice(0, 900),
  }));

  const fullPrompt = `${PROMPTS[style]}\n\nJob postings JSON:\n${JSON.stringify(inputItems)}`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_GEN_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  for (let attempt = 1; attempt <= 5; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90_000);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        }),
        signal: controller.signal,
      });

      const body = await res.json().catch(() => ({}));
      if (res.status === 429 || res.status >= 500) {
        const retryDetail = (body?.error?.details || []).find(
          (d: any) => typeof d?.retryDelay === 'string'
        );
        const serverWaitSec = retryDetail?.retryDelay
          ? Number(String(retryDetail.retryDelay).replace(/s$/, ''))
          : 0;
        const delayMs =
          serverWaitSec > 0 ? Math.ceil(serverWaitSec * 1000) + 1000 : 15_000 * attempt;
        console.warn(
          `[generate-queries] HTTP ${res.status} on ${style} batch (attempt ${attempt}/5); waiting ${delayMs}ms...`
        );
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      if (!res.ok) {
        throw new Error(
          `Gemini ${GEMINI_GEN_MODEL} HTTP ${res.status}: ${body?.error?.message || 'Unknown error'}`
        );
      }

      const rawText = body?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const parsed = JSON.parse(rawText);
      if (!Array.isArray(parsed)) {
        throw new Error('Expected JSON array from Gemini');
      }

      const map = new Map<string, string>();
      for (const item of parsed) {
        if (
          item &&
          typeof item.source_id === 'string' &&
          typeof item.query === 'string' &&
          item.query.trim().length > 0
        ) {
          map.set(item.source_id, item.query.trim().slice(0, 1900));
        }
      }
      return map;
    } catch (err) {
      if (attempt === 5) throw err;
      await new Promise((r) => setTimeout(r, 4000 * attempt));
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(`Failed to generate ${style} batch after retries`);
}

function deterministicFallbackKeyword(p: RawJobPosting): string {
  const words = p.description
    .replace(/[^A-Za-z0-9+#.\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3);
  const unique = Array.from(new Set(words)).slice(0, 10);
  return `${p.category} ${unique.join(' ')}`.trim();
}

async function main() {
  loadEnvFiles();
  const force = process.argv.includes('--force');
  const sampleArgIdx = process.argv.indexOf('--sample');
  const samplePath =
    sampleArgIdx !== -1 && process.argv[sampleArgIdx + 1]
      ? path.resolve(process.cwd(), process.argv[sampleArgIdx + 1])
      : DEFAULT_SAMPLE_PATH;

  if (fs.existsSync(QUERIES_PATH) && !force) {
    console.log(
      `${QUERIES_PATH} already exists; refusing to regenerate (pass --force to overwrite).`
    );
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required to generate evaluation queries.');
  }

  const postings: RawJobPosting[] = fs
    .readFileSync(samplePath, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0)
    .map((l) => JSON.parse(l));

  // Index exact duplicate content_hashes so gold includes exact duplicates if any exist
  const byHash = new Map<string, string[]>();
  for (const p of postings) {
    const list = byHash.get(p.content_hash) || [];
    list.push(p.source_id);
    byHash.set(p.content_hash, list);
  }

  // Stratified selection of 200 postings across all categories (round-robin from the end of each category
  // so held-out targets are deterministic and evenly distributed across all 12 categories)
  const byCat = new Map<string, RawJobPosting[]>();
  for (const p of postings) {
    const arr = byCat.get(p.category) || [];
    arr.push(p);
    byCat.set(p.category, arr);
  }

  const categories = Array.from(byCat.keys()).sort();
  const selected: RawJobPosting[] = [];
  for (let offset = 1; selected.length < 200; offset++) {
    let added = false;
    for (const cat of categories) {
      const arr = byCat.get(cat)!;
      const idx = arr.length - offset;
      if (idx >= 0 && selected.length < 200) {
        selected.push(arr[idx]);
        added = true;
      }
    }
    if (!added) break;
  }

  if (selected.length < 200) {
    throw new Error(`Expected at least 200 postings in corpus, got ${selected.length}`);
  }

  // Assign styles in round-robin across categories: 67 keyword, 67 paraphrase, 66 resume = 200 total
  const stylesOrder: QueryStyle[] = ['keyword', 'paraphrase', 'resume'];
  const grouped: Record<QueryStyle, RawJobPosting[]> = {
    keyword: [],
    paraphrase: [],
    resume: [],
  };

  for (let i = 0; i < selected.length; i++) {
    const style = stylesOrder[i % 3];
    grouped[style].push(selected[i]);
  }

  console.log(
    `Generating 200 queries (keyword=${grouped.keyword.length}, paraphrase=${grouped.paraphrase.length}, resume=${grouped.resume.length}) using ${GEMINI_GEN_MODEL}...`
  );

  const generatedMap = new Map<string, { style: QueryStyle; query: string }>();

  // Load any previously checkpointed query generations
  if (fs.existsSync(CHECKPOINT_PATH)) {
    for (const line of fs.readFileSync(CHECKPOINT_PATH, 'utf8').split(/\r?\n/)) {
      if (!line.trim()) continue;
      try {
        const item = JSON.parse(line) as { source_id: string; style: QueryStyle; query: string };
        if (item.source_id && item.query) {
          generatedMap.set(item.source_id, { style: item.style, query: item.query });
        }
      } catch {
        // ignore
      }
    }
    if (generatedMap.size > 0) {
      console.log(`Loaded ${generatedMap.size} cached generated queries from checkpoint.`);
    }
  }

  const batchSize = 25;

  for (const style of stylesOrder) {
    const remaining = grouped[style].filter((p) => !generatedMap.has(p.source_id));
    const totalBatches = Math.ceil(remaining.length / batchSize);
    for (let b = 0; b < totalBatches; b++) {
      const slice = remaining.slice(b * batchSize, (b + 1) * batchSize);
      const batchRes = await callGeminiBatch(apiKey, style, slice);
      const checkpointLines: string[] = [];
      for (const p of slice) {
        const q = batchRes.get(p.source_id) || deterministicFallbackKeyword(p);
        generatedMap.set(p.source_id, { style, query: q });
        checkpointLines.push(JSON.stringify({ source_id: p.source_id, style, query: q }));
      }
      fs.mkdirSync(path.dirname(CHECKPOINT_PATH), { recursive: true });
      fs.appendFileSync(CHECKPOINT_PATH, checkpointLines.join('\n') + '\n', 'utf8');
      console.log(`  [${style}] batch ${b + 1}/${totalBatches} done (${generatedMap.size}/200 total)`);
      // Stay comfortably under free-tier 5 RPM limit
      if (b < totalBatches - 1 || style !== 'resume') {
        await new Promise((r) => setTimeout(r, 13_000));
      }
    }
  }

  let resumeTagCount = 0;
  const queries: EvalQuery[] = selected.map((p, idx) => {
    const entry = generatedMap.get(p.source_id)!;
    const isResume = entry.style === 'resume';
    const useForCatPrec = isResume && resumeTagCount < 50;
    if (useForCatPrec) resumeTagCount++;

    return {
      id: `q-${String(idx + 1).padStart(3, '0')}`,
      style: entry.style,
      query: entry.query,
      goldSourceIds: byHash.get(p.content_hash) || [p.source_id],
      sourceTitle: p.title,
      sourceCompany: p.company,
      category: p.category,
      useForCategoryPrecision: useForCatPrec,
    };
  });

  const outFile: EvalQueryFile = {
    generatedAt: new Date().toISOString(),
    generatorModel: GEMINI_GEN_MODEL,
    corpusFile: path.relative(process.cwd(), samplePath).replace(/\\/g, '/'),
    corpusSize: postings.length,
    totalQueries: queries.length,
    styleCounts: {
      keyword: queries.filter((q) => q.style === 'keyword').length,
      paraphrase: queries.filter((q) => q.style === 'paraphrase').length,
      resume: queries.filter((q) => q.style === 'resume').length,
    },
    categoryPrecisionCount: resumeTagCount,
    prompts: PROMPTS,
    queries,
  };

  fs.mkdirSync(path.dirname(QUERIES_PATH), { recursive: true });
  fs.writeFileSync(QUERIES_PATH, JSON.stringify(outFile, null, 2) + '\n', 'utf8');

  console.log(`\nSaved ${queries.length} queries to ${QUERIES_PATH}`);
  console.log(
    JSON.stringify(
      {
        totalQueries: outFile.totalQueries,
        styleCounts: outFile.styleCounts,
        categoryPrecisionCount: outFile.categoryPrecisionCount,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error('[generate-queries] Error:', err);
  process.exit(1);
});
