# 📊 Local Load Test & Performance Baseline

This document records the measured local HTTP baseline for Velora's Next.js 15 production server (`next start`) using [`scripts/loadtest/run-loadtest.mjs`](../scripts/loadtest/run-loadtest.mjs) (`autocannon`), with a companion [`scripts/loadtest/k6.js`](../scripts/loadtest/k6.js) script for environments with `k6` installed.

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
| **Load Generator** | `autocannon` (`20` concurrent connections, `10s` duration, pipelining `1`) |
| **Date Measured** | 2026-10-30 |

---

## 🧪 Test Scenario

- **`GET /api/ping` (Next.js Production Server Baseline)**
  - **Target**: `http://127.0.0.1:3105/api/ping` served by `npx next start`.
  - **What it exercises**: Full Next.js 15 App Router request lifecycle (`force-dynamic` route handler returning `{ ok: true, timestamp: Date.now() }`).
  - **Why AI routes are not load-tested against live Gemini**: Production `/api/ai/*` routes enforce per-user authentication (`requireUser()`) and atomic Postgres rate limiting (`increment_ai_usage`, capped at 10 req/min per user per route) before calling Google Gemini (`1.5s–8s` upstream inference time). Unit tests for `requireUser`, `enforceRateLimit`, `callWithRetry`, and `parseAndNormalizeAtsAnalysis` run in Vitest (`npm test`).

---

## 📈 Measured Results

> **Note on Percentiles**: `autocannon`'s native histogram reports `p50`, `p90`, `p97.5` (its standard upper-90s bucket alongside `p90`/`p99`), and `p99`. Both `p90` and `p97.5` are listed below.

| Scenario | Concurrent Connections | Duration | Total Requests | Avg Throughput (req/s) | p50 Latency | p90 Latency | p95 (`p97.5`) Latency | p99 Latency | Avg Latency | Max Latency | Error / Non-2xx Rate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`GET /api/ping`** *(Next.js `next start`)* | 20 | 10.02 s | 6,420 | **642 req/s** | **25 ms** | 38 ms | **90 ms** | 189 ms | 30.55 ms | 401 ms | **0.00%** (0 errors, 0 timeouts, 0 non-2xx) |

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
      "p90": 38,
      "p95": 90,
      "p97_5": 90,
      "p99": 189,
      "average": 30.55,
      "max": 401
    },
    "errors": 0,
    "timeouts": 0,
    "non2xx": 0,
    "errorRatePercent": "0.00%"
  }
]
```

---

## ▶️ How to Reproduce Locally

1. Ensure a production build exists:
   ```bash
   npm run build
   ```
2. Run the automated `autocannon` baseline (spawns `next start` on port `3105`, runs the 10-second test against `/api/ping`, prints the JSON report, and shuts the server down):
   ```bash
   npm run loadtest
   ```
3. *(Optional)* If you have [`k6`](https://grafana.com/docs/k6/latest/) installed and want to run the k6 script against a running server:
   ```bash
   k6 run scripts/loadtest/k6.js
   ```
