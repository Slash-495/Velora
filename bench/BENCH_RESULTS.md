# Velora — Local Benchmark & Verification Results

> All numbers below were measured directly against local resources (`127.0.0.1`) with zero fabricated or estimated values. Application code was not modified; only files under `bench/`, new Vitest files under `tests/`, and devDependencies / benchmark npm scripts in `package.json` were added.

---

## Environment

| Property | Value |
| --- | --- |
| **Git SHA** | `fefb332e353e70f214939ce3f5fd642f7cc39ff7` |
| **Date (local)** | 2026-11-19 |
| **OS** | Microsoft Windows 11 Home Single Language (`10.0.26200`) + WSL2 (`Ubuntu 24.04.3 LTS`, Linux `6.6.87.2-microsoft-standard-WSL2`) |
| **CPU** | AMD Ryzen 5 5600H with Radeon Graphics (6 physical cores / 12 logical processors) |
| **RAM** | 13.86 GiB visible on Windows (`14,528,572 KB`); 6.70 GiB allocated to WSL2 VM |
| **Node.js / npm** | Node `v20.13.1`, npm `10.5.2` |
| **Next.js** | `15.5.9` (`next build` + `next start`) |
| **Local Supabase Stack** | Supabase CLI `3.2.0` (`supabase/config.toml`, all 16 migrations applied) |
| **Database** | PostgreSQL `17.6` (`supabase/postgres:17.6.1.155`) via Docker Engine `29.1.3` (WSL2) |
| **PostgREST / GoTrue / Kong** | `postgrest:v14.5`, `gotrue:v2.197.0`, `kong:2.8.1`, `storage-api:v1.80.2` |
| **Load Generator** | `autocannon@8.0.0` (HDR histogram decoded via `autocannon/lib/histUtil` for exact `p50` / `p95` / `p99`) |
| **Test & Coverage Runner** | `vitest@3.0.0` + `@vitest/coverage-v8@3.0.0` |
| **Lighthouse / Chrome** | `lighthouse@12` (mobile preset) + Google Chrome `158.0.8127.36` headless |

### One-Command npm Scripts

| Benchmark | Command | Script |
| --- | --- | --- |
| 1. Rate-limit correctness | `npm run bench:rate-limit` | `tsx bench/rate-limit.ts` |
| 2. Optimistic concurrency | `npm run bench:concurrency` | `tsx bench/optimistic-concurrency.ts` |
| 3. Latency + `EXPLAIN ANALYZE` | `npm run bench:latency` | `tsx bench/latency.ts` |
| 4. Unit tests + `lib/` coverage | `npm run test:coverage` | `vitest run --coverage --coverage.provider=v8 --coverage.include=lib/**/*.ts --coverage.reporter=text` |
| 5. Lighthouse mobile (optional) | `npm run bench:lighthouse` | `node bench/lighthouse.mjs` |
| Run 1–4 sequentially | `npm run bench:all` | `npm run bench:rate-limit && npm run bench:concurrency && npm run bench:latency && npm run test:coverage` |

### Local Supabase Setup Command

```bash
# Started inside WSL2 Ubuntu (Docker Engine 29.1.3), reading supabase/config.toml and applying all 16 migrations
supabase start -x studio,postgres-meta,imgproxy,realtime,mailpit,edge-runtime,logflare,vector,supavisor
```

All 16 migrations in `supabase/migrations/` applied cleanly (`20240523000000_ai_resume_tables.sql` through `20261030000000_atomic_rate_limit_rpc.sql`), exposing `http://127.0.0.1:54321` (API) and `postgresql://postgres:postgres@127.0.0.1:54322/postgres` (Postgres).

---

## 1. Rate-Limit Correctness (`public.increment_ai_usage`)

**Command:**

```bash
npm run bench:rate-limit
```

Calls `supabase.rpc('increment_ai_usage', { p_route, p_window_start })` with the exact arguments used by `enforceRateLimit()` in `lib/api-guard.ts` using real authenticated local Supabase JWTs (limit = `10`).

### Summary Table

| Scenario | Users | Concurrent Calls / User | Trials | Admitted (Min / Max) | Blocked (Min / Max) | Errors | Strictly Unique Counts (`1..50`) |
| --- | ---: | ---: | ---: | :---: | :---: | ---: | :---: |
| **Part A: Single-user burst** | 1 | 50 | 20 | **10 / 10** | **40 / 40** | **0** | **Yes (20/20)** |
| **Part B: Multi-user isolation (250 simultaneous, same route + window)** | 5 | 50 | 1 | **10 / 10** | **40 / 40** | **0** | **Yes (5/5)** |

### Raw Output

