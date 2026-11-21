/**
 * Benchmark 5 (Optional): Lighthouse Mobile Scores on Local Production Build
 *
 * Starts `next start` on a local port and runs Lighthouse CLI (mobile preset)
 * against `/` and `/sign-in`, outputting Performance, Accessibility,
 * Best Practices, and SEO scores.
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.BENCH_LIGHTHOUSE_PORT || 3107);
const ROUTES = ['/', '/sign-in'];

async function waitForHttp(url, timeoutMs = 25_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      if (res.status >= 200 && res.status < 500) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function main() {
  const nextProc = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['next', 'start', '-p', String(PORT)],
    {
      stdio: 'ignore',
      shell: process.platform === 'win32',
    }
  );

  const results = [];
  const tmpDir = path.join(process.cwd(), 'bench', '.tmp-lighthouse');
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    await waitForHttp(`http://127.0.0.1:${PORT}/`);

    for (const route of ROUTES) {
      const slug = route === '/' ? 'home' : route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
      const outPath = path.join(tmpDir, `${slug}.json`);
      const url = `http://127.0.0.1:${PORT}${route}`;

      console.log(`Running Lighthouse (mobile) against ${url}...`);
      const run = spawnSync(
        process.platform === 'win32' ? 'npx.cmd' : 'npx',
        [
          '-y',
          'lighthouse@12',
          url,
          '--only-categories=performance,accessibility,best-practices,seo',
          '--form-factor=mobile',
          '--output=json',
          `--output-path=${outPath}`,
          '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
          '--quiet',
        ],
        {
          encoding: 'utf8',
          shell: process.platform === 'win32',
          timeout: 120_000,
        }
      );

      if (run.status !== 0 || !fs.existsSync(outPath)) {
        throw new Error(
          `Lighthouse failed for ${url} (exit=${run.status}): ${run.stderr || run.stdout}`
        );
      }

      const report = JSON.parse(fs.readFileSync(outPath, 'utf8'));
      const cats = report.categories;
      const audits = report.audits;
      results.push({
        route,
        performance: Math.round((cats.performance?.score ?? 0) * 100),
        accessibility: Math.round((cats.accessibility?.score ?? 0) * 100),
        bestPractices: Math.round((cats['best-practices']?.score ?? 0) * 100),
        seo: Math.round((cats.seo?.score ?? 0) * 100),
        fcpMs: Math.round(audits['first-contentful-paint']?.numericValue ?? 0),
        lcpMs: Math.round(audits['largest-contentful-paint']?.numericValue ?? 0),
        tbtMs: Math.round(audits['total-blocking-time']?.numericValue ?? 0),
        cls: Number((audits['cumulative-layout-shift']?.numericValue ?? 0).toFixed(4)),
      });
    }

    console.table(results);
    console.log(JSON.stringify({ results }, null, 2));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    if (process.platform === 'win32' && nextProc.pid) {
      spawn('taskkill', ['/pid', String(nextProc.pid), '/f', '/t'], {
        stdio: 'ignore',
      });
    } else {
      nextProc.kill('SIGTERM');
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
