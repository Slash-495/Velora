# 📊 Local Load Test & Performance Report

This document records the measured local HTTP benchmark results for Velora using [`scripts/loadtest/run-loadtest.mjs`](../scripts/loadtest/run-loadtest.mjs) (`autocannon`) and provides a companion [`scripts/loadtest/k6.js`](../scripts/loadtest/k6.js) script for environments with `k6` installed.

---

## 🖥️ Test Environment (Measured Locally)

All numbers below were measured on a single local machine with client and server processes running on `127.0.0.1` (loopback):

| Parameter | Value |
| :--- | :--- |
| **OS** | Microsoft Windows NT 10.0.26200.0 (Windows 11) |
| **CPU** | AMD Ryzen 5 5600H with Radeon Graphics |
| **Memory** | 13.9 GB usable physical RAM |
| **Node.js Runtime** | `v20.13.1` |
| **Framework** | Next.js `15.5.9` (`next start` production build) |
| **Load Generator** | `autocannon` (`20` concurrent connections, `10s` per scenario, pipelining `1`) |
| **Date Measured** | 2026-10-30 |

---

## 🧪 Test Conditions & Scenarios

1. **Scenario 1 — `GET /api/ping` (Next.js Production Server)**
   - **Target**: `http://127.0.0.1:3105/api/ping` served by `npx next start`.
   - **What it exercises**: Full Next.js 15 App Router request lifecycle (`force-dynamic` route handler returning `{ ok: true, timestamp: Date.now() }`). Note that `/api/ping` is excluded from the Supabase session middleware matcher in [`middleware.ts`](../middleware.ts).

2. **Scenario 2 — `POST /api/ai/analyze-resume` (Stubbed AI Route Handler)**
   - **Target**: `http://127.0.0.1:3106/api/ai/analyze-resume` (local Node HTTP harness in [`scripts/loadtest/run-loadtest.mjs`](../scripts/loadtest/run-loadtest.mjs)).
   - **Request Payload**: `~1.3 KB` JSON body containing a structured `ResumeContent` object, `jdText`, `company`, and `role`.
   - **What it exercises**: Request stream buffering, JSON deserialization, payload size cap checks (`MAX_JSON_CHARS = 100,000`, `MAX_TEXT_CHARS = 15,000`), prompt string interpolation, markdown fence stripping, ATS score clamping (`[0, 100]`), and JSON response serialization (`200 OK`).
   - **What is stubbed**: Real Google Gemini network calls and remote Supabase Auth/Postgres round-trips are replaced with an in-memory stub so no external API quota is consumed and production auth/rate-limit guards in [`lib/api-guard.ts`](../lib/api-guard.ts) are not weakened.

---

## 📈 Measured Results

> **Note on Percentiles**: `autocannon`'s native histogram reports `p50`, `p90`, `p97.5` (used as the upper-90s / `p95` bucket in its standard output), and `p99`. Both `p90` and `p97.5` are listed below for full transparency.

| Scenario | Concurrent Connections | Duration | Total Requests | Avg Throughput (req/s) | p50 Latency | p90 Latency | p95 (`p97.5`) Latency | p99 Latency | Avg Latency | Max Latency | Error / Non-2xx Rate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`GET /api/ping`** *(Next.js `next start`)* | 20 | 10.02 s | 6,420 | **642 req/s** | **25 ms** | 38 ms | **90 ms** | 189 ms | 30.55 ms | 401 ms | **0.00%** (0 errors, 0 timeouts, 0 non-2xx) |
| **`POST /api/ai/analyze-resume`** *(Stubbed AI Handler)* | 20 | 10.01 s | 74,080 | **7,410 req/s** | **2 ms** | 3 ms | **4 ms** | 4 ms | 2.26 ms | 26 ms | **0.00%** (0 errors, 0 timeouts, 0 non-2xx) |

### Raw JSON Output from `npm run loadtest`

```json
[
  {
    "scenario": "GET /api/ping (Next.js Production Server)",
    "connections": 20,
    "durationSeconds": 10.02,
    "totalRequests": 6420,
    "requestsPerSecAvg": 642,
    "latencyMs": {
      "p50": 25,
      "p95": 90,
      "p90": 38,
      "p97_5": 90,
      "p99": 189,
      "average": 30.55,
      "max": 401
    },
    "errors": 0,
    "timeouts": 0,
    "non2xx": 0,
    "errorRatePercent": "0.00%"
  },
  {
    "scenario": "POST /api/ai/analyze-resume (Stubbed AI Route Handler)",
    "connections": 20,
    "durationSeconds": 10.01,
    "totalRequests": 74080,
    "requestsPerSecAvg": 7410,
    "latencyMs": {
      "p50": 2,
      "p95": 4,
      "p90": 3,
      "p97_5": 4,
      "p99": 4,
      "average": 2.26,
      "max": 26
    },
    "errors": 0,
    "timeouts": 0,
    "non2xx": 0,
    "errorRatePercent": "0.00%"
  }
]
```

---

## 🔍 Observations & Bottleneck Analysis

1. **Application CPU/Serialization Overhead is Negligible (`~2.3 ms` avg)**:
   - Validating a resume + job description payload, constructing the Gemini prompt, stripping markdown code fences, and normalizing the ATS JSON response takes **2 ms at p50** and **4 ms at p97.5/p99** (~7,410 req/s on a single Node thread).
   - In production, end-to-end `/api/ai/*` latency is therefore almost entirely dominated by **upstream Google Gemini inference time** (typically `1.5s–8s` for `gemini-flash-latest`) and **Supabase Auth + `ai_usage` Postgres round-trips** (`~20ms–80ms` depending on region proximity).
2. **Next.js App Router Overhead on `/api/ping` (`25 ms` p50 / `90 ms` p97.5)**:
   - On a single Windows Node process under 20 concurrent connections, Next.js 15's dynamic route handler serves `642 req/s` with `0%` errors. The `401 ms` max latency spike occurred during the first second of warmup.

---

## ▶️ How to Reproduce Locally

1. Ensure a production build exists:
   ```bash
   npm run build
   ```
2. Run the automated `autocannon` benchmark (automatically starts `next start` on port `3105` and the stubbed AI route server on port `3106`, runs both 10-second tests, prints the JSON report, and shuts both servers down):
   ```bash
   npm run loadtest
   ```
3. *(Optional)* If you have [`k6`](https://grafana.com/docs/k6/latest/) installed and want to run the k6 script against running servers:
   ```bash
   k6 run scripts/loadtest/k6.js
   ```