```text
> velora@0.1.0 bench:rate-limit
> tsx bench/rate-limit.ts

=== Benchmark 1: Rate-Limit Correctness (public.increment_ai_usage) ===
Supabase API: http://127.0.0.1:54321
Limit: 10 | Concurrency per burst: 50 | Trials: 20

--- Part A: 1 User x 50 Concurrent Calls x 20 Trials ---
┌─────────┬───────┬──────────┬─────────┬────────┬──────────┬──────────────┬────────────┐
│ (index) │ trial │ admitted │ blocked │ errors │ maxCount │ uniqueCounts │ durationMs │
├─────────┼───────┼──────────┼─────────┼────────┼──────────┼──────────────┼────────────┤
│ 0       │ 1     │ 10       │ 40      │ 0      │ 50       │ 50           │ 213.44     │
│ 1       │ 2     │ 10       │ 40      │ 0      │ 50       │ 50           │ 73.97      │
│ 2       │ 3     │ 10       │ 40      │ 0      │ 50       │ 50           │ 89.83      │
│ 3       │ 4     │ 10       │ 40      │ 0      │ 50       │ 50           │ 91.17      │
│ 4       │ 5     │ 10       │ 40      │ 0      │ 50       │ 50           │ 80.42      │
│ 5       │ 6     │ 10       │ 40      │ 0      │ 50       │ 50           │ 80.78      │
│ 6       │ 7     │ 10       │ 40      │ 0      │ 50       │ 50           │ 74.96      │
│ 7       │ 8     │ 10       │ 40      │ 0      │ 50       │ 50           │ 82.96      │
│ 8       │ 9     │ 10       │ 40      │ 0      │ 50       │ 50           │ 77.35      │
│ 9       │ 10    │ 10       │ 40      │ 0      │ 50       │ 50           │ 73.24      │
│ 10      │ 11    │ 10       │ 40      │ 0      │ 50       │ 50           │ 76.65      │
│ 11      │ 12    │ 10       │ 40      │ 0      │ 50       │ 50           │ 89.65      │
│ 12      │ 13    │ 10       │ 40      │ 0      │ 50       │ 50           │ 79.69      │
│ 13      │ 14    │ 10       │ 40      │ 0      │ 50       │ 50           │ 77.77      │
│ 14      │ 15    │ 10       │ 40      │ 0      │ 50       │ 50           │ 82.83      │
│ 15      │ 16    │ 10       │ 40      │ 0      │ 50       │ 50           │ 82.71      │
│ 16      │ 17    │ 10       │ 40      │ 0      │ 50       │ 50           │ 79.4       │
│ 17      │ 18    │ 10       │ 40      │ 0      │ 50       │ 50           │ 77.87      │
│ 18      │ 19    │ 10       │ 40      │ 0      │ 50       │ 50           │ 76.4       │
│ 19      │ 20    │ 10       │ 40      │ 0      │ 50       │ 50           │ 76.63      │
└─────────┴───────┴──────────┴─────────┴────────┴──────────┴──────────────┴────────────┘
{
  "partA": {
    "trials": 20,
    "concurrentCallsPerTrial": 50,
    "limit": 10,
    "minAdmitted": 10,
    "maxAdmitted": 10,
    "minBlocked": 40,
    "maxBlocked": 40,
    "totalErrors": 0,
    "allCountsStrictlyUnique": true
  }
}

--- Part B: 5 Users x 50 Concurrent Calls (250 Simultaneous) ---
Shared route: bench-isolation-1795099147503 | Shared window_start: 2026-11-19T15:09:00.000Z
┌─────────┬─────────────────────────────┬──────────┬─────────┬────────┬──────────┬──────────────┬────────────┐
│ (index) │ user                        │ admitted │ blocked │ errors │ maxCount │ uniqueCounts │ durationMs │
├─────────┼─────────────────────────────┼──────────┼─────────┼────────┼──────────┼──────────────┼────────────┤
│ 0       │ 'bench-user-1@velora.local' │ 10       │ 40      │ 0      │ 50       │ 50           │ 878.3      │
│ 1       │ 'bench-user-2@velora.local' │ 10       │ 40      │ 0      │ 50       │ 50           │ 876.57     │
│ 2       │ 'bench-user-3@velora.local' │ 10       │ 40      │ 0      │ 50       │ 50           │ 877.92     │
│ 3       │ 'bench-user-4@velora.local' │ 10       │ 40      │ 0      │ 50       │ 50           │ 876.37     │
│ 4       │ 'bench-user-5@velora.local' │ 10       │ 40      │ 0      │ 50       │ 50           │ 876.85     │
└─────────┴─────────────────────────────┴──────────┴─────────┴────────┴──────────┴──────────────┴────────────┘
{
  "partB": {
    "users": 5,
    "concurrentCallsPerUser": 50,
    "totalSimultaneousCalls": 250,
    "minAdmittedPerUser": 10,
    "maxAdmittedPerUser": 10,
    "totalErrors": 0,
    "totalWallTimeMs": 878.94
  }
}
```

---

## 2. Optimistic Concurrency (`updateResume` in `lib/data/resumes.ts`)

**Command:**

```bash
npm run bench:concurrency
```

Calls `updateResume(id, updates, expectedVersion)` directly from `lib/data/resumes.ts` against local Supabase with `N = 2, 5, 20` concurrent writers sharing the same `expectedVersion`, repeated for 50 trials per concurrency level (1,350 total write attempts).

### Summary Table

