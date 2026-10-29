-- Migration: Pre-compatibility shim for 20260528000001_version_sharing_tables.sql
-- Resolves the duplicate `CREATE TABLE resume_versions` (originally created in 20240523000000_ai_resume_tables.sql)
-- without modifying already-committed migration files.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'resume_versions'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'resume_versions_legacy'
  ) THEN
    DROP POLICY IF EXISTS "Users can manage their own resume versions" ON public.resume_versions;
    ALTER TABLE public.resume_versions RENAME TO resume_versions_legacy;
    ALTER INDEX IF EXISTS public.resume_versions_pkey RENAME TO resume_versions_legacy_pkey;
    ALTER INDEX IF EXISTS public.idx_resume_versions_user_id RENAME TO idx_resume_versions_legacy_user_id;
    ALTER INDEX IF EXISTS public.idx_resume_versions_parent_id RENAME TO idx_resume_versions_legacy_parent_id;
  END IF;
END $$;
