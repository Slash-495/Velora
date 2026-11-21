/**
 * Benchmark 2: Optimistic Concurrency (`updateResume` from `lib/data/resumes.ts`)
 *
 * Launches N = 2, 5, 20 concurrent writers against the same resume row with the
 * same `expectedVersion`, for 50 trials each against local Supabase.
 *
 * Verifies:
 * - Exactly 1 writer succeeds per trial
 * - Remaining N - 1 writers throw `VersionConflictError` carrying the latest server row
 * - Zero lost updates (`finalVersion === initialVersion + successes`)
 */
import { ensureTestUsers, getLocalSupabaseEnv } from './lib/supabase-env';

const WRITER_LEVELS = [2, 5, 20];
const TRIALS_PER_LEVEL = 50;

interface LevelSummary {
  writers: number;
  trials: number;
  totalAttempts: number;
  totalSuccesses: number;
  minSuccessesPerTrial: number;
  maxSuccessesPerTrial: number;
  totalVersionConflicts: number;
  conflictsWithNewerServerResume: number;
  totalOtherErrors: number;
  lostUpdates: number;
  startVersion: number;
  endVersion: number;
  expectedEndVersion: number;
  durationMs: number;
}

function installInMemoryBrowserCookieShim() {
  const cookieJar = new Map<string, string>();
  const doc = {
    get cookie(): string {
      return Array.from(cookieJar.entries())
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
    },
    set cookie(raw: string) {
      const firstPart = raw.split(';')[0] || '';
      const eqIdx = firstPart.indexOf('=');
      if (eqIdx === -1) return;
      const name = firstPart.slice(0, eqIdx).trim();
      const val = firstPart.slice(eqIdx + 1).trim();
      if (/max-age=0/i.test(raw) || val === '') {
        cookieJar.delete(name);
      } else {
        cookieJar.set(name, val);
      }
    },
  };
  (globalThis as any).document = doc;
  (globalThis as any).window = { document: doc };
}

