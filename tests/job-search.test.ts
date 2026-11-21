import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
const mockRpc = vi.fn();
const mockFrom = vi.fn();
const mockEmbedText = vi.fn();

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    rpc: mockRpc,
    from: mockFrom,
  })),
}));

vi.mock('@/lib/embeddings', () => ({
  embedText: (...args: any[]) => mockEmbedText(...args),
  toPgVector: (vals: number[]) => `[${vals.join(',')}]`,
}));

import { POST } from '@/app/api/jobs/search/route';
import {
  buildQueryFromResume,
  computeRrfFusion,
  filterOutTrackedPostings,
  jobSearchRequestSchema,
} from '@/lib/job-search';

const USER_UUID = '11111111-1111-4111-8111-111111111111';
const RESUME_UUID = '22222222-2222-4222-8222-222222222222';

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://127.0.0.1:3000/api/jobs/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Semantic job search: RRF math, validation, rate limit, excludeTracked', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_ENABLE_JOB_SEARCH = 'true';
  });

  describe('computeRrfFusion (RRF math, k=60, top-50)', () => {
    it('computes exact reciprocal rank fusion scores and boosts docs present in both lists', () => {
      const kw = [
        { id: 'doc-a', score: 0.9 },
        { id: 'doc-b', score: 0.7 },
        { id: 'doc-c', score: 0.5 },
      ];
      const sem = [
        { id: 'doc-c', score: 0.95 },
        { id: 'doc-b', score: 0.88 },
        { id: 'doc-d', score: 0.85 },
      ];

      const fused = computeRrfFusion(kw, sem, { k: 60, candidateLimit: 50, limit: 10 });

      // doc-b: kw rank 2 (1/62) + sem rank 2 (1/62) = 2/62 = 0.032258...
      // doc-c: kw rank 3 (1/63) + sem rank 1 (1/61) = 0.032266... -> rank 1!
      expect(fused[0].id).toBe('doc-c');
      expect(fused[0].rrfScore).toBeCloseTo(1 / 63 + 1 / 61, 10);
      expect(fused[0].keywordRank).toBe(3);
      expect(fused[0].semanticRank).toBe(1);

      expect(fused[1].id).toBe('doc-b');
      expect(fused[1].rrfScore).toBeCloseTo(1 / 62 + 1 / 62, 10);

      // Single-list items rank below dual-list items
      expect(fused[2].id).toBe('doc-a');
      expect(fused[2].rrfScore).toBeCloseTo(1 / 61, 10);
      expect(fused[2].semanticRank).toBeNull();

      expect(fused[3].id).toBe('doc-d');
      expect(fused[3].rrfScore).toBeCloseTo(1 / 63, 10);
      expect(fused[3].keywordRank).toBeNull();
    });

    it('enforces the top-50 candidate cutoff per list before fusing', () => {
      const kw = Array.from({ length: 60 }, (_, i) => ({
        id: `kw-${i + 1}`,
        score: 1 / (i + 1),
      }));
      const sem = Array.from({ length: 60 }, (_, i) => ({
        id: `sem-${i + 1}`,
        score: 1 / (i + 1),
      }));

      const fused = computeRrfFusion(kw, sem, {
        k: 60,
        candidateLimit: 50,
        limit: 200,
      });

      expect(fused).toHaveLength(100);
      expect(fused.some((r) => r.id === 'kw-51')).toBe(false);
      expect(fused.some((r) => r.id === 'sem-51')).toBe(false);
      expect(fused.some((r) => r.id === 'kw-50')).toBe(true);
      expect(fused.some((r) => r.id === 'sem-50')).toBe(true);
    });
  });

  describe('jobSearchRequestSchema & buildQueryFromResume', () => {
    it('applies defaults and validates query length, k bounds, mode, and resumeId', () => {
      const ok = jobSearchRequestSchema.safeParse({ query: '  TypeScript Postgres  ' });
      expect(ok.success).toBe(true);
      if (ok.success) {
        expect(ok.data).toEqual({
          query: 'TypeScript Postgres',
          mode: 'hybrid',
          k: 10,
          excludeTracked: false,
        });
      }

      // Missing both query and resumeId
      expect(jobSearchRequestSchema.safeParse({}).success).toBe(false);
      expect(jobSearchRequestSchema.safeParse({ query: '   ' }).success).toBe(false);

      // Query exceeds 2000 chars
      expect(
        jobSearchRequestSchema.safeParse({ query: 'a'.repeat(2001) }).success
      ).toBe(false);

      // k > 20 or k < 1 or float
      expect(jobSearchRequestSchema.safeParse({ query: 'go', k: 21 }).success).toBe(false);
      expect(jobSearchRequestSchema.safeParse({ query: 'go', k: 0 }).success).toBe(false);
      expect(jobSearchRequestSchema.safeParse({ query: 'go', k: 5.5 }).success).toBe(false);

      // Invalid mode & invalid resumeId
      expect(
        jobSearchRequestSchema.safeParse({ query: 'go', mode: 'bm25' }).success
      ).toBe(false);
      expect(
        jobSearchRequestSchema.safeParse({ resumeId: 'not-a-uuid' }).success
      ).toBe(false);

      // Valid resumeId-only request
      expect(
        jobSearchRequestSchema.safeParse({ resumeId: RESUME_UUID, k: 20 }).success
      ).toBe(true);
    });

    it('builds a query string from resume summary and skills capped at 2000 chars', () => {
      const q = buildQueryFromResume({
        personalInfo: {
          fullName: 'Ada',
          email: '',
          phone: '',
          location: '',
          website: '',
          linkedin: '',
          github: '',
          summary: 'Distributed systems engineer specializing in PostgreSQL and Go.',
        },
        skills: [
          { id: '1', category: 'Backend', items: 'Go, PostgreSQL, gRPC' },
          { id: '2', category: 'Infra', items: 'Kubernetes, Terraform' },
        ],
      });

      expect(q).toContain('Distributed systems engineer');
      expect(q).toContain('Backend: Go, PostgreSQL, gRPC');
      expect(q).toContain('Infra: Kubernetes, Terraform');
      expect(q.length).toBeLessThanOrEqual(2000);
    });
  });

  describe('filterOutTrackedPostings (excludeTracked logic)', () => {
    it('filters out postings matching tracked applications by company+title or source_id in notes', () => {
      const postings = [
        { id: '1', source_id: 'src-1', company: 'Stripe', title: 'Backend Engineer' },
        { id: '2', source_id: 'src-2', company: 'Linear', title: 'Frontend Engineer' },
        { id: '3', source_id: 'src-3', company: 'Figma', title: 'Systems Engineer' },
      ];

      const filtered = filterOutTrackedPostings(postings, [
        { companyName: '  stripe ', roleTitle: 'backend engineer' },
        { companyName: 'Other', roleTitle: 'Other', notes: 'Imported [source_id:src-3]' },
      ]);

      expect(filtered.map((p) => p.id)).toEqual(['2']);
    });
  });

  describe('POST /api/jobs/search route handler', () => {
    it('returns 404 when NEXT_PUBLIC_ENABLE_JOB_SEARCH is not enabled', async () => {
      process.env.NEXT_PUBLIC_ENABLE_JOB_SEARCH = 'false';

      const res = await POST(makeRequest({ query: 'Python' }));
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error.code).toBe('FEATURE_DISABLED');
      expect(mockGetUser).not.toHaveBeenCalled();
    });

    it('returns 401 when unauthenticated', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Auth session missing' },
      });

      const res = await POST(makeRequest({ query: 'Python' }));
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 429 RATE_LIMITED with Retry-After when enforceRateLimit exceeds limit', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: USER_UUID } },
        error: null,
      });
      mockRpc.mockResolvedValueOnce({
        data: 21, // over limit=20
        error: null,
      });

      const res = await POST(makeRequest({ query: 'Python' }));
      expect(res.status).toBe(429);
      expect(Number(res.headers.get('Retry-After'))).toBeGreaterThanOrEqual(1);
      const body = await res.json();
      expect(body.error.code).toBe('RATE_LIMITED');
      expect(mockRpc).toHaveBeenCalledWith(
        'increment_ai_usage',
        expect.objectContaining({ p_route: 'jobs-search' })
      );
    });

    it('returns 400 BAD_REQUEST for invalid request bodies', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: USER_UUID } },
        error: null,
      });
      mockRpc.mockResolvedValueOnce({ data: 1, error: null });

      const res = await POST(makeRequest({ query: 'x'.repeat(2005), k: 50 }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe('BAD_REQUEST');
    });

    it('builds query from RLS-scoped resume and forwards excludeTracked=true to hybrid RPC', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: USER_UUID } },
        error: null,
      });
      // 1st RPC: increment_ai_usage (under limit)
      // 2nd RPC: search_jobs_hybrid
      mockRpc
        .mockResolvedValueOnce({ data: 2, error: null })
        .mockResolvedValueOnce({
          data: [
            {
              id: 'job-1',
              source_id: 'src-1',
              title: 'Senior Python Engineer',
              company: 'Acme',
              location: 'Remote',
              description: 'FastAPI + PostgreSQL',
              category: 'Python',
              keyword_score: 0.4,
              semantic_score: 0.87,
              score: 0.032,
              keyword_rank: 1,
              semantic_rank: 2,
            },
          ],
          error: null,
        });

      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValueOnce({
              data: {
                id: RESUME_UUID,
                content: {
                  personalInfo: { summary: 'Backend Python & FastAPI engineer' },
                  skills: [{ id: 's1', category: 'Tech', items: 'Python, FastAPI, Postgres' }],
                },
              },
              error: null,
            }),
          })),
        })),
      });

      mockEmbedText.mockResolvedValueOnce([0.1, 0.2, 0.3]);

      const res = await POST(
        makeRequest({
          resumeId: RESUME_UUID,
          mode: 'hybrid',
          k: 5,
          excludeTracked: true,
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.results).toHaveLength(1);
      expect(body.data.excludeTracked).toBe(true);
      expect(mockEmbedText).toHaveBeenCalledWith(
        expect.stringContaining('Backend Python & FastAPI engineer'),
        { taskType: 'RETRIEVAL_QUERY' }
      );
      expect(mockRpc).toHaveBeenLastCalledWith('search_jobs_hybrid', {
        p_query: expect.stringContaining('Python, FastAPI, Postgres'),
        p_query_embedding: '[0.1,0.2,0.3]',
        p_limit: 5,
        p_rrf_k: 60,
        p_candidate_k: 50,
        p_exclude_tracked: true,
      });
    });

    it('uses search_jobs_keyword without calling embedText in keyword mode', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: USER_UUID } },
        error: null,
      });
      mockRpc
        .mockResolvedValueOnce({ data: 3, error: null })
        .mockResolvedValueOnce({ data: [], error: null });

      const res = await POST(
        makeRequest({
          query: 'Kubernetes Terraform',
          mode: 'keyword',
          k: 10,
          excludeTracked: true,
        })
      );

      expect(res.status).toBe(200);
      expect(mockEmbedText).not.toHaveBeenCalled();
      expect(mockRpc).toHaveBeenLastCalledWith('search_jobs_keyword', {
        p_query: 'Kubernetes Terraform',
        p_limit: 10,
        p_exclude_tracked: true,
      });
    });
  });
});
