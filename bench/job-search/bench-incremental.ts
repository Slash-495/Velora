/**
 * Benchmark 7e: Incremental Update Ingestion (`bench/job-search/bench-incremental.ts`)
 *
 * Modifies exactly 5% of the ingested job postings (changing their description & `content_hash`),
 * runs `scripts/ingest-jobs.ts --input <modified>`, reports exact embedded vs skipped counts
 * and embedding API calls saved vs a full re-embed, then restores the original unmodified rows
 * cleanly from the on-disk embedding cache (0 extra Gemini API calls).
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { computeContentHash, type RawJobPosting } from '../../scripts/ingest-jobs';

const BASE_SAMPLE = path.resolve(
  process.cwd(),
  'bench/job-search/.cache/sample-480.jsonl'
);
const MODIFIED_SAMPLE = path.resolve(
  process.cwd(),
  'bench/job-search/.cache/sample-480-modified-5pct.jsonl'
);

function main() {
  if (!fs.existsSync(BASE_SAMPLE)) {
    throw new Error(`Missing base sample at ${BASE_SAMPLE}. Run initial ingestion first.`);
  }

  const baseRows: RawJobPosting[] = fs
    .readFileSync(BASE_SAMPLE, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0)
    .map((l) => JSON.parse(l));

  const changeCount = Math.max(1, Math.round(baseRows.length * 0.05));
  const runStamp = new Date().toISOString().slice(0, 10);

  const modifiedRows = baseRows.map((row, idx) => {
    if (idx >= changeCount) return row;
    const updatedDescription = `${row.description}\n\n[Incremental Update ${runStamp}] Updated role scope: additional experience with cloud observability, CI/CD automation, and cross-functional architecture reviews.`;
    const updatedHash = computeContentHash({
      title: row.title,
      company: row.company,
      location: row.location,
      category: row.category,
      description: updatedDescription,
    });
    return {
      ...row,
      description: updatedDescription,
      content_hash: updatedHash,
    };
  });

  fs.writeFileSync(
    MODIFIED_SAMPLE,
    modifiedRows.map((r) => JSON.stringify(r)).join('\n') + '\n',
    'utf8'
  );

  console.log(
    `=== 7e. Incremental Update Test: modified ${changeCount}/${baseRows.length} (${((changeCount / baseRows.length) * 100).toFixed(1)}%) postings ===`
  );

  // Run ingestion on the 5%-modified file
  const runInc = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    [
      'tsx',
      'scripts/ingest-jobs.ts',
      '--limit',
      String(baseRows.length),
      '--input',
      MODIFIED_SAMPLE,
    ],
    {
      encoding: 'utf8',
      stdio: 'inherit',
      shell: process.platform === 'win32',
    }
  );

  if (runInc.status !== 0) {
    throw new Error(`Incremental ingestion failed with exit code ${runInc.status}`);
  }

  // Restore original unmodified rows from on-disk cache (0 API calls) so DB stays clean
  console.log('\nRestoring original unmodified sample from on-disk cache (0 API calls)...');
  const runRestore = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    [
      'tsx',
      'scripts/ingest-jobs.ts',
      '--limit',
      String(baseRows.length),
      '--input',
      BASE_SAMPLE,
    ],
    {
      encoding: 'utf8',
      stdio: 'inherit',
      shell: process.platform === 'win32',
    }
  );

  if (runRestore.status !== 0) {
    throw new Error(`Restore run failed with exit code ${runRestore.status}`);
  }
}

main();
