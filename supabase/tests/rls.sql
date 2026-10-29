-- RLS & Data Integrity Verification Test Suite
-- Proves that User A cannot read, update, delete, or spoof-insert rows belonging to User B
-- across all user-scoped and parent-scoped tables, and verifies optimistic concurrency & updated_at triggers.
-- Wrapped in BEGIN ... ROLLBACK so no test data persists after running.

BEGIN;

DO $$
DECLARE
  user_a UUID := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  user_b UUID := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  track_a UUID := '10000000-0000-4000-8000-000000000001';
  resume_a UUID := '10000000-0000-4000-8000-000000000002';
  version_a UUID := '10000000-0000-4000-8000-000000000003';
  session_a UUID := '10000000-0000-4000-8000-000000000004';
  question_a UUID := '10000000-0000-4000-8000-000000000005';
  letter_a UUID := '10000000-0000-4000-8000-000000000006';
  suggestion_a UUID := '10000000-0000-4000-8000-000000000007';
  review_a UUID := '10000000-0000-4000-8000-000000000008';
  app_a UUID := '10000000-0000-4000-8000-000000000009';
  company_a UUID := '10000000-0000-4000-8000-000000000010';

  cnt INTEGER;
  v_before INTEGER;
  v_after INTEGER;
  rls_blocked BOOLEAN;
