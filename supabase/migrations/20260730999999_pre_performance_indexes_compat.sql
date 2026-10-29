-- Migration: Pre-compatibility shim for 20260731000000_performance_indexes.sql
-- Ensures `analytics_page_views` table and `cover_letter_ai_suggestions.letter_id` column exist
-- before 20260731000000_performance_indexes.sql builds indexes on them.

CREATE TABLE IF NOT EXISTS public.analytics_page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  page_path TEXT NOT NULL DEFAULT '/',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.analytics_page_views ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.cover_letter_ai_suggestions
  ADD COLUMN IF NOT EXISTS letter_id UUID REFERENCES public.cover_letters(id) ON DELETE CASCADE;
