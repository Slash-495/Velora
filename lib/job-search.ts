import { z } from 'zod';
import type { ResumeContent } from './mock-data';

export const MAX_JOB_SEARCH_QUERY_CHARS = 2000;
export const MAX_JOB_SEARCH_K = 20;
export const DEFAULT_JOB_SEARCH_K = 10;
export const RRF_K = 60;
export const RRF_CANDIDATE_K = 50;

export const jobSearchRequestSchema = z
  .object({
    query: z
      .string()
      .trim()
      .max(
        MAX_JOB_SEARCH_QUERY_CHARS,
        `query must be at most ${MAX_JOB_SEARCH_QUERY_CHARS} characters`
      )
      .optional(),
    resumeId: z.string().uuid('resumeId must be a valid UUID').optional(),
    mode: z.enum(['keyword', 'semantic', 'hybrid']).default('hybrid'),
    k: z
      .number()
      .int('k must be an integer')
      .min(1, 'k must be at least 1')
      .max(MAX_JOB_SEARCH_K, `k must be at most ${MAX_JOB_SEARCH_K}`)
      .default(DEFAULT_JOB_SEARCH_K),
    excludeTracked: z.boolean().default(false),
  })
  .refine(
    (data) => Boolean((data.query && data.query.length > 0) || data.resumeId),
    {
      message: 'Either a non-empty query or resumeId is required.',
      path: ['query'],
    }
  );

export type JobSearchRequest = z.infer<typeof jobSearchRequestSchema>;
export type JobSearchMode = JobSearchRequest['mode'];

export interface JobSearchHit {
  id: string;
  source_id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  category: string;
  keyword_score: number | null;
  semantic_score: number | null;
  score: number;
  keyword_rank: number | null;
  semantic_rank: number | null;
}

export function isJobSearchEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_JOB_SEARCH === 'true';
}

/**
 * Builds a search query string from a resume's summary and skills sections,
 * capped to MAX_JOB_SEARCH_QUERY_CHARS.
 */
export function buildQueryFromResume(content: Partial<ResumeContent> | null | undefined): string {
  if (!content) return '';

  const parts: string[] = [];

  const summary = content.personalInfo?.summary?.trim();
  if (summary) {
    parts.push(summary);
  }

  if (Array.isArray(content.skills) && content.skills.length > 0) {
    const skillLines = content.skills
      .map((s) => {
        const cat = s?.category?.trim();
        const items = s?.items?.trim();
        if (!items) return '';
        return cat ? `${cat}: ${items}` : items;
      })
      .filter(Boolean);

    if (skillLines.length > 0) {
      parts.push(`Skills: ${skillLines.join('; ')}`);
    }
  }

  return parts.join('\n').trim().slice(0, MAX_JOB_SEARCH_QUERY_CHARS);
}

export interface RankedCandidate {
  id: string;
  score: number;
}

export interface RrfFusedResult {
  id: string;
  rrfScore: number;
  keywordRank: number | null;
  semanticRank: number | null;
  keywordScore: number | null;
  semanticScore: number | null;
}

/**
 * Pure Reciprocal Rank Fusion (RRF) matching the SQL `search_jobs_hybrid` RPC:
 *   score(d) = 1 / (k + rank_keyword(d)) + 1 / (k + rank_semantic(d))
 * using 1-based ranks from the top `candidateLimit` (default 50) of each list.
 */
export function computeRrfFusion(
  keywordCandidates: RankedCandidate[],
  semanticCandidates: RankedCandidate[],
  options: {
    k?: number;
    candidateLimit?: number;
    limit?: number;
  } = {}
): RrfFusedResult[] {
  const k = options.k ?? RRF_K;
  const candidateLimit = options.candidateLimit ?? RRF_CANDIDATE_K;
  const limit = options.limit ?? DEFAULT_JOB_SEARCH_K;

  const map = new Map<string, RrfFusedResult>();

  const topKw = keywordCandidates.slice(0, candidateLimit);
  for (let i = 0; i < topKw.length; i++) {
    const item = topKw[i];
    const rank = i + 1;
    const contrib = 1 / (k + rank);
    map.set(item.id, {
      id: item.id,
      rrfScore: contrib,
      keywordRank: rank,
      semanticRank: null,
      keywordScore: item.score,
      semanticScore: null,
    });
  }

  const topSem = semanticCandidates.slice(0, candidateLimit);
  for (let i = 0; i < topSem.length; i++) {
    const item = topSem[i];
    const rank = i + 1;
    const contrib = 1 / (k + rank);
    const existing = map.get(item.id);
    if (existing) {
      existing.rrfScore += contrib;
      existing.semanticRank = rank;
      existing.semanticScore = item.score;
    } else {
      map.set(item.id, {
        id: item.id,
        rrfScore: contrib,
        keywordRank: null,
        semanticRank: rank,
        keywordScore: null,
        semanticScore: item.score,
      });
    }
  }

  return Array.from(map.values())
    .sort((a, b) => {
      if (b.rrfScore !== a.rrfScore) return b.rrfScore - a.rrfScore;
      const semA = a.semanticScore ?? Number.NEGATIVE_INFINITY;
      const semB = b.semanticScore ?? Number.NEGATIVE_INFINITY;
      if (semB !== semA) return semB - semA;
      return a.id.localeCompare(b.id);
    })
    .slice(0, limit);
}

export interface TrackedJobKey {
  companyName: string;
  roleTitle: string;
  notes?: string | null;
}

/**
 * Pure helper mirroring the SQL `exclude_tracked` predicate.
 */
export function filterOutTrackedPostings<
  T extends { source_id: string; company: string; title: string },
>(postings: T[], tracked: TrackedJobKey[]): T[] {
  if (tracked.length === 0) return postings;

  const pairKeys = new Set(
    tracked.map(
      (t) =>
        `${t.companyName.trim().toLowerCase()}::${t.roleTitle.trim().toLowerCase()}`
    )
  );
  const trackedNotes = tracked
    .map((t) => t.notes || '')
    .filter((n) => n.length > 0);

  return postings.filter((p) => {
    const pairKey = `${p.company.trim().toLowerCase()}::${p.title.trim().toLowerCase()}`;
    if (pairKeys.has(pairKey)) return false;
    if (trackedNotes.some((n) => n.includes(p.source_id))) return false;
    return true;
  });
}