| Concurrent Writers (`N`) | Trials | Total Attempts | Total Successes | Successes / Trial (Min / Max) | `VersionConflictError` Count | Conflicts Carrying Newer `serverResume` | Other Errors | Lost Updates (`final != initial + successes`) | Version Progression | Total Duration (ms) |
| ---: | ---: | ---: | ---: | :---: | ---: | ---: | ---: | ---: | :---: | ---: |
| **2** | 50 | 100 | **50** | **1 / 1** | **50** | 50 / 50 | 0 | **0** | `1 -> 51` | 884.27 |
| **5** | 50 | 250 | **50** | **1 / 1** | **200** | 200 / 200 | 0 | **0** | `1 -> 51` | 1,079.42 |
| **20** | 50 | 1,000 | **50** | **1 / 1** | **950** | 950 / 950 | 0 | **0** | `1 -> 51` | 2,314.50 |

### Raw Output

```text
> velora@0.1.0 bench:concurrency
> tsx bench/optimistic-concurrency.ts

=== Benchmark 2: Optimistic Concurrency (lib/data/resumes.ts updateResume) ===
Supabase API: http://127.0.0.1:54321
User: bench-user-1@velora.local (846b356d-c766-4129-a1ee-7153cfc16cdf)
Writer concurrency levels: 2, 5, 20 | Trials per level: 50

┌─────────┬────┬────────┬──────────┬───────────┬────────────┬───────────┬───────────┬─────────────┬─────────────┬────────────┐
│ (index) │ N  │ trials │ attempts │ successes │ minMaxSucc │ conflicts │ otherErrs │ lostUpdates │ versionSpan │ durationMs │
├─────────┼────┼────────┼──────────┼───────────┼────────────┼───────────┼───────────┼─────────────┼─────────────┼────────────┤
│ 0       │ 2  │ 50     │ 100      │ 50        │ '1/1'      │ 50        │ 0         │ 0           │ '1->51'     │ 884.27     │
│ 1       │ 5  │ 50     │ 250      │ 50        │ '1/1'      │ 200       │ 0         │ 0           │ '1->51'     │ 1079.42    │
│ 2       │ 20 │ 50     │ 1000     │ 50        │ '1/1'      │ 950       │ 0         │ 0           │ '1->51'     │ 2314.5     │
└─────────┴────┴────────┴──────────┴───────────┴────────────┴───────────┴───────────┴─────────────┴─────────────┴────────────┘
{
  "summaries": [
    {
      "writers": 2,
      "trials": 50,
      "totalAttempts": 100,
      "totalSuccesses": 50,
      "minSuccessesPerTrial": 1,
      "maxSuccessesPerTrial": 1,
      "totalVersionConflicts": 50,
      "conflictsWithNewerServerResume": 50,
      "totalOtherErrors": 0,
      "lostUpdates": 0,
      "startVersion": 1,
      "endVersion": 51,
      "expectedEndVersion": 51,
      "durationMs": 884.27
    },
    {
      "writers": 5,
      "trials": 50,
      "totalAttempts": 250,
      "totalSuccesses": 50,
      "minSuccessesPerTrial": 1,
      "maxSuccessesPerTrial": 1,
      "totalVersionConflicts": 200,
      "conflictsWithNewerServerResume": 200,
      "totalOtherErrors": 0,
      "lostUpdates": 0,
      "startVersion": 1,
      "endVersion": 51,
      "expectedEndVersion": 51,
      "durationMs": 1079.42
    },
    {
      "writers": 20,
      "trials": 50,
      "totalAttempts": 1000,
      "totalSuccesses": 50,
      "minSuccessesPerTrial": 1,
      "maxSuccessesPerTrial": 1,
      "totalVersionConflicts": 950,
      "conflictsWithNewerServerResume": 950,
      "totalOtherErrors": 0,
      "lostUpdates": 0,
      "startVersion": 1,
      "endVersion": 51,
      "expectedEndVersion": 51,
      "durationMs": 2314.5
    }
  ]
}
```

---

## 3. Authenticated DB-Backed Latency (`autocannon`) & `EXPLAIN (ANALYZE, BUFFERS)`

**Commands:**

```powershell
# 1. Production build targeting local Supabase
$env:NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
npm run build

# 2. Seed 10,000 job_applications + run autocannon (20 connections, 10s) + EXPLAIN ANALYZE
npm run bench:latency
```

### Architecture Note on Routes Tested

Velora has no Next.js `/api/resumes` or `/api/applications` CRUD route handlers (`app/api/` contains only `/api/ai/*`, `/api/auth/callback`, and `/api/ping`). Instead, `lib/data/resumes.ts` and `lib/data/applications.ts` query Supabase PostgREST directly over HTTP with the user's JWT and RLS enforced. Therefore, `bench/latency.ts` benchmarks those exact authenticated PostgREST endpoints (20 connections, 10 s, 10,000 seeded `job_applications` + 20 `resumes` for User 1, plus 50 `job_applications` + 5 `resumes` for User 2).

Additionally, `bench/latency.ts` starts `next start` against local Supabase and checks `GET /dashboard/applications` with a valid `@supabase/ssr@0.3.0` session cookie. That check returned **`HTTP 307` → `/sign-in?next=%2Fdashboard%2Fapplications`** because `package.json` installs `@supabase/ssr@0.3.0` (whose `createServerClient` only invokes `cookies.get`/`set`/`remove`), whereas `utils/supabase/middleware.ts` passes `cookies.getAll`/`setAll` (added in `@supabase/ssr@0.4.0`). Per benchmark rules, app code was not modified and the redirected SSR routes were skipped rather than measuring `307` redirects.

