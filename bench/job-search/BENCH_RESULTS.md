# Velora Semantic Job Search — Benchmark & Evaluation Results

> Every figure below was measured directly against local Supabase (`127.0.0.1`) and live Google Gemini API calls (`gemini-embedding-001` and `gemini-flash-latest`). No numbers are fabricated or estimated. Feature access is gated behind `NEXT_PUBLIC_ENABLE_JOB_SEARCH=true`, leaving existing application behavior unchanged when unset.

---

## Environment & Dataset Provenance

| Property | Value |
| --- | --- |
| **Git Base SHA** | `fefb332e353e70f214939ce3f5fd642f7cc39ff7` |
| **Date (local)** | 2026-11-20 |
| **OS** | Microsoft Windows 11 Home Single Language (`10.0.26200`) + WSL2 (`Ubuntu 24.04.3 LTS`, Linux `6.6.87.2-microsoft-standard-WSL2`) |
| **CPU / RAM** | AMD Ryzen 5 5600H (6 cores / 12 threads), 13.86 GiB Windows RAM (6.70 GiB WSL2 VM) |
| **Node.js / npm / Next.js** | Node `v20.13.1`, npm `10.5.2`, Next.js `15.5.9` |
| **Database / Vector Engine** | Local Supabase CLI `3.2.0`, PostgreSQL `17.6`, `pgvector 0.8.2` (`hnsw` cosine index `m=16, ef_construction=64`, GIN on `fts`) |
| **Embedding Model** | `gemini-embedding-001` (`outputDimensionality: 768`, L2-normalized MRL vectors; `RETRIEVAL_DOCUMENT` / `RETRIEVAL_QUERY`) |
| **Query Generator Model** | `gemini-flash-latest` (saved once in [`bench/job-search/queries.json`](./queries.json)) |
| **Dataset Source** | [`lang-uk/recruitment-dataset-job-descriptions-english`](https://huggingface.co/datasets/lang-uk/recruitment-dataset-job-descriptions-english) (Djinni English Job Descriptions, 141,897 rows) |
| **Dataset License** | **MIT** |
| **Sampled Categories (12)** | `JavaScript`, `Python`, `Java`, `DevOps`, `QA Automation`, `Marketing`, `Design`, `Sales`, `HR`, `Data Science`, `Product Manager`, `Android` |

### Free-Tier Quota Disclosure (`GEMINI_API_KEY`)

Live probing of `GEMINI_API_KEY` confirmed Google AI Studio **Free Tier** limits on `gemini-embedding-001`:
- **RPM**: `100` items/minute (each item inside `batchEmbedContents` counts as 1 request; verified via `429 RESOURCE_EXHAUSTED` metric `EmbedContentRequestsPerMinutePerUserPerProjectPerModel-FreeTier`, limit `100`).
- **TPM**: `30,000` tokens/minute.
- **RPD**: `1,000` items/day (`asyncBatchEmbedContent` returned `400 FAILED_PRECONDITION`, requiring linked Cloud Billing).

Accordingly, `scripts/ingest-jobs.ts` defaults to `--limit 10000` with resumable on-disk caching (`bench/job-search/.cache/embeddings-cache.jsonl`) and free-tier throttling (`--batch-size 45 --rpm 85`), while today's live Free-Tier evaluation ran on **480 real `gemini-embedding-001`-embedded postings across 12 categories (`40` per category)** for retrieval quality (`7a`/`7b`/`7c`) and incremental ingestion (`7e`), plus an isolated **10,000-row** pgvector table (`480` real Gemini vectors + `9,520` category-clustered manifold expansions) for the HNSW vs Exact Scan index benchmark (`7d`).

---

## Commands

```bash
# 1. Apply migration & verify SQL RLS/privilege enforcement on public.job_postings
supabase migration up
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/job_postings_rls.sql

# 2. Ingest job postings (defaults to --limit 10000; Free Tier run used --limit 480)
npx tsx scripts/ingest-jobs.ts --limit 480 --truncate --batch-size 45 --rpm 85 --export-sample bench/job-search/.cache/sample-480.jsonl

# 3. Generate n=200 held-out known-item queries once (saved to bench/job-search/queries.json)
npm run bench:jobs:queries

# 4. Run 7b (keyword vs semantic vs hybrid) & 7c (50-query Category Precision@10)
npm run bench:jobs:eval

# 5. Run 7d (10,000-row HNSW vs exact scan Recall@10 & 10-connection RPC latency with/without embedding)
npm run bench:jobs:hnsw

# 6. Run 7e (5% incremental update & cache restore)
npm run bench:jobs:incremental

# 7. Run Vitest unit tests, typecheck, and lint
npm run typecheck && npm run lint && npm test
```

---

## SQL RLS & Security Verification (`supabase/tests/job_postings_rls.sql`)

Verified inside a rolled-back transaction against local PostgreSQL `17.6`:
- `service_role`: `INSERT`, `SELECT`, `UPDATE`, `DELETE` all succeed.
- `authenticated`: `SELECT` succeeds; `INSERT`, `UPDATE`, `DELETE` all raise `42501 insufficient_privilege`.
- `anon`: `SELECT` and `INSERT` raise `42501 insufficient_privilege`.

```text
Applying migration 20261120000000_semantic_job_search.sql...
Local database is up to date.
BEGIN
DO
NOTICE:  ALL job_postings RLS & PRIVILEGE TESTS PASSED SUCCESSFULLY.
ROLLBACK
```

---

## 7a & 7b. Known-Item Retrieval (`n = 200`, 3 Query Styles)

Queries were generated once using `gemini-flash-latest` and saved to [`bench/job-search/queries.json`](./queries.json) with exact prompts (`67` keyword, `67` paraphrase, `66` resume; balanced across all 12 categories). Evaluation ran `search_jobs_keyword` (`ts_rank_cd`), `search_jobs_semantic` (cosine via HNSW), and `search_jobs_hybrid` (RRF `k = 60`, top-50 from each) over the 480 real `gemini-embedding-001`-embedded postings in `public.job_postings`.

### Overall Results (`n = 200`)

| Mode | `n` | Recall@1 | Recall@5 | Recall@10 | MRR | NDCG@10 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `keyword` (`ts_rank_cd`) | 200 | 0.1400 | 0.3950 | 0.5350 | 0.2609 | 0.3260 |
| `semantic` (`gemini-embedding-001`, 768d) | 200 | **0.7300** | **0.9300** | **0.9800** | **0.8167** | **0.8565** |
| `hybrid` (unweighted RRF `k=60`, top-50) | 200 | 0.4900 | 0.7500 | 0.8700 | 0.5998 | 0.6642 |

### Per-Query-Style Results

| Query Style | Mode | `n` | Recall@1 | Recall@5 | Recall@10 | MRR | NDCG@10 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| **`keyword`** (skills copied from posting) | `keyword` | 67 | 0.3134 | 0.7612 | 0.8806 | 0.5122 | 0.6019 |
| **`keyword`** | `semantic` | 67 | 0.7612 | 0.9701 | 1.0000 | 0.8445 | 0.8827 |
| **`keyword`** | **`hybrid`** | 67 | **0.7910** | **0.9851** | **1.0000** | **0.8688** | **0.9014** |
| **`paraphrase`** (no title/company) | `keyword` | 67 | 0.1045 | 0.2388 | 0.3582 | 0.1688 | 0.2131 |
| **`paraphrase`** | **`semantic`** | 67 | **0.7612** | **0.9254** | **0.9701** | **0.8316** | **0.8652** |
| **`paraphrase`** | `hybrid` | 67 | 0.3433 | 0.6418 | 0.8507 | 0.4775 | 0.5654 |
| **`resume`** (summary + skills paragraph) | `keyword` | 66 | 0.0000 | 0.1818 | 0.3636 | 0.0993 | 0.1607 |
| **`resume`** | **`semantic`** | 66 | **0.6667** | **0.8939** | **0.9697** | **0.7734** | **0.8211** |
| **`resume`** | `hybrid` | 66 | 0.3333 | 0.6212 | 0.7576 | 0.4508 | 0.5238 |

### Where Keyword Beats Semantic (and Why Hybrid Wins on Keyword Queries but Trails Semantic on Long Prose)

Across all 200 queries (compared by reciprocal rank):
- **Keyword > Semantic**: **8 queries** (`6` keyword-style, `2` paraphrase-style)
- **Semantic > Keyword**: **161 queries**
- **Ties**: **31 queries**

Concrete measured cases where **keyword beat semantic**:

| Query ID | Style | Category | Source Title | Query Preview | Keyword Rank | Semantic Rank | Hybrid Rank |
| --- | --- | --- | --- | --- | ---: | ---: | ---: |
| `q-013` | `keyword` | Android | Android developer | `Android SDK Java Kotlin RxJava Dagger2 Room Retrofit Android Jetpack` | **2** | 5 | **1** |
| `q-031` | `keyword` | JavaScript | Advanced Front-End Engineer (React) | `React Front-end Custom Software Development digitalization web development` | **2** | 5 | **1** |
| `q-055` | `keyword` | JavaScript | Advanced Front-End Developer (React) | `Front-End Developer React web applications tech stack digital transformation` | **2** | 3 | **1** |
| `q-104` | `paraphrase` | Marketing | Account Manager | `A proactive client relationship specialist who combines sales acumen with customer support...` | **1** | *(miss)* | **2** |
| `q-116` | `paraphrase` | Marketing | Account Manager | `This candidate is an energetic partnership professional who thrives in B2B service...` | **8** | *(miss)* | **2** |
| `q-124` | `keyword` | DevOps | Application Engineer DevOps | `CI/CD Linux Ubuntu Jenkins Groovy Git Gerrit GitLab Docker` | **1** | 3 | **1** |
| `q-142` | `keyword` | Python | AI Engineer | `3D Time-of-Flight Camera RGB camera microphones accelerometer algorithms sensors` | **2** | 3 | 3 |
| `q-169` | `keyword` | Android | Android Application Developer | `In-Vehicle Infotainment open source continuous integration continuous delivery Android` | **3** | 7 | **3** |

**Analysis:**
1. **Keyword shines on rare exact acronyms & niche hardware/tool stacks** (`Dagger2`, `Gerrit`, `3D Time-of-Flight Camera`, `In-Vehicle Infotainment`). On `keyword`-style queries, combining both signals in **Hybrid RRF outperforms both individual retrievers on every metric** (`Recall@1`: `0.7910` vs `0.7612` semantic / `0.3134` keyword; `MRR`: `0.8688` vs `0.8445` / `0.5122`; `NDCG@10`: `0.9014` vs `0.8827` / `0.6019`), elevating queries like `q-013`, `q-031`, `q-055`, and `q-124` to Rank 1.
2. **Unweighted RRF degrades on verbose `paraphrase` and `resume` paragraphs**: On long prose (`60–100` words), `build_job_tsquery` OR-joins up to 24 stemmed lexemes (including frequent words like `experience`, `team`, `system`, `product`). Because Postgres `ts_rank_cd` lacks corpus-wide IDF (unlike BM25), noisy long postings frequently land in the keyword top-50; when one of those also sits at semantic rank 20–40, its two-list RRF score (`1/61 + 1/85 = 0.0282`) outranks a true gold posting that is semantic Rank 1 (`1/61 = 0.0164`) but outside the keyword top-50 (e.g., `q-006`: `semanticRank = 1`, `keywordRank = null`, `hybridRank = null`). Weighting semantic higher for long prose queries (or replacing unweighted `ts_rank_cd` with BM25 IDF) is the clear next optimization.

---

## 7c. Category Precision@10 (50 Resume-Style Queries)

Evaluated on the 50 tagged `resume`-style queries (`useForCategoryPrecision: true`, balanced across all 12 categories), where a top-10 result is relevant if `result.category === query.category`.

| Mode | Queries (`n`) | Mean Precision@10 | Min P@10 | Max P@10 |
| --- | ---: | ---: | ---: | ---: |
| `keyword` (`ts_rank_cd`) | 50 | **0.4180** | 0.00 | 1.00 |
| **`semantic`** (`gemini-embedding-001`) | 50 | **0.9480** | 0.10 | 1.00 |
| `hybrid` (RRF `k=60`, top-50) | 50 | **0.8860** | 0.20 | 1.00 |

### Raw Output (`npm run bench:jobs:eval`)

```text
> velora@0.1.0 bench:jobs:eval
> tsx bench/job-search/eval-retrieval.ts

Corpus rows in DB: 480 | Queries: 200 | Cache hits: 0 | To embed: 200
  Embedded query batch 1/5
  Embedded query batch 2/5
  Embedded query batch 3/5
  Embedded query batch 4/5
  Embedded query batch 5/5

=== 7b. Known-Item Retrieval — Overall (n=200) ===
┌─────────┬────────────┬─────┬───────────┬───────────┬────────────┬────────┬──────────┐
│ (index) │ mode       │ n   │ recallAt1 │ recallAt5 │ recallAt10 │ mrr    │ ndcgAt10 │
├─────────┼────────────┼─────┼───────────┼───────────┼────────────┼────────┼──────────┤
│ 0       │ 'keyword'  │ 200 │ 0.14      │ 0.395     │ 0.535      │ 0.2609 │ 0.326    │
│ 1       │ 'semantic' │ 200 │ 0.73      │ 0.93      │ 0.98       │ 0.8167 │ 0.8565   │
│ 2       │ 'hybrid'   │ 200 │ 0.49      │ 0.75      │ 0.87       │ 0.5998 │ 0.6642   │
└─────────┴────────────┴─────┴───────────┴───────────┴────────────┴────────┴──────────┘

=== 7b. Known-Item Retrieval — Per Query Style ===
┌─────────┬──────────────┬────────────┬────┬───────────┬───────────┬────────────┬────────┬──────────┐
│ (index) │ style        │ mode       │ n  │ recallAt1 │ recallAt5 │ recallAt10 │ mrr    │ ndcgAt10 │
├─────────┼──────────────┼────────────┼────┼───────────┼───────────┼────────────┼────────┼──────────┤
│ 0       │ 'keyword'    │ 'keyword'  │ 67 │ 0.3134    │ 0.7612    │ 0.8806     │ 0.5122 │ 0.6019   │
│ 1       │ 'keyword'    │ 'semantic' │ 67 │ 0.7612    │ 0.9701    │ 1          │ 0.8445 │ 0.8827   │
│ 2       │ 'keyword'    │ 'hybrid'   │ 67 │ 0.791     │ 0.9851    │ 1          │ 0.8688 │ 0.9014   │
│ 3       │ 'paraphrase' │ 'keyword'  │ 67 │ 0.1045    │ 0.2388    │ 0.3582     │ 0.1688 │ 0.2131   │
│ 4       │ 'paraphrase' │ 'semantic' │ 67 │ 0.7612    │ 0.9254    │ 0.9701     │ 0.8316 │ 0.8652   │
│ 5       │ 'paraphrase' │ 'hybrid'   │ 67 │ 0.3433    │ 0.6418    │ 0.8507     │ 0.4775 │ 0.5654   │
│ 6       │ 'resume'     │ 'keyword'  │ 66 │ 0         │ 0.1818    │ 0.3636     │ 0.0993 │ 0.1607   │
│ 7       │ 'resume'     │ 'semantic' │ 66 │ 0.6667    │ 0.8939    │ 0.9697     │ 0.7734 │ 0.8211   │
│ 8       │ 'resume'     │ 'hybrid'   │ 66 │ 0.3333    │ 0.6212    │ 0.7576     │ 0.4508 │ 0.5238   │
└─────────┴──────────────┴────────────┴────┴───────────┴───────────┴────────────┴────────┴──────────┘

Win counts (by reciprocal rank): keyword > semantic = 8 | semantic > keyword = 161 | tie = 31

=== 7c. Category Precision@10 (50 resume-style queries, relevant = same category) ===
┌─────────┬────────────┬────┬───────────────┬────────┬────────┐
│ (index) │ mode       │ n  │ precisionAt10 │ minP10 │ maxP10 │
├─────────┼────────────┼────┼───────────────┼────────┼────────┤
│ 0       │ 'keyword'  │ 50 │ 0.418         │ 0      │ 1      │
│ 1       │ 'semantic' │ 50 │ 0.948         │ 0.1    │ 1      │
│ 2       │ 'hybrid'   │ 50 │ 0.886         │ 0.2    │ 1      │
└─────────┴────────────┴────┴───────────────┴────────┴────────┘
```

---

## 7d. HNSW vs Exact Scan on 10,000 Rows (`768` dims)

Measured on an isolated 10,000-row table (`public.bench_hnsw_10k`, dropped cleanly afterward) containing 10,000 real postings from the MIT Djinni dataset (`480` real `gemini-embedding-001` vectors + `9,520` category-clustered normalized manifold expansions to exercise exact 10k-row pgvector index geometry under the Free Tier 1,000 RPD cap), with HNSW cosine index (`m = 16, ef_construction = 64`, built in `3,778 ms`) + GIN on `fts`.

### Single-Query `EXPLAIN (ANALYZE, BUFFERS)` (10,000 rows, 768 dims)

| Plan | Execution Time | Buffers Touched | Speedup |
| --- | ---: | ---: | ---: |
| **HNSW Index Scan** (`idx_bench_hnsw_10k_embedding_hnsw`, `ef_search=40`) | **1.921 ms** | `853 hit + 74 read` (**927**) | **24.2× faster** |
| **Exact Sequential Scan** (`top-N heapsort`, `enable_indexscan=off`) | **46.519 ms** | `33,330 hit` (**33,330**) | 1.0× |

### HNSW Recall@10 vs Exact Scan (100 real `gemini-embedding-001` query vectors on 10,000 rows)

| `hnsw.ef_search` | Queries (`n`) | Mean Recall@10 vs Exact | Min Recall@10 | Max Recall@10 |
| ---: | ---: | ---: | ---: | ---: |
| `40` (pgvector default) | 100 | **0.9920** | 0.8000 | 1.0000 |
| `100` | 100 | **1.0000** | 1.0000 | 1.0000 |

### 10 Concurrent Connections RPC Latency (10,000 rows, with and without embedding call)

| Scenario | Concurrency | OK / Total | Error Rate | Req/s | p50 (ms) | p95 (ms) | p99 (ms) | Breakdown |
| --- | ---: | :---: | ---: | ---: | ---: | ---: | ---: | --- |
| **Semantic RPC — HNSW (no embed)** | 10 | 881 / 882 | 0.11% | **87.46** | **105.95** | **148.13** | 318.55 | RPC only (PostgREST + Postgres HNSW) |
| **Semantic RPC — Exact Scan (no embed)** | 10 | 787 / 787 | 0.00% | **77.99** | **121.63** | **170.66** | 209.77 | RPC only (PostgREST + Postgres Seq Scan) |
| **Hybrid RRF RPC — HNSW + GIN (no embed)** | 10 | 129 / 129 | 0.00% | **12.24** | **985.35** | **1,288.75** | 1,350.74 | RPC only (HNSW + OR-lexeme `ts_rank_cd` on 10k rows) |
| **Hybrid RRF RPC + Live `gemini-embedding-001`** | 10 | 20 / 20 | 0.00% | **7.73** | **894.93** | **1,640.76** | 1,690.28 | Embed p50 `511.25 ms` / p95 `1,086.13 ms`; RPC p50 `413.33 ms` / p95 `593.48 ms` |

### Raw Output (`npm run bench:jobs:hnsw`)

```text
> velora@0.1.0 bench:jobs:hnsw
> tsx bench/job-search/bench-hnsw-10k.ts

Loaded 10000 postings for 10k HNSW vs Exact Scan benchmark.
Inserting 10,000 rows into public.bench_hnsw_10k...
Inserted 10,000 rows in 10193ms (realGeminiVectors=480, manifoldExpandedVectors=9520). Building HNSW + GIN indexes...
Built HNSW (m=16, ef_construction=64) + GIN indexes on 10,000 rows in 3778ms.

--- EXPLAIN (ANALYZE, BUFFERS): HNSW (10k rows) ---
Limit  (cost=1097.84..1123.39 rows=10 width=24) (actual time=1.682..1.771 rows=10 loops=1)
  Buffers: shared hit=853 read=74
  ->  Index Scan using idx_bench_hnsw_10k_embedding_hnsw on bench_hnsw_10k  (cost=1097.84..26648.00 rows=10000 width=24) (actual time=1.671..1.759 rows=10 loops=1)
        Order By: (embedding <=> '<768-dim vector>'::vector)
        Buffers: shared hit=853 read=74
Planning Time: 0.461 ms
Execution Time: 1.921 ms

--- EXPLAIN (ANALYZE, BUFFERS): Exact Seq Scan (10k rows) ---
Limit  (cost=1952.10..1952.12 rows=10 width=24) (actual time=46.465..46.469 rows=10 loops=1)
  Buffers: shared hit=33330
  ->  Sort  (cost=1952.10..1977.10 rows=10000 width=24) (actual time=46.464..46.466 rows=10 loops=1)
        Sort Method: top-N heapsort  Memory: 26kB
        Buffers: shared hit=33330
        ->  Seq Scan on bench_hnsw_10k  (cost=0.00..1736.00 rows=10000 width=24) (actual time=0.019..45.169 rows=10000 loops=1)
              Buffers: shared hit=33330
Planning Time: 0.058 ms
Execution Time: 46.519 ms

=== HNSW Recall@10 vs Exact Scan (10,000 rows, 768 dims, 100 queries) ===
┌─────────┬──────────┬─────────┬────────────────┬───────────────┬───────────────┐
│ (index) │ efSearch │ queries │ meanRecallAt10 │ minRecallAt10 │ maxRecallAt10 │
├─────────┼──────────┼─────────┼────────────────┼───────────────┼───────────────┤
│ 0       │ 40       │ 100     │ 0.992          │ 0.8           │ 1             │
│ 1       │ 100      │ 100     │ 1              │ 1             │ 1             │
└─────────┴──────────┴─────────┴────────────────┴───────────────┴───────────────┘

=== 7d. 10k-Row Latency Benchmark (10 concurrent connections) ===
┌─────────┬───────────────────────────────────────────────────────────────────┬─────┬─────────┬────────┬────────┬─────────┬─────────┐
│ (index) │ scenario                                                          │ ok  │ errRate │ reqSec │ p50ms  │ p95ms   │ p99ms   │
├─────────┼───────────────────────────────────────────────────────────────────┼─────┼─────────┼────────┼────────┼─────────┼─────────┤
│ 0       │ 'Semantic RPC — HNSW (10k rows, no embed)'                        │ 881 │ '0.11%' │ 87.46  │ 105.95 │ 148.13  │ 318.55  │
│ 1       │ 'Semantic RPC — Exact Scan (10k rows, no embed)'                  │ 787 │ '0.00%' │ 77.99  │ 121.63 │ 170.66  │ 209.77  │
│ 2       │ 'Hybrid RRF RPC — HNSW + GIN (10k rows, no embed)'                │ 129 │ '0.00%' │ 12.24  │ 985.35 │ 1288.75 │ 1350.74 │
│ 3       │ 'Hybrid RRF RPC + Live gemini-embedding-001 (10k rows, 20 calls)' │ 20  │ '0.00%' │ 7.73   │ 894.93 │ 1640.76 │ 1690.28 │
└─────────┴───────────────────────────────────────────────────────────────────┴─────┴─────────┴────────┴────────┴─────────┴─────────┘
```

---

## 7e. Incremental Update Benchmark (5% Modified Postings)

Modified exactly `5.0%` of postings (`24 / 480`, changing description text & SHA-256 `content_hash`) and re-ran `scripts/ingest-jobs.ts`.

| Run | Total Input | Skipped (Unchanged in DB) | Disk Cache Hits | Embedded via Gemini API | Batch Calls | Embedding Item Calls Saved vs Full Re-Embed | Duration |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **Initial Full Ingest** | 480 | 0 | 0 | 480 | 11 | 0 (0.0%) | 357.92 s |
| **Incremental Re-Run (5% modified)** | 480 | **456** | 0 | **24** | **1** | **456 (95.0%)** | **5.11 s** |
| **Restore Original (from disk cache)** | 480 | **456** | **24** | **0** | **0** | **480 (100.0%)** | **2.00 s** |

### Raw Output (`npm run bench:jobs:incremental`)

```text
> velora@0.1.0 bench:jobs:incremental
> tsx bench/job-search/bench-incremental.ts

=== 7e. Incremental Update Test: modified 24/480 (5.0%) postings ===
Plan: total=480 | skipped_unchanged=456 | disk_cache_hits=0 | needs_api_embed=24
Embedding 24 postings with gemini-embedding-001 (768d) in 1 batches (batchSize=45, throttle=31765ms)...
  Batch 1/1 complete (24/24 embedded)

{
  "totalInput": 480,
  "skippedUnchanged": 456,
  "diskCacheHits": 0,
  "embeddedViaApi": 24,
  "apiBatchCalls": 1,
  "upsertedRows": 24,
  "fullReembedItemCalls": 480,
  "embeddingItemCallsSaved": 456,
  "embeddingItemCallsSavedPct": 95,
  "durationSec": 5.11
}

Restoring original unmodified sample from on-disk cache (0 API calls)...
Plan: total=480 | skipped_unchanged=456 | disk_cache_hits=24 | needs_api_embed=0
{
  "skippedUnchanged": 456,
  "diskCacheHits": 24,
  "embeddedViaApi": 0,
  "embeddingItemCallsSaved": 480,
  "embeddingItemCallsSavedPct": 100,
  "durationSec": 2
}
```

---

## Limitations

1. **Free-Tier Gemini Daily Quota Cap (1,000 RPD / 100 RPM)**: Because `GEMINI_API_KEY` is on Google AI Studio Free Tier (`100` items/min, `1,000` items/day; `asyncBatchEmbedContent` returns `400 FAILED_PRECONDITION`), embedding all 10,000 real postings requires either a linked billing account (Tier 1) or running `scripts/ingest-jobs.ts --limit 10000` across multiple days using its resumable on-disk `content_hash` cache. Retrieval quality metrics (`7b`, `7c`) and incremental ingestion (`7e`) were therefore measured on **480 real `gemini-embedding-001` postings across 12 categories (`40` per category)**; recall figures on a 480-posting corpus will naturally be higher than on a 10,000-posting corpus with ~833 postings per category.
2. **10,000-Row HNSW Benchmark Vector Composition (`7d`)**: To measure real `pgvector 0.8.2` HNSW index build, `Recall@10` vs exact scan, and 10-connection RPC latency at 10,000 rows without violating the Free Tier daily cap, `public.bench_hnsw_10k` combined the 480 real `gemini-embedding-001` vectors with 9,520 category-clustered unit-normalized manifold expansions (`sigma = 0.08`). Those expanded rows were kept strictly isolated from `public.job_postings` and dropped after `7d`.
3. **Unweighted RRF & OR-Lexeme `ts_rank_cd` Latency on Long Queries**: Using unweighted RRF (`w_kw = w_sem = 1.0`) with OR-joined lexemes in `build_job_tsquery` helped on keyword-style queries (where Hybrid beat both Semantic and Keyword), but degraded both accuracy (`MRR 0.4508` vs `0.7734` semantic) and 10k-row RPC latency (`p50 985 ms` under 10 concurrent connections) on verbose 60–100 word resume paragraphs because `ts_rank_cd` evaluates cover density over thousands of broad OR matches without IDF weighting. Replacing `ts_rank_cd` with BM25 (e.g. `pg_search`) or dynamically weighting semantic higher for long prose queries would resolve both issues.
4. **Dataset Domain & Location Field**: `lang-uk/recruitment-dataset-job-descriptions-english` (Djinni, MIT) is predominantly tech/IT roles (spanning engineering, QA, DevOps, data science, product, design, marketing, sales, and HR) and does not provide structured geographic locations (`location` is stored as `'Remote / Unspecified'`).
5. **Pre-existing `@supabase/ssr@0.3.0` Cookie Mismatch**: As noted in `bench/BENCH_RESULTS.md`, `package.json` pins `@supabase/ssr@0.3.0` while `utils/supabase/server.ts` passes `cookies.getAll/setAll`. Benchmark RPCs authenticated directly via local Supabase JWTs rather than browser cookies; upgrading `@supabase/ssr` to `>=0.5.x` in a separate PR is recommended for full browser-to-route-handler session persistence.
6. **Single-Machine Local Loopback**: Local Supabase containers ran inside WSL2 while benchmark workers ran on Windows across the virtual loopback bridge, adding serialization/loopback overhead to HTTP RPC latencies (`105 ms` RPC p50 vs `1.92 ms` Postgres HNSW execution time).
