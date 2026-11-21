/**
 * Benchmark 3: Authenticated DB-Backed Route Latency & EXPLAIN ANALYZE
 *
 * 1. Seeds 10,000 `job_applications` rows and 20 `resumes` rows for Test User 1
 *    (plus 50 `job_applications` and 5 `resumes` for Test User 2 so multi-tenant RLS
 *    selectivity is realistic) against local Supabase Postgres.
 * 2. Runs `autocannon` (20 connections, 10s) against:
 *    a) Direct authenticated local Supabase PostgREST endpoints (the exact HTTP
 *       queries invoked by `lib/data/resumes.ts` and `lib/data/applications.ts`):
 *       - List Resumes (`GET /rest/v1/resumes?select=*&order=updated_at.desc`)
 *       - List Applications (`GET /rest/v1/job_applications?select=*&order=updated_at.desc`)
 *       - Save Resume (`PATCH /rest/v1/resumes?id=eq.<id>&select=*`)
 *    b) Authenticated Next.js production server (`next start`) routes against local Supabase:
 *       - `GET /dashboard/resume-studio` (with real `@supabase/ssr` auth cookie)
 *       - `GET /dashboard/applications` (with real `@supabase/ssr` auth cookie)
 *    (No `/api/ping`, no `/api/ai/*`.)
 * 3. Runs `EXPLAIN (ANALYZE, BUFFERS)` on the list queries both WITH and WITHOUT
 *    the `20260731000000_performance_indexes.sql` indexes on `job_applications`
 *    (restoring all indexes immediately afterward).
 */
import { createRequire } from 'node:module';
import { spawn, type ChildProcess } from 'node:child_process';
import { Client as PgClient } from 'pg';
import { ensureTestUsers, getLocalSupabaseEnv } from './lib/supabase-env';
import { mockResumes } from '../lib/mock-data';
import { defaultThemeConfig } from '../lib/templates';

const require = createRequire(import.meta.url);
const autocannon = require('autocannon') as (
  opts: Record<string, any>,
  cb: (err: Error | null, res: any) => void
) => void;
const histUtil = require('autocannon/lib/histUtil') as {
  decodeHist: (encoded: string) => { getValueAtPercentile: (p: number) => number } | null;
};

const CONNECTIONS = Number(process.env.BENCH_CONNECTIONS || 20);
const DURATION_SECONDS = Number(process.env.BENCH_DURATION || 10);
const NEXT_PORT = Number(process.env.BENCH_NEXT_PORT || 3106);
const SEED_COUNT_USER1 = 10_000;
const SEED_COUNT_USER2 = 50;

interface AutocannonSummary {
  name: string;
  target: string;
  connections: number;
  durationSec: number;
  totalRequests: number;
  reqPerSec: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  avgMs: number;
  maxMs: number;
  status2xx: number;
  non2xx: number;
  errors: number;
  timeouts: number;
  errorRatePct: string;
}