### Autocannon Results (20 connections, 10 seconds, authenticated JWT + RLS)

| Route | Target | Req/s | p50 (ms) | p95 (ms) | p99 (ms) | Avg (ms) | Max (ms) | 2xx Count | Socket Errors | Error Rate |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **List Resumes** | `GET /rest/v1/resumes?select=*&order=updated_at.desc` (20 rows) | **1,395.1** | **55** | **110** | **119** | 55.35 | 208 | 13,951 | 61 | **0.44%** |
| **List Applications (10k seeded)** | `GET /rest/v1/job_applications?select=*&order=updated_at.desc` (`max_rows=1000`) | **63.0** | **278** | **707** | **864** | 311.98 | 1,414 | 630 | 0 | **0.00%** |
| **Save Resume** | `PATCH /rest/v1/resumes?id=eq.<id>&select=*` (hot single row + triggers) | **771.9** | **58** | **136** | **151** | 61.35 | 295 | 7,719 | 10 | **0.13%** |

### `EXPLAIN (ANALYZE, BUFFERS)` Summary — WITH vs WITHOUT `20260731000000_performance_indexes.sql`

| Query | Plan (WITH indexes) | Exec Time (WITH) | Shared Hits (WITH) | Plan (WITHOUT indexes) | Exec Time (WITHOUT) | Shared Hits (WITHOUT) |
| --- | --- | ---: | ---: | --- | ---: | ---: |
| `listApplications` — User 1 (10,000 / 10,050 rows = 99.5% of table) | `Seq Scan` + `Sort (quicksort 2836kB)` | 5.712 ms | 671 | `Seq Scan` + `Sort (quicksort 2836kB)` | 4.590 ms | 671 |
| `listApplications` — User 2 (50 / 10,050 rows = 0.5%, selective tenant) | **`Index Scan (idx_job_applications_user_id)`** + `Sort` | **0.108 ms** | **85** | `Seq Scan` (10,000 filtered) + `Sort` | **0.909 ms** | **671** |
| `listApplications` — User 1, `status = 'interview'` (1,429 rows) | **`Bitmap Index Scan (idx_job_applications_status)`** + `Bitmap Heap Scan` + `Sort` | **1.138 ms** | 679 | `Seq Scan` (8,621 filtered) + `Sort` | **1.494 ms** | 671 |
| `listResumes` — User 1 (20 / 25 rows) *(index lives in `20261029000001`)* | `Bitmap Index Scan (idx_resumes_user_id)` + `Sort` | 0.090 ms | 92 | `Bitmap Index Scan (idx_resumes_user_id)` + `Sort` | 0.126 ms | 92 |

**Key takeaway from `EXPLAIN ANALYZE`:**
- For a realistic selective tenant (User 2 owning 50 rows out of 10,050), `idx_job_applications_user_id` cuts query execution time by **8.4×** (`0.909 ms → 0.108 ms`) and shared buffer reads by **7.9×** (`671 → 85`).
- For a dominant tenant (User 1 owning 99.5% of rows), Postgres rightly chooses a `Seq Scan` in both cases — and because `20260731000000_performance_indexes.sql` only creates single-column `(user_id)` and `(status)` indexes rather than a composite `(user_id, updated_at DESC)` index, Postgres still performs a 2.8 MB in-memory `quicksort` on `updated_at DESC`.

### Raw Output (`npm run bench:latency`)

