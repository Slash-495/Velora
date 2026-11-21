-- Migration: Semantic Job Search (pgvector + FTS + HNSW/GIN + RLS + Hybrid RRF RPCs)

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- 2. Create public.job_postings table
CREATE TABLE IF NOT EXISTS public.job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  company TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  embedding extensions.vector(768),
  fts tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Keep updated_at current on updates (reuses public.set_updated_at() from hardening migration)
DROP TRIGGER IF EXISTS trg_job_postings_set_updated_at ON public.job_postings;
CREATE TRIGGER trg_job_postings_set_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 3. Indexes: HNSW (cosine) on embedding, GIN on fts, plus lookup indexes
CREATE INDEX IF NOT EXISTS idx_job_postings_embedding_hnsw
  ON public.job_postings
  USING hnsw (embedding extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_job_postings_fts_gin
  ON public.job_postings
  USING gin (fts);

CREATE INDEX IF NOT EXISTS idx_job_postings_category
  ON public.job_postings (category);

CREATE INDEX IF NOT EXISTS idx_job_postings_content_hash
  ON public.job_postings (content_hash);

-- 4. RLS & Privileges: authenticated SELECT only; writes restricted to service_role
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.job_postings FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.job_postings TO authenticated;
GRANT ALL ON TABLE public.job_postings TO service_role;

DROP POLICY IF EXISTS "Authenticated users can read job postings" ON public.job_postings;
CREATE POLICY "Authenticated users can read job postings"
  ON public.job_postings
  FOR SELECT
  TO authenticated
  USING (true);

-- 5. Helper: Build an English tsquery from free-form text (keyword, paraphrase, or resume paragraph)
-- Uses plainto_tsquery to stem & remove stopwords, caps to 24 unique lexemes, and OR-joins them
-- so ts_rank_cd scores partial & multi-term matches instead of returning 0 rows on long queries.
CREATE OR REPLACE FUNCTION public.build_job_tsquery(p_query TEXT)
RETURNS tsquery
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, extensions
AS $$
DECLARE
  v_plain TEXT;
  v_terms TEXT[];
  v_joined TEXT;
BEGIN
  IF p_query IS NULL OR btrim(p_query) = '' THEN
    RETURN NULL;
  END IF;

  v_plain := plainto_tsquery('english', left(p_query, 2000))::text;
  IF v_plain IS NULL OR v_plain = '' THEN
    RETURN NULL;
  END IF;

  SELECT array_agg(term ORDER BY ord)
  INTO v_terms
  FROM (
    SELECT term, min(ord) AS ord
    FROM unnest(string_to_array(v_plain, ' & ')) WITH ORDINALITY AS t(term, ord)
    WHERE term <> ''
    GROUP BY term
    ORDER BY min(ord)
    LIMIT 24
  ) s;

  IF v_terms IS NULL OR array_length(v_terms, 1) IS NULL THEN
    RETURN NULL;
  END IF;

  v_joined := array_to_string(v_terms, ' | ');
  RETURN v_joined::tsquery;
END;
$$;

-- 6. Keyword Search RPC (ts_rank_cd)
CREATE OR REPLACE FUNCTION public.search_jobs_keyword(
  p_query TEXT,
  p_limit INTEGER DEFAULT 10,
  p_exclude_tracked BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  source_id TEXT,
  title TEXT,
  company TEXT,
  location TEXT,
  description TEXT,
  category TEXT,
  keyword_score DOUBLE PRECISION,
  semantic_score DOUBLE PRECISION,
  score DOUBLE PRECISION,
  keyword_rank INTEGER,
  semantic_rank INTEGER
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
DECLARE
  v_tsq tsquery := public.build_job_tsquery(p_query);
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 10), 1), 50);
BEGIN
  IF v_tsq IS NULL THEN
    RETURN;
  END IF;

  IF p_exclude_tracked THEN
    RETURN QUERY
    SELECT
      jp.id,
      jp.source_id,
      jp.title,
      jp.company,
      jp.location,
      jp.description,
      jp.category,
      ts_rank_cd(jp.fts, v_tsq, 32)::double precision AS keyword_score,
      NULL::double precision AS semantic_score,
      ts_rank_cd(jp.fts, v_tsq, 32)::double precision AS score,
      ROW_NUMBER() OVER (
        ORDER BY ts_rank_cd(jp.fts, v_tsq, 32) DESC, jp.id ASC
      )::integer AS keyword_rank,
      NULL::integer AS semantic_rank
    FROM public.job_postings jp
    WHERE jp.fts @@ v_tsq
      AND NOT EXISTS (
        SELECT 1
        FROM public.job_applications ja
        WHERE ja.user_id = auth.uid()
          AND (
            (
              lower(btrim(ja.company_name)) = lower(btrim(jp.company))
              AND lower(btrim(ja.role_title)) = lower(btrim(jp.title))
            )
            OR (ja.notes IS NOT NULL AND ja.notes LIKE '%' || jp.source_id || '%')
          )
      )
    ORDER BY keyword_score DESC, jp.id ASC
    LIMIT v_limit;
  ELSE
    RETURN QUERY
    SELECT
      jp.id,
      jp.source_id,
      jp.title,
      jp.company,
      jp.location,
      jp.description,
      jp.category,
      ts_rank_cd(jp.fts, v_tsq, 32)::double precision AS keyword_score,
      NULL::double precision AS semantic_score,
      ts_rank_cd(jp.fts, v_tsq, 32)::double precision AS score,
      ROW_NUMBER() OVER (
        ORDER BY ts_rank_cd(jp.fts, v_tsq, 32) DESC, jp.id ASC
      )::integer AS keyword_rank,
      NULL::integer AS semantic_rank
    FROM public.job_postings jp
    WHERE jp.fts @@ v_tsq
    ORDER BY keyword_score DESC, jp.id ASC
    LIMIT v_limit;
  END IF;
