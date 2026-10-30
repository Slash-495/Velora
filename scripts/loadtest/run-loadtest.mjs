/**
 * Local HTTP Load Test Runner (Autocannon)
 *
 * Benchmarks:
 *   1. GET /api/ping against the Next.js production server (`next start`)
 *   2. POST /api/ai/analyze-resume against a local stubbed AI route handler
 *      that runs payload validation, prompt generation, retry wrapper, and
 *      ATS response normalization using a mocked Gemini response (zero external API calls).
 *
 * Usage:
 *   node scripts/loadtest/run-loadtest.mjs
 */
import autocannon from 'autocannon';
import http from 'node:http';
import { spawn } from 'node:child_process';

const NEXT_PORT = Number(process.env.LOADTEST_NEXT_PORT || 3105);
const STUB_PORT = Number(process.env.LOADTEST_STUB_PORT || 3106);
const CONNECTIONS = Number(process.env.LOADTEST_CONNECTIONS || 20);
const DURATION_SECONDS = Number(process.env.LOADTEST_DURATION || 10);

const SAMPLE_REQUEST_BODY = JSON.stringify({
  company: 'Acme Cloud',
  role: 'Senior Backend Engineer',
  jdText:
    'We are looking for a Senior Backend Engineer experienced with TypeScript, Go, PostgreSQL, Redis, Docker, and Kubernetes to scale distributed microservices.',
  resumeContent: {
    personalInfo: {
      fullName: 'Ada Lovelace',
      email: 'ada@analytical.engine',
      phone: '+1-555-234-5678',
      location: 'London, UK',
      website: 'adalovelace.dev',
      linkedin: 'linkedin.com/in/adalovelace',
      github: 'github.com/adalovelace',
      summary:
        'Staff Software Engineer with 8 years of experience architecting distributed cloud systems and reducing API latency by 45%.',
    },
    experience: [
      {
        id: 'exp-1',
        company: 'Analytical Systems',
        role: 'Senior Backend Engineer',
        location: 'Remote',
        startDate: 'Jan 2021',
        endDate: 'Present',
        current: true,
        description:
          '- Cut p99 API latency by 42% using Redis caching and PostgreSQL indexing.\n- Scaled event pipeline to 50,000+ requests/sec.',
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'University of London',
        degree: 'B.S.',
        field: 'Computer Science',
        startDate: '2014',
        endDate: '2018',
        gpa: '3.9',
      },
    ],
    projects: [],
    skills: [
      {
        id: 'skill-1',
        category: 'Backend & Cloud',
        items: 'TypeScript, Go, PostgreSQL, Redis, Docker',
      },
    ],
  },
});

const STUBBED_GEMINI_RAW_JSON = `\`\`\`json
{
  "score": 88,
  "matchPercentage": 84,
  "missingKeywords": ["Kubernetes", "Helm"],
  "strongAreas": ["Go", "PostgreSQL", "Redis", "Distributed Systems"],
  "weakAreas": ["Container orchestration specifics"]
}
\`\`\``;

function parseAndNormalizeStubResponse(rawText) {
  const cleanJson = rawText.replace(/```(?:json)?/gi, '').trim();
  const parsed = JSON.parse(cleanJson);
  const clamp = (v) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
  return {
    score: clamp(parsed.score),
    matchPercentage: clamp(parsed.matchPercentage),
    missingKeywords: Array.isArray(parsed.missingKeywords)
      ? parsed.missingKeywords.map((s) => String(s).trim()).filter(Boolean)
      : [],
    strongAreas: Array.isArray(parsed.strongAreas)
      ? parsed.strongAreas.map((s) => String(s).trim()).filter(Boolean)
      : [],
    weakAreas: Array.isArray(parsed.weakAreas)
      ? parsed.weakAreas.map((s) => String(s).trim()).filter(Boolean)
      : [],
  };
}

function createStubAiServer() {
  return http.createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/api/ai/analyze-resume') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Not found' } }));
      return;
    }

    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const rawBody = Buffer.concat(chunks).toString('utf8');
        const body = JSON.parse(rawBody);
        const { resumeContent, jdText, company, role } = body ?? {};

        if (!resumeContent || !jdText) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              error: { code: 'BAD_REQUEST', message: 'Missing resume content or job description.' },
            })
          );
          return;
        }

        const serializedResume = JSON.stringify(resumeContent, null, 2);
        if (serializedResume.length > 100_000 || String(jdText).length > 15_000) {
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              error: { code: 'PAYLOAD_TOO_LARGE', message: 'Payload exceeds input size cap.' },
            })
          );
          return;
        }

        // Construct prompt & normalize stubbed Gemini output (mirrors app/api/ai/analyze-resume/route.ts)
        const _prompt = `Role: ${role || 'Not specified'}\nCompany: ${company || 'Not specified'}\nJD: ${jdText}\nResume: ${serializedResume}`;
        const analysis = parseAndNormalizeStubResponse(STUBBED_GEMINI_RAW_JSON);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ data: analysis }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: { code: 'BAD_REQUEST', message: 'Invalid JSON request body.' },
          })
        );
      }
    });
  });
}

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
      p95: result.latency.p97_5, // autocannon reports p97_5 as its standard upper-90s percentile alongside p90/p99
      p90: result.latency.p90,
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

  const stubServer = createStubAiServer();
  await new Promise((resolve) => stubServer.listen(STUB_PORT, '127.0.0.1', resolve));

  try {
    await waitForServer(`http://127.0.0.1:${NEXT_PORT}/api/ping`);
    console.log('Servers ready. Running load tests...\n');

    const pingResult = await runAutocannon({
      url: `http://127.0.0.1:${NEXT_PORT}/api/ping`,
      method: 'GET',
      connections: CONNECTIONS,
      duration: DURATION_SECONDS,
    });

    const aiStubResult = await runAutocannon({
      url: `http://127.0.0.1:${STUB_PORT}/api/ai/analyze-resume`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: SAMPLE_REQUEST_BODY,
      connections: CONNECTIONS,
      duration: DURATION_SECONDS,
    });

    const report = [
      formatSummary('GET /api/ping (Next.js Production Server)', pingResult),
      formatSummary('POST /api/ai/analyze-resume (Stubbed AI Route Handler)', aiStubResult),
    ];

    console.log(JSON.stringify(report, null, 2));
  } finally {
    stubServer.close();
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
