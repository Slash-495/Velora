/**
 * Local HTTP Load Test Runner (Autocannon)
 *
 * Benchmarks `GET /api/ping` against the real Next.js production server (`next start`).
 *
 * Usage:
 *   npm run loadtest
 */
import autocannon from 'autocannon';
import { spawn } from 'node:child_process';

const NEXT_PORT = Number(process.env.LOADTEST_NEXT_PORT || 3105);
const CONNECTIONS = Number(process.env.LOADTEST_CONNECTIONS || 20);
const DURATION_SECONDS = Number(process.env.LOADTEST_DURATION || 10);

async function waitForServer(url, timeoutMs = 20_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // retry until ready
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

function runAutocannon(options) {
  return new Promise((resolve, reject) => {
    autocannon(options, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

function formatSummary(title, result) {
  const totalReqs = result.requests.total;
  const non2xx = result.non2xx || 0;
  const errors = result.errors || 0;
  const timeouts = result.timeouts || 0;
  const failedCount = non2xx + errors + timeouts;
  const errorRatePct = totalReqs > 0 ? ((failedCount / totalReqs) * 100).toFixed(2) : '0.00';

  return {
    scenario: title,
    connections: CONNECTIONS,
    durationSeconds: result.duration,
    totalRequests: totalReqs,
    requestsPerSecAvg: result.requests.average,
    latencyMs: {
      p50: result.latency.p50,
      p90: result.latency.p90,
      p95: result.latency.p97_5,
      p97_5: result.latency.p97_5,
      p99: result.latency.p99,
      average: result.latency.average,
      max: result.latency.max,
    },
    errors,
    timeouts,
    non2xx,
    errorRatePercent: `${errorRatePct}%`,
  };
}

async function main() {
  console.log(`Starting Next.js production server on port ${NEXT_PORT}...`);
  const nextProc = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['next', 'start', '-p', String(NEXT_PORT)],
    {
      stdio: 'ignore',
      shell: process.platform === 'win32',
    }
  );

  try {
    await waitForServer(`http://127.0.0.1:${NEXT_PORT}/api/ping`);
    console.log('Server ready. Running load test against GET /api/ping...\n');

    const pingResult = await runAutocannon({
      url: `http://127.0.0.1:${NEXT_PORT}/api/ping`,
      method: 'GET',
      connections: CONNECTIONS,
      duration: DURATION_SECONDS,
    });

    const report = [formatSummary('GET /api/ping (Next.js Production Server)', pingResult)];

    console.log(JSON.stringify(report, null, 2));
  } finally {
    if (process.platform === 'win32' && nextProc.pid) {
      spawn('taskkill', ['/pid', String(nextProc.pid), '/f', '/t'], { stdio: 'ignore' });
    } else {
      nextProc.kill('SIGTERM');
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
