/**
 * Benchmark 1: Atomic Rate-Limit Correctness (`public.increment_ai_usage`)
 *
 * Calls the real PostgreSQL RPC `public.increment_ai_usage(p_route, p_window_start)`
 * with the exact arguments used by `enforceRateLimit` in `lib/api-guard.ts`.
 *
 * Part A: 1 user, 20 trials x 50 concurrent calls in one window (limit = 10).
 * Part B: 5 users x 50 concurrent calls simultaneously in the same route + window
 *         to verify strict per-user isolation.
 */
import { ensureTestUsers, getLocalSupabaseEnv } from './lib/supabase-env';

const LIMIT = 10;
const CONCURRENT_CALLS = 50;
const TRIALS = 20;
const ISOLATION_USERS = 5;

interface TrialResult {
  trial: number;
  route: string;
  windowStartIso: string;
  admitted: number;
  blocked: number;
  errors: number;
  maxReturnedCount: number;
  uniqueCounts: number;
  durationMs: number;
}

async function runBurstForUser(
  client: Awaited<ReturnType<typeof ensureTestUsers>>[number]['client'],
  route: string,
  windowStartIso: string,
  concurrency: number
) {
  const start = performance.now();
  const responses = await Promise.all(
    Array.from({ length: concurrency }, () =>
      client.rpc('increment_ai_usage', {
        p_route: route,
        p_window_start: windowStartIso,
      })
    )
  );
  const durationMs = Math.round((performance.now() - start) * 100) / 100;

  let admitted = 0;
  let blocked = 0;
  let errors = 0;
  const returnedCounts: number[] = [];

  for (const res of responses) {
    if (res.error || typeof res.data !== 'number') {
      errors++;
    } else {
      returnedCounts.push(res.data);
      if (res.data <= LIMIT) {
        admitted++;
      } else {
        blocked++;
      }
    }
  }

  const maxReturnedCount =
    returnedCounts.length > 0 ? Math.max(...returnedCounts) : 0;
  const uniqueCounts = new Set(returnedCounts).size;

  return {
    admitted,
    blocked,
    errors,
    maxReturnedCount,
    uniqueCounts,
    durationMs,
  };
}

async function main() {
  const env = getLocalSupabaseEnv();
  const users = await ensureTestUsers(env, ISOLATION_USERS);
  const runId = Date.now();
  const windowMs = 60_000;

  console.log('=== Benchmark 1: Rate-Limit Correctness (public.increment_ai_usage) ===');
  console.log(`Supabase API: ${env.apiUrl}`);
  console.log(`Limit: ${LIMIT} | Concurrency per burst: ${CONCURRENT_CALLS} | Trials: ${TRIALS}`);
  console.log('');

  // Part A: Single user, 20 trials x 50 concurrent calls
  const trials: TrialResult[] = [];
  const baseWindowMs = Math.floor(runId / windowMs) * windowMs;

  for (let t = 1; t <= TRIALS; t++) {
    // Distinct 60s window + route per trial so every trial starts from count = 0
    const windowStartIso = new Date(baseWindowMs + t * windowMs).toISOString();
    const route = `bench-rate-limit-${runId}-t${t}`;

    const stats = await runBurstForUser(
      users[0].client,
      route,
      windowStartIso,
      CONCURRENT_CALLS
    );

    trials.push({
      trial: t,
      route,
      windowStartIso,
      ...stats,
    });
  }

  const admittedList = trials.map((t) => t.admitted);
  const blockedList = trials.map((t) => t.blocked);
  const totalErrorsA = trials.reduce((acc, t) => acc + t.errors, 0);
  const minAdmitted = Math.min(...admittedList);
  const maxAdmitted = Math.max(...admittedList);
  const minBlocked = Math.min(...blockedList);
  const maxBlocked = Math.max(...blockedList);
  const allCountsStrictlyUnique = trials.every(
    (t) => t.uniqueCounts === CONCURRENT_CALLS && t.maxReturnedCount === CONCURRENT_CALLS
  );

  console.log('--- Part A: 1 User x 50 Concurrent Calls x 20 Trials ---');
  console.table(
    trials.map((t) => ({
      trial: t.trial,
      admitted: t.admitted,
      blocked: t.blocked,
      errors: t.errors,
      maxCount: t.maxReturnedCount,
      uniqueCounts: t.uniqueCounts,
      durationMs: t.durationMs,
    }))
  );

  console.log(
    JSON.stringify(
      {
        partA: {
          trials: TRIALS,
          concurrentCallsPerTrial: CONCURRENT_CALLS,
          limit: LIMIT,
          minAdmitted,
          maxAdmitted,
          minBlocked,
          maxBlocked,
          totalErrors: totalErrorsA,
          allCountsStrictlyUnique,
        },
      },
      null,
      2
    )
  );

  // Part B: 5 users x 50 concurrent calls simultaneously in the exact same route & window
  const sharedRoute = `bench-isolation-${runId}`;
  const sharedWindowIso = new Date(baseWindowMs + (TRIALS + 10) * windowMs).toISOString();

  console.log('\n--- Part B: 5 Users x 50 Concurrent Calls (250 Simultaneous) ---');
  console.log(`Shared route: ${sharedRoute} | Shared window_start: ${sharedWindowIso}`);

  const isoStart = performance.now();
  const perUserResults = await Promise.all(
    users.map(async (u, idx) => {
      const stats = await runBurstForUser(
        u.client,
        sharedRoute,
        sharedWindowIso,
        CONCURRENT_CALLS
      );
      return {
        userIndex: idx + 1,
        email: u.email,
        userId: u.id,
        ...stats,
      };
    })
  );
  const isoTotalMs = Math.round((performance.now() - isoStart) * 100) / 100;

  console.table(
    perUserResults.map((r) => ({
      user: r.email,
      admitted: r.admitted,
      blocked: r.blocked,
      errors: r.errors,
      maxCount: r.maxReturnedCount,
      uniqueCounts: r.uniqueCounts,
      durationMs: r.durationMs,
    }))
  );

  const isoMinAdmitted = Math.min(...perUserResults.map((r) => r.admitted));
  const isoMaxAdmitted = Math.max(...perUserResults.map((r) => r.admitted));
  const isoTotalErrors = perUserResults.reduce((acc, r) => acc + r.errors, 0);

  console.log(
    JSON.stringify(
      {
        partB: {
          users: ISOLATION_USERS,
          concurrentCallsPerUser: CONCURRENT_CALLS,
          totalSimultaneousCalls: ISOLATION_USERS * CONCURRENT_CALLS,
          minAdmittedPerUser: isoMinAdmitted,
          maxAdmittedPerUser: isoMaxAdmitted,
          totalErrors: isoTotalErrors,
          totalWallTimeMs: isoTotalMs,
        },
      },
      null,
      2
    )
  );

  if (
    minAdmitted !== LIMIT ||
    maxAdmitted !== LIMIT ||
    totalErrorsA !== 0 ||
    isoMinAdmitted !== LIMIT ||
    isoMaxAdmitted !== LIMIT ||
    isoTotalErrors !== 0
  ) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
