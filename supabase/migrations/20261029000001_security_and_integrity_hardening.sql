-- Migration: Comprehensive Security, Data Integrity, Concurrency & RLS Hardening
-- 1. Reconciles duplicate `resume_versions` schemas into a single unified table
-- 2. Removes ownerless demo/seed rows and orphaned records
-- 3. Enforces `user_id NOT NULL DEFAULT auth.uid()` and FK to `auth.users(id) ON DELETE CASCADE`
-- 4. Adds `version INTEGER NOT NULL DEFAULT 1` on `resumes` for optimistic concurrency + `updated_at` triggers
-- 5. Adds missing FK indexes across all tables
-- 6. Adds strict owner-scoped RLS policies (with explicit `USING` and `WITH CHECK`) to all tables

-- ============================================================================
-- 1. Reconcile `resume_versions` & `resume_versions_legacy`
-- ============================================================================
ALTER TABLE public.resume_versions
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS name TEXT default 'Version Snapshot',
  ADD COLUMN IF NOT EXISTS title TEXT default 'Version Snapshot',
  ADD COLUMN IF NOT EXISTS ats_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS template_id TEXT REFERENCES public.resume_templates(id),
  ADD COLUMN IF NOT EXISTS theme_config JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'resume_versions_legacy'
  ) THEN
    INSERT INTO public.resume_versions (
      id, user_id, parent_id, name, title, ats_score, content, created_at, updated_at
    )
    SELECT
      l.id,
      l.user_id,
      CASE WHEN EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = l.parent_id) THEN l.parent_id ELSE NULL END,
      l.title,
      l.title,
      COALESCE(l.ats_score, 0),
      l.content,
      l.created_at,
      l.updated_at
    FROM public.resume_versions_legacy l
    WHERE l.user_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = l.user_id)
    ON CONFLICT (id) DO NOTHING;

    DROP TABLE public.resume_versions_legacy CASCADE;
  END IF;
END $$;

-- Backfill `user_id` on `resume_versions` from parent `resumes` if missing
UPDATE public.resume_versions rv
SET user_id = r.user_id
FROM public.resumes r
WHERE rv.resume_id = r.id
  AND rv.user_id IS NULL
  AND r.user_id IS NOT NULL;

UPDATE public.resume_versions
SET
  name = COALESCE(name, title, 'Version Snapshot'),
  title = COALESCE(title, name, 'Version Snapshot')
WHERE name IS NULL OR title IS NULL;

ALTER TABLE public.resume_versions
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN title SET NOT NULL;

-- ============================================================================
-- 2. Remove Ownerless Seed/Demo Rows & Orphaned Records
-- ============================================================================
-- Delete known seeded demo rows with no user owner
DELETE FROM public.cover_letter_ai_suggestions
WHERE cover_letter_id = '33333333-3333-3333-3333-333333333333'
   OR cover_letter_id IS NULL
   OR cover_letter_id IN (SELECT id FROM public.cover_letters WHERE user_id IS NULL);

DELETE FROM public.cover_letters
WHERE id = '33333333-3333-3333-3333-333333333333'
   OR user_id IS NULL
   OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = cover_letters.user_id);

DELETE FROM public.resumes
WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
)
   OR user_id IS NULL
   OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = resumes.user_id);

DELETE FROM public.career_tracks
WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
)
   OR user_id IS NULL
   OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = career_tracks.user_id);

-- Clean up any remaining ownerless rows on user-owned tables before adding NOT NULL + FK constraints
DELETE FROM public.jd_analyses WHERE user_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = jd_analyses.user_id);
DELETE FROM public.resume_versions WHERE user_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = resume_versions.user_id);
DELETE FROM public.ai_resume_analysis WHERE user_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = ai_resume_analysis.user_id);
DELETE FROM public.job_applications WHERE user_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = job_applications.user_id);
DELETE FROM public.resume_theme_configs WHERE user_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = resume_theme_configs.user_id);
DELETE FROM public.interview_sessions WHERE user_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = interview_sessions.user_id);
DELETE FROM public.analytics_events WHERE user_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = analytics_events.user_id);
DELETE FROM public.analytics_page_views WHERE user_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = analytics_page_views.user_id);
DELETE FROM public.ats_history WHERE user_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = ats_history.user_id);
DELETE FROM public.user_milestones WHERE user_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = user_milestones.user_id);
DELETE FROM public.resume_reviews WHERE user_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = resume_reviews.user_id);
DELETE FROM public.companies WHERE user_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = companies.user_id);
DELETE FROM public.company_notes WHERE user_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = company_notes.user_id);
DELETE FROM public.company_resources WHERE user_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = company_resources.user_id);
DELETE FROM public.company_ai_insights WHERE user_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = company_ai_insights.user_id);

-- Clean up child rows with NULL parent references
DELETE FROM public.ai_suggestions WHERE analysis_id IS NULL;
DELETE FROM public.application_timeline WHERE application_id IS NULL;
DELETE FROM public.recruiter_contacts WHERE application_id IS NULL;
DELETE FROM public.interview_questions WHERE session_id IS NULL;
DELETE FROM public.shared_resumes WHERE resume_id IS NULL;