END;
$$;

-- 7. Semantic Search RPC (cosine similarity via HNSW index)
CREATE OR REPLACE FUNCTION public.search_jobs_semantic(
  p_query_embedding extensions.vector(768),
  p_limit INTEGER DEFAULT 10,
  p_exclude_tracked BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  source_id TEXT,
  title TEXT,
  company TEXT,
  location TEXT,
  description TEXT,
  category TEXT,
  keyword_score DOUBLE PRECISION,
  semantic_score DOUBLE PRECISION,
  score DOUBLE PRECISION,
  keyword_rank INTEGER,
  semantic_rank INTEGER
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
DECLARE
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 10), 1), 50);
BEGIN
  IF p_query_embedding IS NULL THEN
    RETURN;
  END IF;

  IF p_exclude_tracked THEN
    RETURN QUERY
    WITH ranked AS (
      SELECT
        jp.id,
        jp.source_id,
        jp.title,
        jp.company,
        jp.location,
        jp.description,
        jp.category,
        (1.0 - (jp.embedding <=> p_query_embedding))::double precision AS sem_score
      FROM public.job_postings jp
      WHERE jp.embedding IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM public.job_applications ja
          WHERE ja.user_id = auth.uid()
            AND (
              (
                lower(btrim(ja.company_name)) = lower(btrim(jp.company))
                AND lower(btrim(ja.role_title)) = lower(btrim(jp.title))
              )
              OR (ja.notes IS NOT NULL AND ja.notes LIKE '%' || jp.source_id || '%')
            )
        )
      ORDER BY jp.embedding <=> p_query_embedding ASC
      LIMIT v_limit
    )
    SELECT
      r.id,
      r.source_id,
      r.title,
      r.company,
      r.location,
      r.description,
      r.category,
      NULL::double precision AS keyword_score,
      r.sem_score AS semantic_score,
      r.sem_score AS score,
      NULL::integer AS keyword_rank,
      ROW_NUMBER() OVER (ORDER BY r.sem_score DESC, r.id ASC)::integer AS semantic_rank
    FROM ranked r
    ORDER BY r.sem_score DESC, r.id ASC;
  ELSE
    RETURN QUERY
    WITH ranked AS (
      SELECT
        jp.id,
        jp.source_id,
        jp.title,
        jp.company,
        jp.location,
        jp.description,
        jp.category,
        (1.0 - (jp.embedding <=> p_query_embedding))::double precision AS sem_score
      FROM public.job_postings jp
      WHERE jp.embedding IS NOT NULL
      ORDER BY jp.embedding <=> p_query_embedding ASC
      LIMIT v_limit
    )
    SELECT
      r.id,
      r.source_id,
      r.title,
      r.company,
      r.location,
      r.description,
      r.category,
      NULL::double precision AS keyword_score,
      r.sem_score AS semantic_score,
      r.sem_score AS score,
      NULL::integer AS keyword_rank,
      ROW_NUMBER() OVER (ORDER BY r.sem_score DESC, r.id ASC)::integer AS semantic_rank
    FROM ranked r
    ORDER BY r.sem_score DESC, r.id ASC;
  END IF;