```text
> velora@0.1.0 bench:latency
> tsx bench/latency.ts

Seeding 10000 job_applications for user 1 and 50 for user 2...
Seed complete in 247ms. Target resume ID: 17e6597a-d93b-494e-9056-b88b5f7e5b16

Starting Next.js production server (next start -p 3106) against local Supabase http://127.0.0.1:54321...
Auth cookie verification on GET /dashboard/applications -> HTTP 307 (location=/sign-in?next=%2Fdashboard%2Fapplications; NOTE: @supabase/ssr@0.3.0 ignores cookies.getAll/setAll in utils/supabase/middleware.ts)

Running autocannon (20 connections, 10s per route)...

Skipping Next.js SSR /dashboard/* autocannon runs because middleware redirected to /sign-in (HTTP 307).
=== Autocannon Latency & Throughput Results (20 connections, 10s) ===
┌─────────┬───────────────────────────────────────────────────────────────────────┬────────┬───────┬───────┬───────┬───────┬───────┬─────────┐
│ (index) │ route                                                                 │ reqSec │ p50ms │ p95ms │ p99ms │ total │ 2xx   │ errRate │
├─────────┼───────────────────────────────────────────────────────────────────────┼────────┼───────┼───────┼───────┼───────┼───────┼─────────┤
│ 0       │ 'List Resumes (PostgREST /rest/v1/resumes)'                           │ 1395.1 │ 55    │ 110   │ 119   │ 13951 │ 13951 │ '0.44%' │
│ 1       │ 'List Applications (PostgREST /rest/v1/job_applications, 10k seeded)' │ 63     │ 278   │ 707   │ 864   │ 630   │ 630   │ '0.00%' │
│ 2       │ 'Save Resume (PostgREST PATCH /rest/v1/resumes)'                      │ 771.9  │ 58    │ 136   │ 151   │ 7719  │ 7719  │ '0.13%' │
└─────────┴───────────────────────────────────────────────────────────────────────┴────────┴───────┴───────┴───────┴───────┴───────┴─────────┘
{
  "summaries": [
    {
      "name": "List Resumes (PostgREST /rest/v1/resumes)",
      "target": "GET /rest/v1/resumes?select=*&order=updated_at.desc",
      "connections": 20,
      "durationSec": 10.03,
      "totalRequests": 13951,
      "reqPerSec": 1395.1,
      "p50Ms": 55,
      "p95Ms": 110,
      "p99Ms": 119,
      "avgMs": 55.35,
      "maxMs": 208,
      "status2xx": 13951,
      "non2xx": 0,
      "errors": 61,
      "timeouts": 0,
      "errorRatePct": "0.44%"
    },
    {
      "name": "List Applications (PostgREST /rest/v1/job_applications, 10k seeded)",
      "target": "GET /rest/v1/job_applications?select=*&order=updated_at.desc",
      "connections": 20,
      "durationSec": 10.03,
      "totalRequests": 630,
      "reqPerSec": 63,
      "p50Ms": 278,
      "p95Ms": 707,
      "p99Ms": 864,
      "avgMs": 311.98,
      "maxMs": 1414,
      "status2xx": 630,
      "non2xx": 0,
      "errors": 0,
      "timeouts": 0,
      "errorRatePct": "0.00%"
    },
    {
      "name": "Save Resume (PostgREST PATCH /rest/v1/resumes)",
      "target": "PATCH /rest/v1/resumes?id=eq.<id>&select=*",
      "connections": 20,
      "durationSec": 10.02,
      "totalRequests": 7719,
      "reqPerSec": 771.9,
      "p50Ms": 58,
      "p95Ms": 136,
      "p99Ms": 151,
      "avgMs": 61.35,
      "maxMs": 295,
      "status2xx": 7719,
      "non2xx": 0,
      "errors": 10,
      "timeouts": 0,
      "errorRatePct": "0.13%"
    }
  ]
}

=== EXPLAIN (ANALYZE, BUFFERS): WITH vs WITHOUT performance_indexes migration ===

--- Query: listApplications (User 1: 10,000 / 10,050 rows) ---
[WITH 20260731000000_performance_indexes.sql]
Sort  (cost=1461.01..1486.01 rows=10000 width=246) (actual time=4.944..5.359 rows=10000 loops=1)
  Sort Key: updated_at DESC
  Sort Method: quicksort  Memory: 2836kB
  Buffers: shared hit=671
  ->  Seq Scan on job_applications  (cost=0.00..796.62 rows=10000 width=246) (actual time=0.043..1.412 rows=10000 loops=1)
        Filter: (user_id = '846b356d-c766-4129-a1ee-7153cfc16cdf'::uuid)
        Rows Removed by Filter: 50
        Buffers: shared hit=671
Planning:
  Buffers: shared hit=82
Planning Time: 0.184 ms
Execution Time: 5.712 ms
[WITHOUT 20260731000000_performance_indexes.sql]
Sort  (cost=1461.01..1486.01 rows=10000 width=246) (actual time=3.871..4.277 rows=10000 loops=1)
  Sort Key: updated_at DESC
  Sort Method: quicksort  Memory: 2836kB
  Buffers: shared hit=671
  ->  Seq Scan on job_applications  (cost=0.00..796.62 rows=10000 width=246) (actual time=0.034..1.189 rows=10000 loops=1)
        Filter: (user_id = '846b356d-c766-4129-a1ee-7153cfc16cdf'::uuid)
        Rows Removed by Filter: 50
        Buffers: shared hit=671
Planning:
  Buffers: shared hit=44
Planning Time: 0.086 ms
Execution Time: 4.590 ms

--- Query: listApplications (User 2: 50 / 10,050 rows — selective tenant) ---
[WITH 20260731000000_performance_indexes.sql]
Sort  (cost=13.57..13.70 rows=50 width=246) (actual time=0.088..0.090 rows=50 loops=1)
  Sort Key: updated_at DESC
  Sort Method: quicksort  Memory: 30kB
  Buffers: shared hit=85
  ->  Index Scan using idx_job_applications_user_id on job_applications  (cost=0.29..12.16 rows=50 width=246) (actual time=0.049..0.079 rows=50 loops=1)
        Index Cond: (user_id = 'faf10ed5-07e4-4b67-8572-5fc8e44b2fc1'::uuid)
        Buffers: shared hit=85
Planning Time: 0.067 ms
Execution Time: 0.108 ms
[WITHOUT 20260731000000_performance_indexes.sql]
Sort  (cost=798.04..798.16 rows=50 width=246) (actual time=0.889..0.891 rows=50 loops=1)
  Sort Key: updated_at DESC
  Sort Method: quicksort  Memory: 30kB
  Buffers: shared hit=671
  ->  Seq Scan on job_applications  (cost=0.00..796.62 rows=50 width=246) (actual time=0.875..0.882 rows=50 loops=1)
        Filter: (user_id = 'faf10ed5-07e4-4b67-8572-5fc8e44b2fc1'::uuid)
        Rows Removed by Filter: 10000
        Buffers: shared hit=671
Planning Time: 0.057 ms
Execution Time: 0.909 ms

--- Query: listApplications filtered by status = interview (User 1) ---
[WITH 20260731000000_performance_indexes.sql]
Sort  (cost=810.26..813.82 rows=1422 width=246) (actual time=1.018..1.071 rows=1429 loops=1)
  Sort Key: updated_at DESC
  Sort Method: quicksort  Memory: 405kB
  Buffers: shared hit=679
  ->  Bitmap Heap Scan on job_applications  (cost=43.36..735.79 rows=1422 width=246) (actual time=0.308..0.841 rows=1429 loops=1)
        Recheck Cond: (status = 'interview'::text)
        Filter: (user_id = '846b356d-c766-4129-a1ee-7153cfc16cdf'::uuid)
        Heap Blocks: exact=671
        Buffers: shared hit=679
        ->  Bitmap Index Scan on idx_job_applications_status  (cost=0.00..43.00 rows=1429 width=0) (actual time=0.176..0.177 rows=5716 loops=1)
              Index Cond: (status = 'interview'::text)
              Buffers: shared hit=8
Planning Time: 0.065 ms
Execution Time: 1.138 ms
[WITHOUT 20260731000000_performance_indexes.sql]
Sort  (cost=896.22..899.77 rows=1422 width=246) (actual time=1.388..1.442 rows=1429 loops=1)
  Sort Key: updated_at DESC
  Sort Method: quicksort  Memory: 405kB
  Buffers: shared hit=671
  ->  Seq Scan on job_applications  (cost=0.00..821.75 rows=1422 width=246) (actual time=0.031..1.215 rows=1429 loops=1)
        Filter: ((user_id = '846b356d-c766-4129-a1ee-7153cfc16cdf'::uuid) AND (status = 'interview'::text))
        Rows Removed by Filter: 8621
        Buffers: shared hit=671
Planning Time: 0.040 ms
Execution Time: 1.494 ms

--- Query: listResumes (User 1: 20 / 25 rows) ---
[WITH 20260731000000_performance_indexes.sql]
Sort  (cost=59.35..59.40 rows=20 width=428) (actual time=0.076..0.077 rows=20 loops=1)
  Sort Key: updated_at DESC
  Sort Method: quicksort  Memory: 33kB
  Buffers: shared hit=92
  ->  Bitmap Heap Scan on resumes  (cost=8.29..58.92 rows=20 width=428) (actual time=0.024..0.067 rows=20 loops=1)
        Recheck Cond: (user_id = '846b356d-c766-4129-a1ee-7153cfc16cdf'::uuid)
        Heap Blocks: exact=91
        Buffers: shared hit=92
        ->  Bitmap Index Scan on idx_resumes_user_id  (cost=0.00..8.29 rows=20 width=0) (actual time=0.013..0.013 rows=424 loops=1)
              Index Cond: (user_id = '846b356d-c766-4129-a1ee-7153cfc16cdf'::uuid)
              Buffers: shared hit=1
Planning:
  Buffers: shared hit=42
Planning Time: 0.110 ms
Execution Time: 0.090 ms
[WITHOUT 20260731000000_performance_indexes.sql]
Sort  (cost=59.35..59.40 rows=20 width=428) (actual time=0.103..0.105 rows=20 loops=1)
  Sort Key: updated_at DESC
  Sort Method: quicksort  Memory: 33kB
  Buffers: shared hit=92
  ->  Bitmap Heap Scan on resumes  (cost=8.29..58.92 rows=20 width=428) (actual time=0.037..0.090 rows=20 loops=1)
        Recheck Cond: (user_id = '846b356d-c766-4129-a1ee-7153cfc16cdf'::uuid)
        Heap Blocks: exact=91
        Buffers: shared hit=92
        ->  Bitmap Index Scan on idx_resumes_user_id  (cost=0.00..8.29 rows=20 width=0) (actual time=0.020..0.020 rows=424 loops=1)
              Index Cond: (user_id = '846b356d-c766-4129-a1ee-7153cfc16cdf'::uuid)
              Buffers: shared hit=1
Planning:
  Buffers: shared hit=35
Planning Time: 0.113 ms
Execution Time: 0.126 ms
```