function runAutocannon(
  opts: Record<string, any>
): Promise<any> {
  return new Promise((resolve, reject) => {
    autocannon(opts, (err: Error | null, res: any) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

function summarizeAutocannon(
  name: string,
  target: string,
  res: any
): AutocannonSummary {
  let p50 = res.latency.p50;
  let p95 = res.latency.p97_5;
  let p99 = res.latency.p99;

  // Decode HDR histogram for true exact p50, p95, p99
  try {
    const hist = histUtil.decodeHist((res as any).latencies);
    if (hist) {
      p50 = hist.getValueAtPercentile(50);
      p95 = hist.getValueAtPercentile(95);
      p99 = hist.getValueAtPercentile(99);
    }
  } catch {
    // fallback to autocannon default percentiles
  }

  const total = res.requests.total;
  const non2xx = res.non2xx || 0;
  const errors = res.errors || 0;
  const timeouts = res.timeouts || 0;
  const attempts = total + errors + timeouts;
  const failed = non2xx + errors + timeouts;
  const errorRatePct =
    attempts > 0 ? `${((failed / attempts) * 100).toFixed(2)}%` : '0.00%';

  return {
    name,
    target,
    connections: CONNECTIONS,
    durationSec: res.duration,
    totalRequests: total,
    reqPerSec: Math.round(res.requests.average * 100) / 100,
    p50Ms: p50,
    p95Ms: p95,
    p99Ms: p99,
    avgMs: Math.round(res.latency.average * 100) / 100,
    maxMs: res.latency.max,
    status2xx: res['2xx'] || 0,
    non2xx,
    errors,
    timeouts,
    errorRatePct,
  };
}

async function waitForHttp(url: string, timeoutMs = 30_000): Promise<void> {
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

function buildSupabaseAuthCookieHeader(
  apiUrl: string,
  sessionPayload: Record<string, any>
): string {
  // @supabase/ssr@0.3.0 derives storage key `sb-<first-label>-auth-token`
  // and stores raw JSON.stringify(session) chunked at 3180 encoded bytes.
  const host = new URL(apiUrl).hostname;
  const storageKey = `sb-${host.split('.')[0]}-auth-token`;
  const rawJson = JSON.stringify(sessionPayload);
  let encoded = encodeURIComponent(rawJson);
  const chunkSize = 3180;
  if (encoded.length <= chunkSize) {
    return `${storageKey}=${encoded}`;
  }
  const chunks: string[] = [];
  let idx = 0;
  while (encoded.length > 0) {
    let head = encoded.slice(0, chunkSize);
    const lastPct = head.lastIndexOf('%');
    if (lastPct > chunkSize - 3) {
      head = head.slice(0, lastPct);
    }
    chunks.push(`${storageKey}.${idx}=${head}`);
    encoded = encoded.slice(head.length);
    idx++;
  }
  return chunks.join('; ');
}

async function seedDatabase(
  pg: PgClient,
  user1Id: string,
  user2Id: string
): Promise<{ saveResumeId: string }> {
  console.log(
    `Seeding ${SEED_COUNT_USER1} job_applications for user 1 and ${SEED_COUNT_USER2} for user 2...`
  );

  // Clean previous bench seed data for these users so repeated runs are deterministic
  await pg.query('DELETE FROM public.job_applications WHERE user_id = ANY($1::uuid[])', [
    [user1Id, user2Id],
  ]);
  await pg.query('DELETE FROM public.resumes WHERE user_id = ANY($1::uuid[])', [
    [user1Id, user2Id],
  ]);

  const seedStart = performance.now();

  // Seed 10,000 job_applications for user 1 via generate_series (fast, single SQL statement)
  await pg.query(
    `
    INSERT INTO public.job_applications (
      user_id, company_name, role_title, status, location, salary_range,
      application_link, job_description, notes, created_at, updated_at
    )
    SELECT
      $1::uuid,
      'Company ' || ((g % 250) + 1),
      'Software Engineer L' || ((g % 5) + 3),
      (ARRAY['wishlist','applied','oa','interview','final_round','offer','rejected'])[1 + (g % 7)],
      (ARRAY['Remote','San Francisco, CA','New York, NY','Seattle, WA','Austin, TX'])[1 + (g % 5)],
      '$' || (120 + (g % 100)) || 'k - $' || (160 + (g % 120)) || 'k',
      'https://jobs.example.com/posting/' || g,
      'Build scalable cloud systems and APIs #' || g,
      'Seeded benchmark record #' || g,
      NOW() - ((10001 - g) * INTERVAL '1 minute'),
      NOW() - ((10001 - g) * INTERVAL '1 minute')
    FROM generate_series(1, $2::int) AS g;
    `,
    [user1Id, SEED_COUNT_USER1]
  );

  // Seed 50 job_applications for user 2 (multi-tenant selectivity check)
  await pg.query(
    `
    INSERT INTO public.job_applications (
      user_id, company_name, role_title, status, location, created_at, updated_at
    )
    SELECT
      $1::uuid,
      'Tenant2 Corp ' || g,
      'Backend Engineer',
      'applied',
      'Remote',
      NOW() - (g * INTERVAL '1 hour'),
      NOW() - (g * INTERVAL '1 hour')
    FROM generate_series(1, $2::int) AS g;
    `,
    [user2Id, SEED_COUNT_USER2]
  );

  // Seed 20 resumes for user 1 and 5 for user 2
  const sampleContent = JSON.stringify(mockResumes[0].content);
  const sampleTheme = JSON.stringify({
    ...defaultThemeConfig,
    __templateId: 'velora-professional',
  });

  const resumeInsert = await pg.query<{ id: string }>(
    `
    INSERT INTO public.resumes (
      user_id, name, ats_score, template_id, theme_config, content, created_at, updated_at
    )
    SELECT
      $1::uuid,
      'Benchmark Resume #' || g,
      80 + (g % 20),
      'velora-professional',
      $2::jsonb,
      $3::jsonb,
      NOW() - (g * INTERVAL '1 hour'),
      NOW() - (g * INTERVAL '1 hour')
    FROM generate_series(1, 20) AS g
    RETURNING id;
    `,
    [user1Id, sampleTheme, sampleContent]
  );

  await pg.query(
    `
    INSERT INTO public.resumes (
      user_id, name, ats_score, template_id, theme_config, content
    )
    SELECT
      $1::uuid,
      'User2 Resume #' || g,
      85,
      'velora-professional',
      $2::jsonb,
      $3::jsonb
    FROM generate_series(1, 5) AS g;
    `,
    [user2Id, sampleTheme, sampleContent]
  );

  await pg.query('ANALYZE public.job_applications;');
  await pg.query('ANALYZE public.resumes;');

  const elapsed = Math.round(performance.now() - seedStart);
  console.log(`Seed complete in ${elapsed}ms. Target resume ID: ${resumeInsert.rows[0].id}`);

  return { saveResumeId: resumeInsert.rows[0].id };
}

async function runExplain(
  pg: PgClient,
  label: string,
  sql: string,
  params: any[]
): Promise<{ label: string; plan: string[] }> {
  const res = await pg.query(`EXPLAIN (ANALYZE, BUFFERS) ${sql}`, params);
  const plan = res.rows.map((r: any) => r['QUERY PLAN'] as string);
  return { label, plan };
}

async function runExplainSuite(
  pg: PgClient,
  user1Id: string,
  user2Id: string
) {
  console.log('\n=== EXPLAIN (ANALYZE, BUFFERS): WITH vs WITHOUT performance_indexes migration ===');

  const queries = [
    {
      name: 'listApplications (User 1: 10,000 / 10,050 rows)',
      sql: 'SELECT * FROM public.job_applications WHERE user_id = $1::uuid ORDER BY updated_at DESC',
      params: [user1Id],
    },
    {
      name: 'listApplications (User 2: 50 / 10,050 rows — selective tenant)',
      sql: 'SELECT * FROM public.job_applications WHERE user_id = $1::uuid ORDER BY updated_at DESC',
      params: [user2Id],
    },
    {
      name: 'listApplications filtered by status = interview (User 1)',
      sql: "SELECT * FROM public.job_applications WHERE user_id = $1::uuid AND status = 'interview' ORDER BY updated_at DESC",
      params: [user1Id],
    },
    {
      name: 'listResumes (User 1: 20 / 25 rows)',
      sql: 'SELECT * FROM public.resumes WHERE user_id = $1::uuid ORDER BY updated_at DESC',
      params: [user1Id],
    },
  ];

  // 1. WITH performance_indexes migration applied (default migrated state)
  await pg.query('ANALYZE public.job_applications;');
  await pg.query('ANALYZE public.resumes;');
  const withIndexes = [];
  for (const q of queries) {
    withIndexes.push(await runExplain(pg, q.name, q.sql, q.params));
  }

  // 2. WITHOUT performance_indexes migration (`20260731000000_performance_indexes.sql`)
  const withoutIndexes = [];
  try {
    await pg.query('DROP INDEX IF EXISTS public.idx_job_applications_user_id;');
    await pg.query('DROP INDEX IF EXISTS public.idx_job_applications_status;');
    await pg.query('ANALYZE public.job_applications;');
    await pg.query('ANALYZE public.resumes;');

    for (const q of queries) {
      withoutIndexes.push(await runExplain(pg, q.name, q.sql, q.params));
    }
  } finally {
    // Always restore exact indexes from 20260731000000_performance_indexes.sql
    await pg.query(
      'CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON public.job_applications(user_id);'
    );
    await pg.query(
      'CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);'
    );
    await pg.query('ANALYZE public.job_applications;');
  }

  for (let i = 0; i < queries.length; i++) {
    console.log(`\n--- Query: ${queries[i].name} ---`);
    console.log('[WITH 20260731000000_performance_indexes.sql]');
    console.log(withIndexes[i].plan.join('\n'));
    console.log('[WITHOUT 20260731000000_performance_indexes.sql]');
    console.log(withoutIndexes[i].plan.join('\n'));
  }

  return { withIndexes, withoutIndexes };
}

async function main() {
  // On Windows + WSL2 Docker Engine, keep WSL2 VM awake while Windows-side autocannon runs
  let wslKeepAlive: ChildProcess | null = null;
  if (process.platform === 'win32') {
    wslKeepAlive = spawn('wsl', ['-d', 'Ubuntu', '--', 'sleep', '300'], {
      stdio: 'ignore',
    });
  }

  try {
    const env = getLocalSupabaseEnv();
    const users = await ensureTestUsers(env, 2);
  const user1 = users[0];
  const user2 = users[1];

  // Retrieve full session JSON for Next.js SSR auth cookie
  const { data: sessionRes, error: sessErr } =
    await user1.client.auth.getSession();
  if (sessErr || !sessionRes.session) {
    throw new Error(`Could not obtain User 1 session: ${sessErr?.message}`);
  }
  const authCookieHeader = buildSupabaseAuthCookieHeader(
    env.apiUrl,
    sessionRes.session
  );

  let nextProc: ChildProcess | null = null;
  const summaries: AutocannonSummary[] = [];

  try {
    let saveResumeId = '';
    {
      const seedPg = new PgClient({ connectionString: env.dbUrl });
      await seedPg.connect();
      try {
        const seeded = await seedDatabase(seedPg, user1.id, user2.id);
        saveResumeId = seeded.saveResumeId;
      } finally {
        await seedPg.end();
      }
    }

    // Start Next.js production server against local Supabase
    console.log(
      `\nStarting Next.js production server (next start -p ${NEXT_PORT}) against local Supabase ${env.apiUrl}...`
    );
    nextProc = spawn(
      process.platform === 'win32' ? 'npx.cmd' : 'npx',
      ['next', 'start', '-p', String(NEXT_PORT)],
      {
        stdio: 'ignore',
        shell: process.platform === 'win32',
        env: {
          ...process.env,
          NEXT_PUBLIC_SUPABASE_URL: env.apiUrl,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: env.anonKey,
        },
      }
    );

    await waitForHttp(`http://127.0.0.1:${NEXT_PORT}/sign-in`);

    // Verify whether Next.js SSR middleware accepts the authenticated session cookie
    const authCheck = await fetch(
      `http://127.0.0.1:${NEXT_PORT}/dashboard/applications`,
      {
        headers: { cookie: authCookieHeader },
        redirect: 'manual',
      }
    );
    const nextAuthAccepted = authCheck.status === 200;
    console.log(
      `Auth cookie verification on GET /dashboard/applications -> HTTP ${authCheck.status}` +
        (nextAuthAccepted
          ? ' (authenticated 200 OK)'
          : ` (location=${authCheck.headers.get('location')}; NOTE: @supabase/ssr@0.3.0 ignores cookies.getAll/setAll in utils/supabase/middleware.ts)`)
    );

    const postgrestHeaders = {
      apikey: env.anonKey,
      Authorization: `Bearer ${user1.accessToken}`,
      Accept: 'application/json',
    };

    console.log(
      `\nRunning autocannon (${CONNECTIONS} connections, ${DURATION_SECONDS}s per route)...\n`
    );

    // 1. List Resumes (exact PostgREST query executed by lib/data/resumes.ts listResumes)
    const listResumesRes = await runAutocannon({
      url: `${env.apiUrl}/rest/v1/resumes?select=*&order=updated_at.desc`,
      method: 'GET',
      headers: postgrestHeaders,
      connections: CONNECTIONS,
      duration: DURATION_SECONDS,
    });
    summaries.push(
      summarizeAutocannon(
        'List Resumes (PostgREST /rest/v1/resumes)',
        'GET /rest/v1/resumes?select=*&order=updated_at.desc',
        listResumesRes
      )
    );

    // 2. List Applications (exact PostgREST query executed by lib/data/applications.ts listApplications; 10,000 rows seeded, PostgREST max_rows=1000)
    const listAppsRes = await runAutocannon({
      url: `${env.apiUrl}/rest/v1/job_applications?select=*&order=updated_at.desc`,
      method: 'GET',
      headers: postgrestHeaders,
      connections: CONNECTIONS,
      duration: DURATION_SECONDS,
    });
    summaries.push(
      summarizeAutocannon(
        'List Applications (PostgREST /rest/v1/job_applications, 10k seeded)',
        'GET /rest/v1/job_applications?select=*&order=updated_at.desc',
        listAppsRes
      )
    );

    // 3. Save Resume (exact PostgREST PATCH executed by lib/data/resumes.ts updateResume)
    const saveResumeRes = await runAutocannon({
      url: `${env.apiUrl}/rest/v1/resumes?id=eq.${saveResumeId}&select=*`,
      method: 'PATCH',
      headers: {
        ...postgrestHeaders,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        name: 'Benchmark Resume Updated',
        ats_score: 93,
      }),
      connections: CONNECTIONS,
      duration: DURATION_SECONDS,
    });
    summaries.push(
      summarizeAutocannon(
        'Save Resume (PostgREST PATCH /rest/v1/resumes)',
        'PATCH /rest/v1/resumes?id=eq.<id>&select=*',
        saveResumeRes
      )
    );

    // 4 & 5. Only benchmark authenticated Next.js SSR dashboard routes if middleware actually authenticated the session
    if (nextAuthAccepted) {
      const ssrResumesRes = await runAutocannon({
        url: `http://127.0.0.1:${NEXT_PORT}/dashboard/resume-studio`,
        method: 'GET',
        headers: {
          cookie: authCookieHeader,
        },
        connections: CONNECTIONS,
        duration: DURATION_SECONDS,
      });
      summaries.push(
        summarizeAutocannon(
          'Next.js SSR /dashboard/resume-studio (authenticated)',
          'GET /dashboard/resume-studio',
          ssrResumesRes
        )
      );

      const ssrAppsRes = await runAutocannon({
        url: `http://127.0.0.1:${NEXT_PORT}/dashboard/applications`,
        method: 'GET',
        headers: {
          cookie: authCookieHeader,
        },
        connections: CONNECTIONS,
        duration: DURATION_SECONDS,
      });
      summaries.push(
        summarizeAutocannon(
          'Next.js SSR /dashboard/applications (authenticated)',
          'GET /dashboard/applications',
          ssrAppsRes
        )
      );
    } else {
      console.log(
        'Skipping Next.js SSR /dashboard/* autocannon runs because middleware redirected to /sign-in (HTTP 307).'
      );
    }

    console.log('=== Autocannon Latency & Throughput Results (20 connections, 10s) ===');
    console.table(
      summaries.map((s) => ({
        route: s.name,
        reqSec: s.reqPerSec,
        p50ms: s.p50Ms,
        p95ms: s.p95Ms,
        p99ms: s.p99Ms,
        total: s.totalRequests,
        '2xx': s.status2xx,
        errRate: s.errorRatePct,
      }))
    );

    console.log(JSON.stringify({ summaries }, null, 2));

    // Run EXPLAIN (ANALYZE, BUFFERS) with and without performance_indexes migration
    {
      const explainPg = new PgClient({ connectionString: env.dbUrl });
      await explainPg.connect();
      try {
        await runExplainSuite(explainPg, user1.id, user2.id);
      } finally {
        await explainPg.end();
      }
    }
  } finally {
    if (nextProc) {
      if (process.platform === 'win32' && nextProc.pid) {
        spawn('taskkill', ['/pid', String(nextProc.pid), '/f', '/t'], {
          stdio: 'ignore',
        });
      } else {
        nextProc.kill('SIGTERM');
      }
    }
  }
  } finally {
    if (wslKeepAlive) {
      wslKeepAlive.kill();
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