-- ============================================================================
-- 3. Enforce `user_id NOT NULL DEFAULT auth.uid()` & `REFERENCES auth.users(id)`
-- ============================================================================
DO $$
DECLARE
  tbl TEXT;
  fk_name TEXT;
  user_tables TEXT[] := ARRAY[
    'jd_analyses',
    'resume_versions',
    'ai_resume_analysis',
    'job_applications',
    'career_tracks',
    'resume_theme_configs',
    'resumes',
    'interview_sessions',
    'analytics_events',
    'analytics_page_views',
    'ats_history',
    'user_milestones',
    'cover_letters',
    'resume_reviews',
    'companies',
    'company_notes',
    'company_resources',
    'company_ai_insights',
    'ai_usage'
  ];
BEGIN
  FOREACH tbl IN ARRAY user_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN user_id SET DEFAULT auth.uid()', tbl);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN user_id SET NOT NULL', tbl);

    fk_name := tbl || '_user_id_fkey';
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.table_name = tbl
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'user_id'
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE',
        tbl, fk_name
      );
    END IF;
  END LOOP;
END $$;

-- Enforce NOT NULL on child parent-FK columns used for RLS ownership checks
ALTER TABLE public.ai_suggestions ALTER COLUMN analysis_id SET NOT NULL;
ALTER TABLE public.application_timeline ALTER COLUMN application_id SET NOT NULL;
ALTER TABLE public.recruiter_contacts ALTER COLUMN application_id SET NOT NULL;
ALTER TABLE public.interview_questions ALTER COLUMN session_id SET NOT NULL;
ALTER TABLE public.cover_letter_ai_suggestions ALTER COLUMN cover_letter_id SET NOT NULL;
ALTER TABLE public.shared_resumes ALTER COLUMN resume_id SET NOT NULL;

-- ============================================================================
-- 4. Optimistic Concurrency (`resumes.version`) & `updated_at` Triggers
-- ============================================================================
ALTER TABLE public.resumes
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_resume_version()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.version IS NULL OR NEW.version = OLD.version THEN
    NEW.version = COALESCE(OLD.version, 1) + 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_resumes_increment_version ON public.resumes;
CREATE TRIGGER trg_resumes_increment_version
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_resume_version();

DO $$
DECLARE
  tbl TEXT;
  trig_name TEXT;
  updated_at_tables TEXT[] := ARRAY[
    'resumes',
    'career_tracks',
    'resume_versions',
    'shared_resumes',
    'job_applications',
    'interview_sessions',
    'cover_letters',
    'companies',
    'company_notes',
    'company_ai_insights'
  ];
BEGIN
  FOREACH tbl IN ARRAY updated_at_tables LOOP
    trig_name := 'trg_' || tbl || '_set_updated_at';
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', trig_name, tbl);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      trig_name, tbl
    );
  END LOOP;
END $$;

-- ============================================================================
-- 5. Missing Foreign Key Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_job_applications_resume_id ON public.job_applications(resume_id);
CREATE INDEX IF NOT EXISTS idx_career_tracks_user_id ON public.career_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_theme_configs_user_id ON public.resume_theme_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_theme_configs_template_id ON public.resume_theme_configs(template_id);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_track_id ON public.resumes(track_id);
CREATE INDEX IF NOT EXISTS idx_resumes_template_id ON public.resumes(template_id);
CREATE INDEX IF NOT EXISTS idx_resume_versions_user_id ON public.resume_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_versions_resume_id ON public.resume_versions(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_versions_parent_id ON public.resume_versions(parent_id);
CREATE INDEX IF NOT EXISTS idx_resume_versions_template_id ON public.resume_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_shared_resumes_resume_id ON public.shared_resumes(resume_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON public.interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_resume_id ON public.interview_sessions(resume_id);
CREATE INDEX IF NOT EXISTS idx_interview_questions_session_id ON public.interview_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_ats_history_user_id ON public.ats_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ats_history_resume_id ON public.ats_history(resume_id);
CREATE INDEX IF NOT EXISTS idx_user_milestones_user_id ON public.user_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_cover_letter_ai_suggestions_cover_letter_id ON public.cover_letter_ai_suggestions(cover_letter_id);

-- ============================================================================
-- 6. Owner-Scoped RLS Policies (with explicit `USING` and `WITH CHECK`)
-- ============================================================================

-- Direct `user_id` tables
DO $$
DECLARE
  tbl TEXT;
  pol_name TEXT;
  direct_user_tables TEXT[] := ARRAY[
    'career_tracks',
    'resumes',
    'resume_theme_configs',
    'resume_versions',
    'interview_sessions',
    'analytics_events',
    'analytics_page_views',
    'ats_history',
    'user_milestones',
    'cover_letters',
    'resume_reviews',
    'jd_analyses',
    'ai_resume_analysis',
    'job_applications',
    'companies'
  ];
BEGIN
  FOREACH tbl IN ARRAY direct_user_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    pol_name := 'Owner full access on ' || tbl;
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol_name, tbl);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)',
      pol_name, tbl
    );
  END LOOP;
