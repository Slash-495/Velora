-- Migration: Per-user AI route rate limiting table with RLS

CREATE TABLE IF NOT EXISTS public.ai_usage (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 1 CHECK (count >= 0),
  PRIMARY KEY (user_id, route, window_start)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_route_window
  ON public.ai_usage (user_id, route, window_start DESC);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own AI usage"
  ON public.ai_usage
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI usage"
  ON public.ai_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI usage"
  ON public.ai_usage
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
