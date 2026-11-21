import { NextRequest } from 'next/server';
import {
  apiError,
  apiSuccess,
  enforceRateLimit,
  handleAIError,
  requireUser,
} from '@/lib/api-guard';
import { embedText, toPgVector } from '@/lib/embeddings';
import {
  buildQueryFromResume,
  isJobSearchEnabled,
  jobSearchRequestSchema,
  RRF_CANDIDATE_K,
  RRF_K,
  type JobSearchHit,
} from '@/lib/job-search';
import type { ResumeContent } from '@/lib/mock-data';

export async function POST(req: NextRequest) {
  if (!isJobSearchEnabled()) {
    return apiError(
      'FEATURE_DISABLED',
      'Semantic job search is currently disabled.',
      404
    );
  }

  const totalStart = performance.now();

  const { user, supabase, errorResponse } = await requireUser();
  if (errorResponse || !user) return errorResponse;

  const rateLimitResponse = await enforceRateLimit(
    supabase,
    user.id,
    'jobs-search',
    { limit: 20, windowSeconds: 60 }
  );
  if (rateLimitResponse) return rateLimitResponse;

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return apiError('BAD_REQUEST', 'Request body must be valid JSON.', 400);
  }

  const parsed = jobSearchRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return apiError(
      'BAD_REQUEST',
      firstIssue
        ? `${firstIssue.path.join('.') || 'body'}: ${firstIssue.message}`
        : 'Invalid job search request.',
      400
    );
  }

  const { query, resumeId, mode, k, excludeTracked } = parsed.data;
  let effectiveQuery = query?.trim() || '';

  if (resumeId) {
    // RLS-scoped query: authenticated client can only read rows owned by auth.uid()
    const { data: resumeRow, error: resumeError } = await supabase
      .from('resumes')
      .select('id, content')
      .eq('id', resumeId)
      .maybeSingle();

    if (resumeError) {
      return apiError(
        'RESUME_LOOKUP_FAILED',
        `Failed to load resume: ${resumeError.message}`,
        500
      );
    }

    if (!resumeRow) {
      return apiError('RESUME_NOT_FOUND', 'Resume not found.', 404);
    }

    const resumeQuery = buildQueryFromResume(
      resumeRow.content as Partial<ResumeContent>
    );
    effectiveQuery = effectiveQuery
      ? `${effectiveQuery}\n${resumeQuery}`.slice(0, 2000)
      : resumeQuery;
  }

  if (!effectiveQuery) {
    return apiError(
      'BAD_REQUEST',
      'No searchable text found in query or selected resume summary/skills.',
      400
    );
  }

  let embeddingMs = 0;
  let queryVector: string | null = null;

  if (mode === 'semantic' || mode === 'hybrid') {
    const embedStart = performance.now();
    try {
      const vector = await embedText(effectiveQuery, {
        taskType: 'RETRIEVAL_QUERY',
      });
      queryVector = toPgVector(vector);
      embeddingMs = Math.round((performance.now() - embedStart) * 100) / 100;
    } catch (err) {
      return handleAIError(err, 'generate job search embedding');
    }
  }

  const rpcStart = performance.now();
  let rpcResult: { data: JobSearchHit[] | null; error: { message: string } | null };

  if (mode === 'keyword') {
    rpcResult = await supabase.rpc('search_jobs_keyword', {
      p_query: effectiveQuery,
      p_limit: k,
      p_exclude_tracked: excludeTracked,
    });
  } else if (mode === 'semantic') {
    rpcResult = await supabase.rpc('search_jobs_semantic', {
      p_query_embedding: queryVector,
      p_limit: k,
      p_exclude_tracked: excludeTracked,
    });
  } else {
    rpcResult = await supabase.rpc('search_jobs_hybrid', {
      p_query: effectiveQuery,
      p_query_embedding: queryVector,
      p_limit: k,
      p_rrf_k: RRF_K,
      p_candidate_k: RRF_CANDIDATE_K,
      p_exclude_tracked: excludeTracked,
    });
  }

  const rpcMs = Math.round((performance.now() - rpcStart) * 100) / 100;

  if (rpcResult.error) {
    return apiError(
      'JOB_SEARCH_FAILED',
      `Search failed: ${rpcResult.error.message}`,
      500
    );
  }

  const totalMs = Math.round((performance.now() - totalStart) * 100) / 100;

  return apiSuccess({
    results: (rpcResult.data || []) as JobSearchHit[],
    mode,
    k,
    excludeTracked,
    queryUsed: effectiveQuery,
    timingMs: {
      embeddingMs,
      rpcMs,
      totalMs,
    },
  });
}