END;
$$;

-- 8. Hybrid Search RPC (Reciprocal Rank Fusion, k = 60, top-50 from keyword + top-50 from semantic)
CREATE OR REPLACE FUNCTION public.search_jobs_hybrid(
  p_query TEXT,
  p_query_embedding extensions.vector(768),
  p_limit INTEGER DEFAULT 10,
  p_rrf_k INTEGER DEFAULT 60,
  p_candidate_k INTEGER DEFAULT 50,
  p_exclude_tracked BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  source_id TEXT,
  title TEXT,
  company TEXT,
  location TEXT,
  description TEXT,
  category TEXT,
  keyword_score DOUBLE PRECISION,
  semantic_score DOUBLE PRECISION,
  score DOUBLE PRECISION,
  keyword_rank INTEGER,
  semantic_rank INTEGER
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
DECLARE
  v_tsq tsquery := public.build_job_tsquery(p_query);
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 10), 1), 50);
  v_rrf_k INTEGER := GREATEST(COALESCE(p_rrf_k, 60), 1);
  v_cand_k INTEGER := LEAST(GREATEST(COALESCE(p_candidate_k, 50), 1), 200);
BEGIN
  IF p_exclude_tracked THEN
    RETURN QUERY
    WITH kw AS (
      SELECT
        jp.id,
        ts_rank_cd(jp.fts, v_tsq, 32)::double precision AS kw_score,
        ROW_NUMBER() OVER (
          ORDER BY ts_rank_cd(jp.fts, v_tsq, 32) DESC, jp.id ASC
        )::integer AS kw_rank
      FROM public.job_postings jp
      WHERE v_tsq IS NOT NULL
        AND jp.fts @@ v_tsq
        AND NOT EXISTS (
          SELECT 1
          FROM public.job_applications ja
          WHERE ja.user_id = auth.uid()
            AND (
              (
                lower(btrim(ja.company_name)) = lower(btrim(jp.company))
                AND lower(btrim(ja.role_title)) = lower(btrim(jp.title))
              )
              OR (ja.notes IS NOT NULL AND ja.notes LIKE '%' || jp.source_id || '%')
            )
        )
      ORDER BY kw_score DESC, jp.id ASC
      LIMIT v_cand_k
    ),
    sem_raw AS (
      SELECT
        jp.id,
        (1.0 - (jp.embedding <=> p_query_embedding))::double precision AS sem_score
      FROM public.job_postings jp
      WHERE p_query_embedding IS NOT NULL
        AND jp.embedding IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM public.job_applications ja
          WHERE ja.user_id = auth.uid()
            AND (
              (
                lower(btrim(ja.company_name)) = lower(btrim(jp.company))
                AND lower(btrim(ja.role_title)) = lower(btrim(jp.title))
              )
              OR (ja.notes IS NOT NULL AND ja.notes LIKE '%' || jp.source_id || '%')
            )
        )
      ORDER BY jp.embedding <=> p_query_embedding ASC
      LIMIT v_cand_k
    ),
    sem AS (
      SELECT
        sr.id,
        sr.sem_score,
        ROW_NUMBER() OVER (ORDER BY sr.sem_score DESC, sr.id ASC)::integer AS sem_rank
      FROM sem_raw sr
    ),
    fused AS (
      SELECT
        COALESCE(kw.id, sem.id) AS id,
        kw.kw_score,
        sem.sem_score,
        kw.kw_rank,
        sem.sem_rank,
        (
          COALESCE(1.0 / (v_rrf_k + kw.kw_rank), 0.0) +
          COALESCE(1.0 / (v_rrf_k + sem.sem_rank), 0.0)
        )::double precision AS rrf_score
      FROM kw
      FULL OUTER JOIN sem ON kw.id = sem.id
    )
    SELECT
      jp.id,
      jp.source_id,
      jp.title,
      jp.company,
      jp.location,
      jp.description,
      jp.category,
      f.kw_score AS keyword_score,
      f.sem_score AS semantic_score,
      f.rrf_score AS score,
      f.kw_rank AS keyword_rank,
      f.sem_rank AS semantic_rank
    FROM fused f
    INNER JOIN public.job_postings jp ON jp.id = f.id
    ORDER BY f.rrf_score DESC, f.sem_score DESC NULLS LAST, jp.id ASC
    LIMIT v_limit;
  ELSE
    RETURN QUERY
    WITH kw AS (
      SELECT
        jp.id,
        ts_rank_cd(jp.fts, v_tsq, 32)::double precision AS kw_score,
        ROW_NUMBER() OVER (
          ORDER BY ts_rank_cd(jp.fts, v_tsq, 32) DESC, jp.id ASC
        )::integer AS kw_rank
      FROM public.job_postings jp
      WHERE v_tsq IS NOT NULL
        AND jp.fts @@ v_tsq
      ORDER BY kw_score DESC, jp.id ASC
      LIMIT v_cand_k
    ),
    sem_raw AS (
      SELECT
        jp.id,
        (1.0 - (jp.embedding <=> p_query_embedding))::double precision AS sem_score
      FROM public.job_postings jp
      WHERE p_query_embedding IS NOT NULL
        AND jp.embedding IS NOT NULL
      ORDER BY jp.embedding <=> p_query_embedding ASC
      LIMIT v_cand_k
    ),
    sem AS (
      SELECT
        sr.id,
        sr.sem_score,
        ROW_NUMBER() OVER (ORDER BY sr.sem_score DESC, sr.id ASC)::integer AS sem_rank
      FROM sem_raw sr
    ),
    fused AS (
      SELECT
        COALESCE(kw.id, sem.id) AS id,
        kw.kw_score,
        sem.sem_score,
        kw.kw_rank,
        sem.sem_rank,
        (
          COALESCE(1.0 / (v_rrf_k + kw.kw_rank), 0.0) +
          COALESCE(1.0 / (v_rrf_k + sem.sem_rank), 0.0)
        )::double precision AS rrf_score
      FROM kw
      FULL OUTER JOIN sem ON kw.id = sem.id
    )
    SELECT
      jp.id,
      jp.source_id,
      jp.title,
      jp.company,
      jp.location,
      jp.description,
      jp.category,
      f.kw_score AS keyword_score,
      f.sem_score AS semantic_score,
      f.rrf_score AS score,
      f.kw_rank AS keyword_rank,
      f.sem_rank AS semantic_rank
    FROM fused f
    INNER JOIN public.job_postings jp ON jp.id = f.id
    ORDER BY f.rrf_score DESC, f.sem_score DESC NULLS LAST, jp.id ASC
    LIMIT v_limit;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.build_job_tsquery(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.build_job_tsquery(TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.search_jobs_keyword(TEXT, INTEGER, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_jobs_keyword(TEXT, INTEGER, BOOLEAN) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.search_jobs_semantic(extensions.vector, INTEGER, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_jobs_semantic(extensions.vector, INTEGER, BOOLEAN) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.search_jobs_hybrid(TEXT, extensions.vector, INTEGER, INTEGER, INTEGER, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_jobs_hybrid(TEXT, extensions.vector, INTEGER, INTEGER, INTEGER, BOOLEAN) TO authenticated, service_role;