---

## 4. Unit Tests & `lib/` Coverage Before vs After (`@vitest/coverage-v8`)

**Command:**

```bash
npm run test:coverage
# expands to:
# vitest run --coverage --coverage.provider=v8 --coverage.include="lib/**/*.ts" --coverage.reporter=text
```

Added two new test files mocking `@/utils/supabase/client`:
- `tests/resumes-data.test.ts` (15 tests): `listResumes`, `getResume`, `createResume`, `updateResume` (conditional `expectedVersion` match, `VersionConflictError` with `serverResume`, deleted-row `Resume not found`, template normalization, error propagation), `deleteResume`.
- `tests/applications-data.test.ts` (15 tests): `listApplications`, `getApplication`, `createApplication`, `updateApplication`, `updateApplicationStatus` (idempotent no-op when already at target status, mutation on stage change, concurrent duplicate drop coalescing into a single select + update, error cleanup), `deleteApplication`.

### Before vs After Comparison

| Metric | Before | After | Delta |
| --- | ---: | ---: | ---: |
| **Test Files** | 5 | **7** | +2 |
| **Total Passing Tests** | 24 | **54** | **+30** |
| **`lib/**/*.ts` Statements / Lines** | 27.45% | **41.01%** | **+13.56 pp** |
| **`lib/**/*.ts` Branches** | 59.85% | **81.27%** | **+21.42 pp** |
| **`lib/**/*.ts` Functions** | 57.14% | **75.51%** | **+18.37 pp** |
| **`lib/data/**` Statements / Lines** | 15.53% | **55.62%** | **+40.09 pp** |
| **`lib/data/resumes.ts` Stmts / Branch / Funcs** | 51.20% / 17.39% / 37.50% | **99.39% / 93.75% / 100.00%** | +48.19 / +76.36 / +62.50 pp |
| **`lib/data/applications.ts` Stmts / Branch / Funcs** | 0.00% / 0.00% / 0.00% | **99.42% / 89.04% / 100.00%** | +99.42 / +89.04 / +100.00 pp |

