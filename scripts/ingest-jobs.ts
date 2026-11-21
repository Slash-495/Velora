/**
 * Idempotent Job Postings Ingestion Script (`scripts/ingest-jobs.ts`)
 *
 * Dataset: `lang-uk/recruitment-dataset-job-descriptions-english` (Djinni English Job Descriptions)
 * Source:  https://huggingface.co/datasets/lang-uk/recruitment-dataset-job-descriptions-english
 * License: MIT
 *
 * Features:
 * - Downloads the dataset Parquet once to `bench/job-search/.cache/djinni-en.parquet`
 * - Deterministically samples `--limit` postings (default 10,000) balanced across 12 categories
 * - Computes SHA-256 `content_hash` for idempotent upsert: skips unchanged rows in DB
 * - Persists embeddings on disk (`bench/job-search/.cache/embeddings-cache.jsonl`) after every batch
 * - Throttles `gemini-embedding-001` (`batchEmbedContents`, 768 dims) to stay within free-tier RPM/TPM
 * - Writes via local Supabase `service_role` client (enforcing RLS write restriction)
 *
 * Usage:
 *   npx tsx scripts/ingest-jobs.ts --limit 10000
 *   npx tsx scripts/ingest-jobs.ts --limit 480 --truncate --export-sample bench/job-search/.cache/sample-480.jsonl
 *   npx tsx scripts/ingest-jobs.ts --input bench/job-search/.cache/sample-480-modified.jsonl
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { asyncBufferFromFile, parquetReadObjects } from 'hyparquet';
import { compressors } from 'hyparquet-compressors';
import {
  createAdminClient,
  getLocalSupabaseEnv,
} from '../bench/lib/supabase-env';
import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
  embedBatch,
  toPgVector,
} from '../lib/embeddings';

export const DATASET_NAME = 'lang-uk/recruitment-dataset-job-descriptions-english';
export const DATASET_LICENSE = 'MIT';
export const DATASET_PARQUET_URL =
  'https://huggingface.co/datasets/lang-uk/recruitment-dataset-job-descriptions-english/resolve/main/data/train-00000-of-00001.parquet';

export const TARGET_CATEGORIES = [
  'JavaScript',
  'Python',
  'Java',
  'DevOps',
  'QA Automation',
  'Marketing',
  'Design',
  'Sales',
  'HR',
  'Data Science',
  'Product Manager',
  'Android',
] as const;

export interface RawJobPosting {
  source_id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  category: string;
  content_hash: string;
}

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

export function computeContentHash(posting: {
  title: string;
  company: string;
  location: string;
  category: string;
  description: string;
}): string {
  return crypto
    .createHash('sha256')
    .update(
      `${posting.title}\n${posting.company}\n${posting.location}\n${posting.category}\n${posting.description}`
    )
    .digest('hex');
}

export function buildEmbeddingText(posting: RawJobPosting): string {
  const desc = posting.description.replace(/\s+/g, ' ').trim().slice(0, 1100);
  return `Title: ${posting.title}\nCategory: ${posting.category}\nCompany: ${posting.company}\nDescription: ${desc}`;
}

interface CliArgs {
  limit: number;
  batchSize: number;
  rpm: number;
  cachePath: string;
  parquetPath: string;
  inputPath: string | null;
  exportSamplePath: string | null;
  truncate: boolean;
  skipDb: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    limit: 10_000,
    batchSize: 45,
    rpm: 85,
    cachePath: path.resolve(
      process.cwd(),
      'bench/job-search/.cache/embeddings-cache.jsonl'
    ),
    parquetPath: path.resolve(
      process.cwd(),
      'bench/job-search/.cache/djinni-en.parquet'
    ),
    inputPath: null,
    exportSamplePath: null,
    truncate: false,
    skipDb: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const next = argv[i + 1];
    if (flag === '--limit' && next) {
      args.limit = Math.max(1, Number(next));
      i++;
    } else if (flag === '--batch-size' && next) {
      args.batchSize = Math.min(100, Math.max(1, Number(next)));
      i++;
    } else if (flag === '--rpm' && next) {
      args.rpm = Math.max(1, Number(next));
      i++;
    } else if (flag === '--cache' && next) {
      args.cachePath = path.resolve(process.cwd(), next);
      i++;
    } else if (flag === '--parquet' && next) {
      args.parquetPath = path.resolve(process.cwd(), next);
      i++;
    } else if (flag === '--input' && next) {
      args.inputPath = path.resolve(process.cwd(), next);
      i++;
    } else if (flag === '--export-sample' && next) {
      args.exportSamplePath = path.resolve(process.cwd(), next);
      i++;
    } else if (flag === '--truncate') {
      args.truncate = true;
    } else if (flag === '--skip-db') {
      args.skipDb = true;
    }
  }
  return args;
}

async function ensureParquetDownloaded(parquetPath: string): Promise<void> {
  if (fs.existsSync(parquetPath) && fs.statSync(parquetPath).size > 1_000_000) {
    return;
  }
  fs.mkdirSync(path.dirname(parquetPath), { recursive: true });
  console.log(`Downloading ${DATASET_NAME} (${DATASET_LICENSE})...`);
  const res = await fetch(DATASET_PARQUET_URL);
  if (!res.ok || !res.body) {
    throw new Error(`Failed to download dataset parquet: HTTP ${res.status}`);
  }
  const tmpPath = `${parquetPath}.part`;
  await pipeline(
    Readable.fromWeb(res.body as any),
    fs.createWriteStream(tmpPath)
  );
  fs.renameSync(tmpPath, parquetPath);
  const sizeMb = (fs.statSync(parquetPath).size / (1024 * 1024)).toFixed(1);
  console.log(`Downloaded dataset parquet (${sizeMb} MB) to ${parquetPath}`);
}

async function samplePostingsFromParquet(
  parquetPath: string,
  limit: number
): Promise<RawJobPosting[]> {
  const file = await asyncBufferFromFile(parquetPath);
  const targetSet = new Set<string>(TARGET_CATEGORIES);
  const perCategoryTarget = Math.ceil(limit / TARGET_CATEGORIES.length);

  const buckets = new Map<string, RawJobPosting[]>();
  for (const cat of TARGET_CATEGORIES) {
    buckets.set(cat, []);
  }

  const seenSourceIds = new Set<string>();
  const seenHashes = new Set<string>();

  const rows = await parquetReadObjects({
    file,
    compressors,
    columns: [
      'id',
      'Position',
      'Company Name',
      'Long Description',
      'Primary Keyword',
      'Long Description_lang',
    ],
  });

  for (const r of rows as Record<string, any>[]) {
    const category = String(r['Primary Keyword'] || '').trim();
    if (!targetSet.has(category)) continue;

    const bucket = buckets.get(category)!;
    if (bucket.length >= perCategoryTarget) continue;

    if (r['Long Description_lang'] && String(r['Long Description_lang']) !== 'en') {
      continue;
    }

    const sourceId = String(r['id'] || '').trim();
    const title = String(r['Position'] || '').trim().slice(0, 200);
    const company = String(r['Company Name'] || '').trim().slice(0, 160) || 'Unknown Company';
    const description = String(r['Long Description'] || '').trim();
    const location = 'Remote / Unspecified';

    if (!sourceId || !title || description.length < 180) continue;
    if (seenSourceIds.has(sourceId)) continue;

    const cleanDesc = description.slice(0, 6000);
    const contentHash = computeContentHash({
      title,
      company,
      location,
      category,
      description: cleanDesc,
    });
    if (seenHashes.has(contentHash)) continue;

    seenSourceIds.add(sourceId);
    seenHashes.add(contentHash);

    bucket.push({
      source_id: sourceId,
      title,
      company,
      location,
      description: cleanDesc,
      category,
      content_hash: contentHash,
    });

    // Check if all buckets are full
    let allFull = true;
    for (const b of buckets.values()) {
      if (b.length < perCategoryTarget) {
        allFull = false;
        break;
      }
    }
    if (allFull) break;
  }

  // Round-robin interleave across categories so exact `--limit` stays balanced
  const sampled: RawJobPosting[] = [];
  for (let idx = 0; sampled.length < limit; idx++) {
    let addedInPass = false;
    for (const cat of TARGET_CATEGORIES) {
      const b = buckets.get(cat)!;
      if (idx < b.length && sampled.length < limit) {
        sampled.push(b[idx]);
        addedInPass = true;
      }
    }
    if (!addedInPass) break;
  }

  return sampled;
}

function loadPostingsFromJsonl(filePath: string, limit: number): RawJobPosting[] {
  const lines = fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  const out: RawJobPosting[] = [];
  for (const line of lines) {
    if (out.length >= limit) break;
    const obj = JSON.parse(line);
    const title = String(obj.title || '').trim();
    const company = String(obj.company || '').trim();
    const location = String(obj.location || '').trim();
    const description = String(obj.description || '').trim();
    const category = String(obj.category || '').trim();
    const source_id = String(obj.source_id || '').trim();
    const content_hash =
      typeof obj.content_hash === 'string' && obj.content_hash.length === 64
        ? obj.content_hash
        : computeContentHash({ title, company, location, category, description });
    out.push({
      source_id,
      title,
      company,
      location,
      description,
      category,
      content_hash,
    });
  }
  return out;
}

function loadEmbeddingCache(cachePath: string): Map<string, number[]> {
  const cache = new Map<string, number[]>();
  if (!fs.existsSync(cachePath)) return cache;
  const lines = fs.readFileSync(cachePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line) as {
        content_hash: string;
        model?: string;
        embedding: number[];
      };
      if (
        parsed.content_hash &&
        Array.isArray(parsed.embedding) &&
        parsed.embedding.length === EMBEDDING_DIMENSIONS &&
        (!parsed.model || parsed.model === EMBEDDING_MODEL)
      ) {
        cache.set(parsed.content_hash, parsed.embedding);
      }
    } catch {
      // skip malformed trailing line if previous run interrupted mid-write
    }
  }
  return cache;
}

function appendEmbeddingCache(
  cachePath: string,
  entries: Array<{ content_hash: string; embedding: number[] }>
): void {
  if (entries.length === 0) return;
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  const payload =
    entries
      .map((e) =>
        JSON.stringify({
          content_hash: e.content_hash,
          model: EMBEDDING_MODEL,
          embedding: e.embedding.map((v) => Number(v.toFixed(7))),
        })
      )
      .join('\n') + '\n';
  fs.appendFileSync(cachePath, payload, 'utf8');
}

async function fetchExistingHashes(
  admin: ReturnType<typeof createAdminClient>
): Promise<Map<string, string>> {
  const existing = new Map<string, string>();
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await admin
      .from('job_postings')
      .select('source_id, content_hash')
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`Failed to fetch existing job_postings: ${error.message}`);
    }
    const rows = (data || []) as Array<{ source_id: string; content_hash: string }>;
    for (const r of rows) {
      existing.set(r.source_id, r.content_hash);
    }
    if (rows.length < pageSize) break;
    from += pageSize;
  }

  return existing;
}

async function upsertBatchToDb(
  admin: ReturnType<typeof createAdminClient>,
  rows: Array<RawJobPosting & { embedding: number[] }>
): Promise<void> {
  const chunkSize = 100;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize).map((r) => ({
      source_id: r.source_id,
      title: r.title,
      company: r.company,
      location: r.location,
      description: r.description,
      category: r.category,
      content_hash: r.content_hash,
      embedding: toPgVector(r.embedding),
    }));

    const { error } = await admin
      .from('job_postings')
      .upsert(chunk, { onConflict: 'source_id' });

    if (error) {
      throw new Error(`Failed to upsert job_postings batch: ${error.message}`);
    }
  }
}

async function main() {
  loadEnvFiles();
  const args = parseArgs(process.argv.slice(2));
  const startTime = Date.now();

  let postings: RawJobPosting[];
  if (args.inputPath) {
    console.log(`Loading postings from ${args.inputPath}...`);
    postings = loadPostingsFromJsonl(args.inputPath, args.limit);
  } else {
    await ensureParquetDownloaded(args.parquetPath);
    console.log(
      `Sampling up to ${args.limit} postings across ${TARGET_CATEGORIES.length} categories...`
    );
    postings = await samplePostingsFromParquet(args.parquetPath, args.limit);
  }

  const categoryCounts: Record<string, number> = {};
  for (const p of postings) {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  }

  if (args.exportSamplePath) {
    fs.mkdirSync(path.dirname(args.exportSamplePath), { recursive: true });
    fs.writeFileSync(
      args.exportSamplePath,
      postings.map((p) => JSON.stringify(p)).join('\n') + '\n',
      'utf8'
    );
    console.log(`Exported ${postings.length} sampled postings to ${args.exportSamplePath}`);
  }

  const env = args.skipDb ? null : getLocalSupabaseEnv();
  const admin = env ? createAdminClient(env) : null;

  if (admin && args.truncate) {
    console.log('Truncating existing public.job_postings rows (--truncate)...');
    const { error } = await admin
      .from('job_postings')
      .delete()
      .neq('source_id', '__never_match__');
    if (error) {
      throw new Error(`Failed to clear job_postings: ${error.message}`);
    }
  }

  const existingHashes = admin ? await fetchExistingHashes(admin) : new Map<string, string>();
  const diskCache = loadEmbeddingCache(args.cachePath);

  const skippedUnchanged: RawJobPosting[] = [];
  const toUpsertFromCache: Array<RawJobPosting & { embedding: number[] }> = [];
  const needsApiEmbedding: RawJobPosting[] = [];

  for (const p of postings) {
    if (existingHashes.get(p.source_id) === p.content_hash) {
      skippedUnchanged.push(p);
      continue;
    }
    const cached = diskCache.get(p.content_hash);
    if (cached) {
      toUpsertFromCache.push({ ...p, embedding: cached });
    } else {
      needsApiEmbedding.push(p);
    }
  }

  console.log(
    `Plan: total=${postings.length} | skipped_unchanged=${skippedUnchanged.length} | disk_cache_hits=${toUpsertFromCache.length} | needs_api_embed=${needsApiEmbedding.length}`
  );

  // Upsert disk-cache hits immediately
  if (admin && toUpsertFromCache.length > 0) {
    await upsertBatchToDb(admin, toUpsertFromCache);
  }

  // Embed remaining rows in throttled batches, persisting to cache + DB after every batch
  const throttleDelayMs = Math.ceil((args.batchSize / args.rpm) * 60_000);
  let embeddedViaApi = 0;
  let apiBatchCalls = 0;

  if (needsApiEmbedding.length > 0) {
    const totalBatches = Math.ceil(needsApiEmbedding.length / args.batchSize);
    console.log(
      `Embedding ${needsApiEmbedding.length} postings with ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSIONS}d) in ${totalBatches} batches (batchSize=${args.batchSize}, throttle=${throttleDelayMs}ms)...`
    );

    for (let b = 0; b < totalBatches; b++) {
      const batchStart = Date.now();
      const slice = needsApiEmbedding.slice(
        b * args.batchSize,
        (b + 1) * args.batchSize
      );
      const texts = slice.map(buildEmbeddingText);

      const vectors = await embedBatch(texts, {
        taskType: 'RETRIEVAL_DOCUMENT',
        batchSize: slice.length,
        maxRetries: 5,
        initialDelayMs: 2000,
      });
      apiBatchCalls++;

      const cacheEntries: Array<{ content_hash: string; embedding: number[] }> = [];
      const dbRows: Array<RawJobPosting & { embedding: number[] }> = [];

      for (let i = 0; i < slice.length; i++) {
        const posting = slice[i];
        const embedding = vectors[i];
        diskCache.set(posting.content_hash, embedding);
        cacheEntries.push({ content_hash: posting.content_hash, embedding });
        dbRows.push({ ...posting, embedding });
      }

      appendEmbeddingCache(args.cachePath, cacheEntries);
      if (admin) {
        await upsertBatchToDb(admin, dbRows);
      }

      embeddedViaApi += slice.length;
      console.log(
        `  Batch ${b + 1}/${totalBatches} complete (${embeddedViaApi}/${needsApiEmbedding.length} embedded)`
      );

      if (b < totalBatches - 1) {
        const elapsed = Date.now() - batchStart;
        const waitMs = throttleDelayMs - elapsed;
        if (waitMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, waitMs));
        }
      }
    }
  }

  const durationSec = Math.round(((Date.now() - startTime) / 1000) * 100) / 100;
  const fullReembedItemCalls = postings.length;
  const actualItemCalls = embeddedViaApi;
  const itemCallsSaved = fullReembedItemCalls - actualItemCalls;
  const savedPct =
    fullReembedItemCalls > 0
      ? Number(((itemCallsSaved / fullReembedItemCalls) * 100).toFixed(2))
      : 0;

  const summary = {
    dataset: DATASET_NAME,
    license: DATASET_LICENSE,
    model: EMBEDDING_MODEL,
    dimensions: EMBEDDING_DIMENSIONS,
    totalInput: postings.length,
    categoriesCount: Object.keys(categoryCounts).length,
    categoryCounts,
    skippedUnchanged: skippedUnchanged.length,
    diskCacheHits: toUpsertFromCache.length,
    embeddedViaApi,
    apiBatchCalls,
    upsertedRows: toUpsertFromCache.length + embeddedViaApi,
    fullReembedItemCalls,
    embeddingItemCallsSaved: itemCallsSaved,
    embeddingItemCallsSavedPct: savedPct,
    durationSec,
  };

  console.log('\n=== Ingestion Summary ===');
  console.log(JSON.stringify(summary, null, 2));
}

const isDirectRun =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  typeof process.argv[1] === 'string' &&
  process.argv[1].replace(/\\/g, '/').endsWith('scripts/ingest-jobs.ts');

if (isDirectRun) {
  main().catch((err) => {
    console.error('[ingest-jobs] Error:', err);
    process.exit(1);
  });
}
