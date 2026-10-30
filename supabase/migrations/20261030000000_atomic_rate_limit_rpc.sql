-- Migration: Atomic Rate Limit Upsert RPC & Public Shared Resume Lookup RPC

-- 1. Atomic fixed-window rate limit counter increment
-- Eliminates the read-then-write race condition under concurrent requests by
-- performing an atomic INSERT ... ON CONFLICT DO UPDATE in a single statement.
CREATE OR REPLACE FUNCTION public.increment_ai_usage(
  p_route TEXT,
  p_window_start TIMESTAMPTZ
)
RETURNS INTEGER
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  INSERT INTO public.ai_usage (user_id, route, window_start, count)
  VALUES (auth.uid(), p_route, p_window_start, 1)
  ON CONFLICT (user_id, route, window_start)
  DO UPDATE SET count = public.ai_usage.count + 1
  RETURNING count;
$$;

GRANT EXECUTE ON FUNCTION public.increment_ai_usage(TEXT, TIMESTAMPTZ) TO authenticated;

-- 2. Controlled public lookup for actively shared resumes
-- Allows `/resume/[shareId]` to fetch a resume only when an active `shared_resumes`
-- record exists for `p_share_id`, preserving strict owner-only RLS on `public.resumes`.
CREATE OR REPLACE FUNCTION public.get_shared_resume(p_share_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  ats_score INTEGER,
  template_id TEXT,
  theme_config JSONB,
  content JSONB,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.name,
    r.ats_score,
    r.template_id,
    r.theme_config,
    r.content,
    r.updated_at
  FROM public.shared_resumes sr
  INNER JOIN public.resumes r ON r.id = sr.resume_id
  WHERE sr.id = p_share_id
    AND sr.is_active = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_resume(UUID) TO anon, authenticated;