### Raw Output — BEFORE Adding New Tests

```text
 RUN  v3.0.0 C:/Users/arush/OneDrive/Desktop/Velora
      Coverage enabled with v8

 ✓ tests/resume-conflict.test.ts (2 tests) 61ms
 ✓ tests/call-with-retry.test.ts (3 tests) 234ms
 ✓ tests/ats-analyzer.test.ts (5 tests) 331ms
 ✓ tests/api-guard.test.ts (3 tests) 70ms
 ✓ tests/auth.test.ts (11 tests) 348ms

 Test Files  5 passed (5)
      Tests  24 passed (24)
   Start at  19:48:17
   Duration  2.48s

 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------|---------|----------|---------|---------|-------------------
All files          |   27.45 |    59.85 |   57.14 |   27.45 |
 lib               |   33.54 |    70.37 |   70.37 |   33.54 |
  ...etry-cache.ts |   62.16 |       95 |   33.33 |   62.16 | ...,73-76,106-107
  api-guard.ts     |   64.28 |     61.9 |    87.5 |   64.28 | ...46-151,156-187
  ats-analyzer.ts  |   91.66 |       66 |     100 |   91.66 | ...,63-64,116-117
  auth-redirect.ts |     100 |    76.92 |     100 |     100 | 1,9,27
  ...-templates.ts |       0 |        0 |       0 |       0 | 1-763
  mock-data.ts     |   99.17 |      100 |       0 |   99.17 | 1
  templates.ts     |   98.03 |       50 |     100 |   98.03 | 1
  ...data-store.ts |       0 |        0 |       0 |       0 | 1-687
 lib/data          |   15.53 |    20.68 |   33.33 |   15.53 |
  applications.ts  |       0 |        0 |       0 |       0 | 1-222
  demo-storage.ts  |       0 |        0 |       0 |       0 | 1-221
  index.ts         |       0 |        0 |       0 |       0 | 1-5
  resumes.ts       |    51.2 |    17.39 |    37.5 |    51.2 | ...94-195,200-208
  tracks.ts        |       0 |        0 |       0 |       0 | 1-120
  types.ts         |   92.85 |      100 |   66.66 |   92.85 | 1
-------------------|---------|----------|---------|---------|-------------------
```

### Raw Output — AFTER Adding `tests/resumes-data.test.ts` and `tests/applications-data.test.ts`

```text
 RUN  v3.0.0 C:/Users/arush/OneDrive/Desktop/Velora
      Coverage enabled with v8

 ✓ tests/resume-conflict.test.ts (2 tests) 44ms
 ✓ tests/call-with-retry.test.ts (3 tests) 191ms
 ✓ tests/api-guard.test.ts (3 tests) 81ms
 ✓ tests/ats-analyzer.test.ts (5 tests) 309ms
 ✓ tests/applications-data.test.ts (15 tests) 320ms
 ✓ tests/resumes-data.test.ts (15 tests) 336ms
 ✓ tests/auth.test.ts (11 tests) 210ms

 Test Files  7 passed (7)
      Tests  54 passed (54)
   Start at  19:50:58
   Duration  2.25s

 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------|---------|----------|---------|---------|-------------------
All files          |   41.01 |    81.27 |   75.51 |   41.01 |
 lib               |   33.54 |    70.37 |   70.37 |   33.54 |
  ...etry-cache.ts |   62.16 |       95 |   33.33 |   62.16 | ...,73-76,106-107
  api-guard.ts     |   64.28 |     61.9 |    87.5 |   64.28 | ...46-151,156-187
  ats-analyzer.ts  |   91.66 |       66 |     100 |   91.66 | ...,63-64,116-117
  auth-redirect.ts |     100 |    76.92 |     100 |     100 | 1,9,27
  ...-templates.ts |       0 |        0 |       0 |       0 | 1-763
  mock-data.ts     |   99.17 |      100 |       0 |   99.17 | 1
  templates.ts     |   98.03 |       50 |     100 |   98.03 | 1
  ...data-store.ts |       0 |        0 |       0 |       0 | 1-687
 lib/data          |   55.62 |    89.51 |   81.81 |   55.62 |
  applications.ts  |   99.42 |    89.04 |     100 |   99.42 | 1
  demo-storage.ts  |       0 |        0 |       0 |       0 | 1-221
  index.ts         |       0 |        0 |       0 |       0 | 1-5
  resumes.ts       |   99.39 |    93.75 |     100 |   99.39 | 1
  tracks.ts        |       0 |        0 |       0 |       0 | 1-120
  types.ts         |   92.85 |      100 |   66.66 |   92.85 | 1
-------------------|---------|----------|---------|---------|-------------------
```

