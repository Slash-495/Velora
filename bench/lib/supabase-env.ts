import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Node 20 does not expose globalThis.WebSocket by default; @supabase/realtime-js checks for it on client init
if (typeof (globalThis as any).WebSocket === 'undefined') {
  const require = createRequire(import.meta.url);
  try {
    (globalThis as any).WebSocket = require('ws');
  } catch {
    // ignore if ws is not present
  }
}

export interface LocalSupabaseEnv {
  apiUrl: string;
  dbUrl: string;
  anonKey: string;
  serviceRoleKey: string;
}

export interface TestUserSession {
  id: string;
  email: string;
  password: string;
  accessToken: string;
  refreshToken: string;
  client: SupabaseClient;
}

function parseEnvLines(output: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

function tryReadSupabaseStatusEnv(): Record<string, string> {
  const candidates: Array<{ cmd: string; args: string[] }> = [
    { cmd: 'supabase', args: ['status', '-o', 'env'] },
    {
      cmd: 'wsl',
      args: [
        '-d',
        'Ubuntu',
        '--',
        'bash',
        '-lc',
        'cd /mnt/c/Users/arush/OneDrive/Desktop/Velora && ~/.local/bin/supabase status -o env',
      ],
    },
  ];

  for (const { cmd, args } of candidates) {
    try {
      const res = spawnSync(cmd, args, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 30_000,
        shell: process.platform === 'win32' && cmd === 'supabase',
      });
      const out = `${res.stdout || ''}\n${res.stderr || ''}`;
      const parsed = parseEnvLines(out);
      if (parsed.API_URL && (parsed.ANON_KEY || parsed.PUBLISHABLE_KEY)) {
        return parsed;
      }
    } catch {
      // try next candidate
    }
  }
  return {};
}

export function assertLocalUrl(urlString: string): void {
  const parsed = new URL(urlString);
  const host = parsed.hostname.toLowerCase();
  if (host !== '127.0.0.1' && host !== 'localhost') {
    throw new Error(
      `SAFETY ABORT: Refusing to run benchmark against non-local Supabase URL (${urlString}). Use local Supabase only.`
    );
  }
}

export function getLocalSupabaseEnv(): LocalSupabaseEnv {
  const fromStatus = tryReadSupabaseStatusEnv();

  const apiUrl = (
    process.env.BENCH_SUPABASE_URL ||
    fromStatus.API_URL ||
    'http://127.0.0.1:54321'
  ).replace(/\/+$/, '');

  assertLocalUrl(apiUrl);

  const dbUrl =
    process.env.BENCH_DB_URL ||
    fromStatus.DB_URL ||
    'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

  const anonKey =
    process.env.BENCH_SUPABASE_ANON_KEY ||
    fromStatus.ANON_KEY ||
    fromStatus.PUBLISHABLE_KEY ||
    '';

  const serviceRoleKey =
    process.env.BENCH_SUPABASE_SERVICE_ROLE_KEY ||
    fromStatus.SERVICE_ROLE_KEY ||
    fromStatus.SECRET_KEY ||
    '';

  if (!anonKey || !serviceRoleKey) {
    throw new Error(
      'Could not discover local Supabase keys. Start local Supabase (`supabase start`) or set BENCH_SUPABASE_ANON_KEY and BENCH_SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return { apiUrl, dbUrl, anonKey, serviceRoleKey };
}

export function createAdminClient(env: LocalSupabaseEnv): SupabaseClient {
  return createClient(env.apiUrl, env.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function ensureTestUsers(
  env: LocalSupabaseEnv,
  count: number
): Promise<TestUserSession[]> {
  const admin = createAdminClient(env);

  const { data: existingList, error: listError } =
    await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listError) {
    throw new Error(`Failed to list local auth users: ${listError.message}`);
  }

  const byEmail = new Map(
    (existingList?.users || []).map((u) => [u.email?.toLowerCase(), u])
  );

  const sessions: TestUserSession[] = [];

  for (let i = 1; i <= count; i++) {
    const email = `bench-user-${i}@velora.local`;
    const password = `BenchPass!2026_${i}`;

    let userId = byEmail.get(email)?.id;
    if (!userId) {
      const { data: created, error: createErr } =
        await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: `Bench User ${i}`,
          },
        });
      if (createErr || !created?.user) {
        throw new Error(
          `Failed to create local test user ${email}: ${createErr?.message}`
        );
      }
      userId = created.user.id;
    }

    const userClient = createClient(env.apiUrl, env.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: signInData, error: signInErr } =
      await userClient.auth.signInWithPassword({
        email,
        password,
      });

    if (signInErr || !signInData.session) {
      throw new Error(
        `Failed to sign in local test user ${email}: ${signInErr?.message}`
      );
    }

    sessions.push({
      id: userId,
      email,
      password,
      accessToken: signInData.session.access_token,
      refreshToken: signInData.session.refresh_token,
      client: userClient,
    });
  }

  return sessions;
}