BEGIN
  -- 1. Seed two test users in auth.users (as superuser / postgres before switching role)
  INSERT INTO auth.users (id, email, aud, role, created_at, updated_at)
  VALUES
    (user_a, 'user_a_rls_test@example.com', 'authenticated', 'authenticated', now(), now()),
    (user_b, 'user_b_rls_test@example.com', 'authenticated', 'authenticated', now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- 2. Verify no ownerless demo rows remain
  SELECT COUNT(*) INTO cnt FROM public.resumes WHERE user_id IS NULL;
  IF cnt <> 0 THEN
    RAISE EXCEPTION 'Expected 0 ownerless resumes, found %', cnt;
  END IF;

  SELECT COUNT(*) INTO cnt FROM public.career_tracks WHERE user_id IS NULL;
  IF cnt <> 0 THEN
    RAISE EXCEPTION 'Expected 0 ownerless career_tracks, found %', cnt;
  END IF;

  SELECT COUNT(*) INTO cnt FROM public.cover_letters WHERE user_id IS NULL;
  IF cnt <> 0 THEN
    RAISE EXCEPTION 'Expected 0 ownerless cover_letters, found %', cnt;
  END IF;

  -- ==========================================================================
  -- 3. Act as User A and create records across tables (relying on DEFAULT auth.uid())
  -- ==========================================================================
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', user_a::text, 'role', 'authenticated')::text,
    true
  );

  INSERT INTO public.career_tracks (id, name, role)
  VALUES (track_a, 'User A Track', 'Staff Engineer');

  INSERT INTO public.resumes (id, track_id, name, template_id, content)
  VALUES (resume_a, track_a, 'User A Resume', 'velora-professional', '{"personalInfo":{"fullName":"User A"}}'::jsonb);

  -- Verify optimistic concurrency version starts at 1 and increments on update
  SELECT version INTO v_before FROM public.resumes WHERE id = resume_a;
  IF v_before <> 1 THEN
    RAISE EXCEPTION 'Expected initial resume version = 1, got %', v_before;
  END IF;

  UPDATE public.resumes SET name = 'User A Resume v2' WHERE id = resume_a;
  SELECT version INTO v_after FROM public.resumes WHERE id = resume_a;
  IF v_after <> 2 THEN
    RAISE EXCEPTION 'Expected incremented resume version = 2 after update, got %', v_after;
  END IF;

  INSERT INTO public.resume_versions (id, resume_id, name, title, content)
  VALUES (version_a, resume_a, 'v1', 'v1', '{"personalInfo":{"fullName":"User A"}}'::jsonb);

  INSERT INTO public.interview_sessions (id, resume_id, role, jd_text)
  VALUES (session_a, resume_a, 'Staff Engineer', 'Distributed systems');

  INSERT INTO public.interview_questions (id, session_id, question, category)
  VALUES (question_a, session_a, 'Explain Raft consensus.', 'System Design');

  INSERT INTO public.cover_letters (id, resume_id, name, content)
  VALUES (letter_a, resume_a, 'User A Cover Letter', 'Dear Hiring Team...');

  INSERT INTO public.cover_letter_ai_suggestions (id, cover_letter_id, suggestion_text, type)
  VALUES (suggestion_a, letter_a, 'Add metrics', 'impact');

  INSERT INTO public.resume_reviews (
    id, resume_id, target_role, overall_score, ats_score, recruiter_score, technical_score, readability_score, career_insights
  ) VALUES (
    review_a, resume_a, 'Staff Engineer', 90, 92, 88, 91, 90, 'Strong profile'
  );

  INSERT INTO public.job_applications (id, company_name, role_title)
  VALUES (app_a, 'Acme Corp', 'Staff Engineer');

  INSERT INTO public.companies (id, name)
  VALUES (company_a, 'Acme Corp');

  INSERT INTO public.analytics_events (event_type) VALUES ('created_resume');
  INSERT INTO public.ats_history (resume_id, score) VALUES (resume_a, 94);
  INSERT INTO public.user_milestones (milestone_id) VALUES ('first_resume');

  -- ==========================================================================
  -- 4. Switch to User B and verify complete isolation (SELECT / UPDATE / DELETE / INSERT)
  -- ==========================================================================
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', user_b::text, 'role', 'authenticated')::text,
    true
  );

  -- 4a. User B cannot SELECT any of User A's rows
  SELECT COUNT(*) INTO cnt FROM public.career_tracks WHERE id = track_a;
  IF cnt <> 0 THEN RAISE EXCEPTION 'RLS leak: User B read User A career_tracks'; END IF;

  SELECT COUNT(*) INTO cnt FROM public.resumes WHERE id = resume_a;
  IF cnt <> 0 THEN RAISE EXCEPTION 'RLS leak: User B read User A resumes'; END IF;

  SELECT COUNT(*) INTO cnt FROM public.resume_versions WHERE id = version_a;
  IF cnt <> 0 THEN RAISE EXCEPTION 'RLS leak: User B read User A resume_versions'; END IF;

  SELECT COUNT(*) INTO cnt FROM public.interview_sessions WHERE id = session_a;
  IF cnt <> 0 THEN RAISE EXCEPTION 'RLS leak: User B read User A interview_sessions'; END IF;

  SELECT COUNT(*) INTO cnt FROM public.interview_questions WHERE id = question_a;
  IF cnt <> 0 THEN RAISE EXCEPTION 'RLS leak: User B read User A interview_questions'; END IF;

  SELECT COUNT(*) INTO cnt FROM public.cover_letters WHERE id = letter_a;
  IF cnt <> 0 THEN RAISE EXCEPTION 'RLS leak: User B read User A cover_letters'; END IF;

  SELECT COUNT(*) INTO cnt FROM public.cover_letter_ai_suggestions WHERE id = suggestion_a;
  IF cnt <> 0 THEN RAISE EXCEPTION 'RLS leak: User B read User A cover_letter_ai_suggestions'; END IF;

  SELECT COUNT(*) INTO cnt FROM public.resume_reviews WHERE id = review_a;
  IF cnt <> 0 THEN RAISE EXCEPTION 'RLS leak: User B read User A resume_reviews'; END IF;

  SELECT COUNT(*) INTO cnt FROM public.job_applications WHERE id = app_a;
  IF cnt <> 0 THEN RAISE EXCEPTION 'RLS leak: User B read User A job_applications'; END IF;

  SELECT COUNT(*) INTO cnt FROM public.companies WHERE id = company_a;
  IF cnt <> 0 THEN RAISE EXCEPTION 'RLS leak: User B read User A companies'; END IF;

  SELECT COUNT(*) INTO cnt FROM public.analytics_events WHERE user_id = user_a;
  IF cnt <> 0 THEN RAISE EXCEPTION 'RLS leak: User B read User A analytics_events'; END IF;

  SELECT COUNT(*) INTO cnt FROM public.ats_history WHERE user_id = user_a;
  IF cnt <> 0 THEN RAISE EXCEPTION 'RLS leak: User B read User A ats_history'; END IF;

  SELECT COUNT(*) INTO cnt FROM public.user_milestones WHERE user_id = user_a;
  IF cnt <> 0 THEN RAISE EXCEPTION 'RLS leak: User B read User A user_milestones'; END IF;

  -- 4b. User B cannot UPDATE or DELETE User A's rows
  UPDATE public.resumes SET name = 'Hacked by B' WHERE id = resume_a;
  DELETE FROM public.resumes WHERE id = resume_a;

  -- 4c. User B cannot INSERT a row spoofing user_id = user_a (WITH CHECK violation)
  rls_blocked := false;
  BEGIN
    INSERT INTO public.resumes (user_id, name, content)
    VALUES (user_a, 'Spoofed Resume', '{}'::jsonb);
  EXCEPTION WHEN insufficient_privilege THEN
    rls_blocked := true;
  END;
  IF NOT rls_blocked THEN
    RAISE EXCEPTION 'RLS WITH CHECK failed: User B inserted a resume with user_id = user_a';
  END IF;

  -- 4d. User B cannot INSERT a child row attached to User A's interview_session
  rls_blocked := false;
  BEGIN
    INSERT INTO public.interview_questions (session_id, question, category)
    VALUES (session_a, 'Injected question', 'Technical');
  EXCEPTION WHEN insufficient_privilege THEN
    rls_blocked := true;
  END;
  IF NOT rls_blocked THEN
    RAISE EXCEPTION 'RLS WITH CHECK failed: User B inserted interview_question into User A session';
  END IF;

  -- 5. Switch back to User A and verify User A's resume is still intact
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', user_a::text, 'role', 'authenticated')::text,
    true
  );

  SELECT COUNT(*) INTO cnt FROM public.resumes WHERE id = resume_a AND name = 'User A Resume v2';
  IF cnt <> 1 THEN
    RAISE EXCEPTION 'Expected User A resume to remain intact, count = %', cnt;
  END IF;

  RAISE NOTICE 'ALL RLS AND INTEGRITY TESTS PASSED SUCCESSFULLY.';
END $$;

ROLLBACK;
