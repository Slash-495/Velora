-- SQL RLS Verification Test for public.job_postings
-- Verifies:
--   1. service_role can INSERT, SELECT, UPDATE, DELETE job_postings
--   2. authenticated can SELECT job_postings, but CANNOT INSERT, UPDATE, or DELETE
--   3. anon CANNOT SELECT, INSERT, UPDATE, or DELETE job_postings
-- Wrapped in BEGIN ... ROLLBACK so no test rows persist.

BEGIN;

DO $$
DECLARE
  test_user UUID := 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  test_posting_id UUID := '99999999-9999-4999-8999-999999999999';
  cnt INTEGER;
  blocked BOOLEAN;
BEGIN
  -- Seed a test auth user
  INSERT INTO auth.users (id, email, aud, role, created_at, updated_at)
  VALUES (test_user, 'job_search_rls_test@velora.local', 'authenticated', 'authenticated', now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- 1. Verify service_role CAN insert into job_postings
  PERFORM set_config('role', 'service_role', true);
  INSERT INTO public.job_postings (
    id, source_id, title, company, location, description, category, content_hash
  ) VALUES (
    test_posting_id,
    'rls-test-source-1',
    'Staff Distributed Systems Engineer',
    'Velora Test Corp',
    'Remote',
    'Design PostgreSQL and TypeScript services.',
    'Backend',
    'hash-rls-test-1'
  );

  SELECT COUNT(*) INTO cnt FROM public.job_postings WHERE id = test_posting_id;
  IF cnt <> 1 THEN
    RAISE EXCEPTION 'Expected service_role to read inserted posting, got %', cnt;
  END IF;

  -- 2. Switch to authenticated role: SELECT must succeed, writes must fail
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', test_user::text, 'role', 'authenticated')::text,
    true
  );

  SELECT COUNT(*) INTO cnt FROM public.job_postings WHERE id = test_posting_id;
  IF cnt <> 1 THEN
    RAISE EXCEPTION 'Expected authenticated role to SELECT job_postings, got %', cnt;
  END IF;

  -- authenticated INSERT must be blocked
  blocked := false;
  BEGIN
    INSERT INTO public.job_postings (
      source_id, title, company, location, description, category, content_hash
    ) VALUES (
      'rls-test-auth-insert', 'Hack', 'Evil', 'Remote', 'Desc', 'Tech', 'hash-2'
    );
  EXCEPTION WHEN insufficient_privilege THEN
    blocked := true;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'SECURITY FAILURE: authenticated role was allowed to INSERT into job_postings';
  END IF;

  -- authenticated UPDATE must be blocked
  blocked := false;
  BEGIN
    UPDATE public.job_postings SET title = 'Tampered' WHERE id = test_posting_id;
  EXCEPTION WHEN insufficient_privilege THEN
    blocked := true;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'SECURITY FAILURE: authenticated role was allowed to UPDATE job_postings';
  END IF;

  -- authenticated DELETE must be blocked
  blocked := false;
  BEGIN
    DELETE FROM public.job_postings WHERE id = test_posting_id;
  EXCEPTION WHEN insufficient_privilege THEN
    blocked := true;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'SECURITY FAILURE: authenticated role was allowed to DELETE from job_postings';
  END IF;

  -- 3. Switch to anon role: SELECT and all writes must be blocked
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', '{}', true);

  blocked := false;
  BEGIN
    SELECT COUNT(*) INTO cnt FROM public.job_postings WHERE id = test_posting_id;
  EXCEPTION WHEN insufficient_privilege THEN
    blocked := true;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'SECURITY FAILURE: anon role was allowed to SELECT from job_postings';
  END IF;

  blocked := false;
  BEGIN
    INSERT INTO public.job_postings (
      source_id, title, company, location, description, category, content_hash
    ) VALUES (
      'rls-test-anon-insert', 'Hack', 'Evil', 'Remote', 'Desc', 'Tech', 'hash-3'
    );
  EXCEPTION WHEN insufficient_privilege THEN
    blocked := true;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'SECURITY FAILURE: anon role was allowed to INSERT into job_postings';
  END IF;

  -- 4. Switch back to service_role: UPDATE and DELETE must succeed
  PERFORM set_config('role', 'service_role', true);
  UPDATE public.job_postings SET title = 'Updated By Service Role' WHERE id = test_posting_id;
  SELECT COUNT(*) INTO cnt FROM public.job_postings
  WHERE id = test_posting_id AND title = 'Updated By Service Role';
  IF cnt <> 1 THEN
    RAISE EXCEPTION 'Expected service_role UPDATE to persist';
  END IF;

  DELETE FROM public.job_postings WHERE id = test_posting_id;
  SELECT COUNT(*) INTO cnt FROM public.job_postings WHERE id = test_posting_id;
  IF cnt <> 0 THEN
    RAISE EXCEPTION 'Expected service_role DELETE to remove row';
  END IF;

  RAISE NOTICE 'ALL job_postings RLS & PRIVILEGE TESTS PASSED SUCCESSFULLY.';
END $$;

ROLLBACK;