---

## 5. Optional: Lighthouse Mobile Scores (Local Production Build)

**Command:**

```bash
npm run bench:lighthouse
```

Runs `lighthouse@12` (`--form-factor=mobile`) against `next start` (`http://127.0.0.1:3107`) on `/` and `/sign-in`. (Note: `lighthouse@13.6.0` requires Node `>= 22.19`, so `bench/lighthouse.mjs` pins `lighthouse@12` for compatibility with Node `v20.13.1`.)

### Summary Table

| Route | Performance | Accessibility | Best Practices | SEO | FCP (ms) | LCP (ms) | TBT (ms) | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | **74** | **98** | **100** | **90** | 1,334 | 2,827 | 972 | 0.0055 |
| `/sign-in` | **90** | **98** | **100** | **90** | 1,228 | 2,965 | 250 | 0 |

### Raw Output

```text
> velora@0.1.0 bench:lighthouse
> node bench/lighthouse.mjs

Running Lighthouse (mobile) against http://127.0.0.1:3107/...
Running Lighthouse (mobile) against http://127.0.0.1:3107/sign-in...
┌─────────┬────────────┬─────────────┬───────────────┬───────────────┬─────┬───────┬───────┬───────┬────────┐
│ (index) │ route      │ performance │ accessibility │ bestPractices │ seo │ fcpMs │ lcpMs │ tbtMs │ cls    │
├─────────┼────────────┼─────────────┼───────────────┼───────────────┼─────┼───────┼───────┼───────┼────────┤
│ 0       │ '/'        │ 74          │ 98            │ 100           │ 90  │ 1334  │ 2827  │ 972   │ 0.0055 │
│ 1       │ '/sign-in' │ 90          │ 98            │ 100           │ 90  │ 1228  │ 2965  │ 250   │ 0      │
└─────────┴────────────┴─────────────┴───────────────┴───────────────┴─────┴───────┴───────┴───────┴────────┘
```

---

## Limitations & Discovered Findings

1. **Discovered `@supabase/ssr@0.3.0` Cookie API Mismatch (Server/Middleware Auth)**: `package.json` installs `@supabase/ssr@^0.3.0`, whose `createServerClient` only implements `cookies.get` / `cookies.set` / `cookies.remove`. Both `utils/supabase/middleware.ts` and `utils/supabase/server.ts` pass `cookies.getAll` / `cookies.setAll` (introduced in `@supabase/ssr@0.4.0`), causing server-side `getUser()` to ignore incoming session cookies and redirect `/dashboard/*` to `/sign-in` (`HTTP 307`). Per the benchmark rules, application code was not modified; fixing this in a follow-up PR requires upgrading `@supabase/ssr` to `>=0.5.x` (or switching to `get`/`set`/`remove`).
2. **No Next.js CRUD API Routes**: Velora reads/writes resumes and applications directly from the browser against Supabase PostgREST (`lib/data/resumes.ts` and `lib/data/applications.ts`), so Benchmark 3 measured the exact authenticated PostgREST endpoints rather than Next.js `/api/*` handlers.
3. **PostgREST `max_rows = 1000` Cap**: Per `supabase/config.toml`, PostgREST caps unpaginated `SELECT` responses at 1,000 rows (`~250 KB` JSON per response). `List Applications` (`63.0 req/s`, `p50 278 ms`) reflects sorting 10,000 rows in Postgres and serializing 1,000 rows per request over localhost; adding keyset pagination + a composite `(user_id, updated_at DESC)` index would substantially reduce both payload size and sort cost.
4. **Windows ↔ WSL2 Loopback & Single-Machine Contention**: Load generator (`autocannon`), Next.js (`next start`), Kong, PostgREST, GoTrue, and PostgreSQL all shared one 6-core laptop across the Windows/WSL2 virtual network bridge. Small socket error rates (`0.44%` on `List Resumes`, `0.13%` on `Save Resume`) reflect local ephemeral TCP/Kong connection pressure at 20 concurrent keep-alive connections rather than application 5xx responses (`non2xx = 0` across all three scenarios).
5. **Hot Single-Row Contention on `Save Resume`**: The `Save Resume` autocannon run sent 20 concurrent `PATCH` requests to the same resume row without `expectedVersion` (measuring raw write throughput including Postgres row locking and `trg_resumes_increment_version` + `trg_resumes_set_updated_at` triggers). Multi-row write workloads would exhibit less lock contention.
6. **Lighthouse Scope**: Lighthouse mobile audits ran on unauthenticated public routes (`/` and `/sign-in`) over localhost without CDN caching, compression headers from a reverse proxy, or real mobile network RTT (only Lighthouse's simulated Moto G Power 4G throttling).
7. **Remaining Uncovered `lib/` Files**: `lib/latex-templates.ts` (763 lines of static template strings), `lib/user-data-store.ts` (React hook wrapper), `lib/data/demo-storage.ts`, and `lib/data/tracks.ts` remain at 0% in the current suite, accounting for the remaining uncovered statements in `lib/**/*.ts`.