END $$;

-- Drop legacy policies without explicit WITH CHECK so only clean policies remain
DROP POLICY IF EXISTS "Users can manage their own JD analyses" ON public.jd_analyses;
DROP POLICY IF EXISTS "Users can manage their own resume versions" ON public.resume_versions;
DROP POLICY IF EXISTS "Users can manage their own AI analyses" ON public.ai_resume_analysis;
DROP POLICY IF EXISTS "Users can manage their own job applications" ON public.job_applications;
DROP POLICY IF EXISTS "Users can manage their own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can manage their own company notes" ON public.company_notes;
DROP POLICY IF EXISTS "Users can manage their own company resources" ON public.company_resources;
DROP POLICY IF EXISTS "Users can manage their own company AI insights" ON public.company_ai_insights;

-- Company child tables: enforce both `auth.uid() = user_id` AND parent `companies` ownership
DROP POLICY IF EXISTS "Owner full access on company_notes" ON public.company_notes;
CREATE POLICY "Owner full access on company_notes"
  ON public.company_notes
  FOR ALL
  USING (
    auth.uid() = user_id
    AND (
      company_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = company_notes.company_id
          AND c.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND (
      company_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = company_notes.company_id
          AND c.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Owner full access on company_resources" ON public.company_resources;
CREATE POLICY "Owner full access on company_resources"
  ON public.company_resources
  FOR ALL
  USING (
    auth.uid() = user_id
    AND (
      company_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = company_resources.company_id
          AND c.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND (
      company_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = company_resources.company_id
          AND c.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Owner full access on company_ai_insights" ON public.company_ai_insights;
CREATE POLICY "Owner full access on company_ai_insights"
  ON public.company_ai_insights
  FOR ALL
  USING (
    auth.uid() = user_id
    AND (
      company_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = company_ai_insights.company_id
          AND c.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND (
      company_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = company_ai_insights.company_id
          AND c.user_id = auth.uid()
      )
    )
  );

-- Child tables scoped via parent foreign key ownership
-- 1. interview_questions -> interview_sessions
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner full access on interview_questions" ON public.interview_questions;
CREATE POLICY "Owner full access on interview_questions"
  ON public.interview_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.interview_sessions s
      WHERE s.id = interview_questions.session_id
        AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.interview_sessions s
      WHERE s.id = interview_questions.session_id
        AND s.user_id = auth.uid()
    )
  );

-- 2. cover_letter_ai_suggestions -> cover_letters
ALTER TABLE public.cover_letter_ai_suggestions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner full access on cover_letter_ai_suggestions" ON public.cover_letter_ai_suggestions;
CREATE POLICY "Owner full access on cover_letter_ai_suggestions"
  ON public.cover_letter_ai_suggestions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cover_letters cl
      WHERE cl.id = cover_letter_ai_suggestions.cover_letter_id
        AND cl.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cover_letters cl
      WHERE cl.id = cover_letter_ai_suggestions.cover_letter_id
        AND cl.user_id = auth.uid()
    )
  );

-- 3. ai_suggestions -> ai_resume_analysis
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage suggestions via analysis owner" ON public.ai_suggestions;
DROP POLICY IF EXISTS "Owner full access on ai_suggestions" ON public.ai_suggestions;
CREATE POLICY "Owner full access on ai_suggestions"
  ON public.ai_suggestions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_resume_analysis a
      WHERE a.id = ai_suggestions.analysis_id
        AND a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_resume_analysis a
      WHERE a.id = ai_suggestions.analysis_id
        AND a.user_id = auth.uid()
    )
  );

-- 4. application_timeline -> job_applications
ALTER TABLE public.application_timeline ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage timeline via application owner" ON public.application_timeline;
DROP POLICY IF EXISTS "Owner full access on application_timeline" ON public.application_timeline;
CREATE POLICY "Owner full access on application_timeline"
  ON public.application_timeline
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.job_applications ja
      WHERE ja.id = application_timeline.application_id
        AND ja.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.job_applications ja
      WHERE ja.id = application_timeline.application_id
        AND ja.user_id = auth.uid()
    )
  );

-- 5. recruiter_contacts -> job_applications
ALTER TABLE public.recruiter_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage recruiter contacts via application owner" ON public.recruiter_contacts;
DROP POLICY IF EXISTS "Owner full access on recruiter_contacts" ON public.recruiter_contacts;
CREATE POLICY "Owner full access on recruiter_contacts"
  ON public.recruiter_contacts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.job_applications ja
      WHERE ja.id = recruiter_contacts.application_id
        AND ja.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.job_applications ja
      WHERE ja.id = recruiter_contacts.application_id
        AND ja.user_id = auth.uid()
    )
  );

-- 6. shared_resumes -> resumes (owners have full control; active shares remain publicly readable)
ALTER TABLE public.shared_resumes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner full access on shared_resumes" ON public.shared_resumes;
CREATE POLICY "Owner full access on shared_resumes"
  ON public.shared_resumes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = shared_resumes.resume_id
        AND r.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = shared_resumes.resume_id
        AND r.user_id = auth.uid()
    )
  );