async function main() {
  const env = getLocalSupabaseEnv();

  // Configure env & minimal browser cookie shim BEFORE importing app modules
  process.env.NEXT_PUBLIC_SUPABASE_URL = env.apiUrl;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = env.anonKey;
  installInMemoryBrowserCookieShim();

  const users = await ensureTestUsers(env, 2);
  const testUser = users[0];

  const { createClient: createAppBrowserClient } = await import(
    '../utils/supabase/client'
  );
  const { createResume, deleteResume, getResume, updateResume } = await import(
    '../lib/data/resumes'
  );
  const { VersionConflictError } = await import('../lib/data/types');
  const { mockResumes } = await import('../lib/mock-data');

  // Sign in the singleton browser client used by `lib/data/resumes.ts`
  const appClient = createAppBrowserClient();
  const { error: signInErr } = await appClient.auth.signInWithPassword({
    email: testUser.email,
    password: testUser.password,
  });
  if (signInErr) {
    throw new Error(
      `Failed to authenticate app browser client: ${signInErr.message}`
    );
  }

  console.log('=== Benchmark 2: Optimistic Concurrency (lib/data/resumes.ts updateResume) ===');
  console.log(`Supabase API: ${env.apiUrl}`);
  console.log(`User: ${testUser.email} (${testUser.id})`);
  console.log(`Writer concurrency levels: ${WRITER_LEVELS.join(', ')} | Trials per level: ${TRIALS_PER_LEVEL}`);
  console.log('');

  const summaries: LevelSummary[] = [];

  for (const writers of WRITER_LEVELS) {
    const resume = await createResume({
      name: `Concurrency Bench N=${writers}`,
      atsScore: 80,
      template: 'velora-professional',
      content: mockResumes[0].content,
    });

    const startVersion = resume.version ?? 1;
    let totalSuccesses = 0;
    let minSuccessesPerTrial = Number.POSITIVE_INFINITY;
    let maxSuccessesPerTrial = 0;
    let totalVersionConflicts = 0;
    let conflictsWithNewerServerResume = 0;
    let totalOtherErrors = 0;
    let lostUpdates = 0;

    const levelStart = performance.now();

    try {
      for (let t = 1; t <= TRIALS_PER_LEVEL; t++) {
        const before = await getResume(resume.id);
        if (!before) {
          throw new Error(`Resume ${resume.id} missing before trial ${t}`);
        }
        const expectedVersion = before.version ?? 1;

        const results = await Promise.allSettled(
          Array.from({ length: writers }, (_, idx) =>
            updateResume(
              resume.id,
              {
                name: `N=${writers} T=${t} W=${idx + 1}`,
                atsScore: 70 + ((t + idx) % 30),
              },
              expectedVersion
            )
          )
        );

        let trialSuccesses = 0;
        let trialConflicts = 0;
        let trialOtherErrors = 0;

        for (const r of results) {
          if (r.status === 'fulfilled') {
            trialSuccesses++;
          } else if (r.reason instanceof VersionConflictError) {
            trialConflicts++;
            if (
              r.reason.serverResume &&
              (r.reason.serverResume.version ?? 0) > expectedVersion
            ) {
              conflictsWithNewerServerResume++;
            }
          } else {
            trialOtherErrors++;
            console.error(
              `[N=${writers} T=${t}] Unexpected error:`,
              r.reason
            );
          }
        }

        const after = await getResume(resume.id);
        if (!after) {
          throw new Error(`Resume ${resume.id} missing after trial ${t}`);
        }
        const finalVersion = after.version ?? 1;

        if (finalVersion !== expectedVersion + trialSuccesses) {
          lostUpdates++;
        }

        totalSuccesses += trialSuccesses;
        minSuccessesPerTrial = Math.min(minSuccessesPerTrial, trialSuccesses);
        maxSuccessesPerTrial = Math.max(maxSuccessesPerTrial, trialSuccesses);
        totalVersionConflicts += trialConflicts;
        totalOtherErrors += trialOtherErrors;
      }

      const endRow = await getResume(resume.id);
      const endVersion = endRow?.version ?? -1;
      const durationMs = Math.round((performance.now() - levelStart) * 100) / 100;

      summaries.push({
        writers,
        trials: TRIALS_PER_LEVEL,
        totalAttempts: writers * TRIALS_PER_LEVEL,
        totalSuccesses,
        minSuccessesPerTrial,
        maxSuccessesPerTrial,
        totalVersionConflicts,
        conflictsWithNewerServerResume,
        totalOtherErrors,
        lostUpdates,
        startVersion,
        endVersion,
        expectedEndVersion: startVersion + totalSuccesses,
        durationMs,
      });
    } finally {
      await deleteResume(resume.id);
    }
  }

  console.table(
    summaries.map((s) => ({
      N: s.writers,
      trials: s.trials,
      attempts: s.totalAttempts,
      successes: s.totalSuccesses,
      minMaxSucc: `${s.minSuccessesPerTrial}/${s.maxSuccessesPerTrial}`,
      conflicts: s.totalVersionConflicts,
      otherErrs: s.totalOtherErrors,
      lostUpdates: s.lostUpdates,
      versionSpan: `${s.startVersion}->${s.endVersion}`,
      durationMs: s.durationMs,
    }))
  );

  console.log(JSON.stringify({ summaries }, null, 2));

  const anyFailure = summaries.some(
    (s) =>
      s.minSuccessesPerTrial !== 1 ||
      s.maxSuccessesPerTrial !== 1 ||
      s.totalVersionConflicts !== (s.writers - 1) * s.trials ||
      s.totalOtherErrors !== 0 ||
      s.lostUpdates !== 0 ||
      s.endVersion !== s.expectedEndVersion
  );

  if (anyFailure) {
    process.exitCode = 1;
  }

  appClient.auth.stopAutoRefresh();
  process.exit(process.exitCode ?? 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
