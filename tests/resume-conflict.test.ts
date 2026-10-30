import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockResumes } from '@/lib/mock-data';
import { defaultThemeConfig } from '@/lib/templates';
import { VersionConflictError, type ResumeRow } from '@/lib/data/types';

const mockUpdateMaybeSingle = vi.fn();
const mockSelectMaybeSingle = vi.fn();
const mockEqVersion = vi.fn(() => ({
  select: vi.fn(() => ({
    maybeSingle: mockUpdateMaybeSingle,
  })),
}));
const mockEqIdForUpdate = vi.fn(() => ({
  eq: mockEqVersion,
  select: vi.fn(() => ({
    maybeSingle: mockUpdateMaybeSingle,
  })),
}));
const mockUpdate = vi.fn(() => ({
  eq: mockEqIdForUpdate,
}));
const mockSelectForGet = vi.fn(() => ({
  eq: vi.fn(() => ({
    maybeSingle: mockSelectMaybeSingle,
  })),
}));

vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      update: mockUpdate,
      select: mockSelectForGet,
    })),
  })),
}));

import { updateResume } from '@/lib/data/resumes';

const RESUME_UUID = '22222222-2222-4222-8222-222222222222';

function makeResumeRow(version: number, name = 'Backend Engineer Resume'): ResumeRow {
  return {
    id: RESUME_UUID,
    user_id: '11111111-1111-4111-8111-111111111111',
    track_id: null,
    name,
    ats_score: 91,
    template_id: 'velora-professional',
    theme_config: defaultThemeConfig,
    content: mockResumes[0].content,
    version,
    created_at: '2026-10-30T00:00:00.000Z',
    updated_at: '2026-10-30T01:00:00.000Z',
  };
}

describe('Resume optimistic concurrency conflict handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates the resume when expectedVersion matches the current database row version', async () => {
    mockUpdateMaybeSingle.mockResolvedValueOnce({
      data: makeResumeRow(4, 'Updated Resume Name'),
      error: null,
    });

    const updated = await updateResume(
      RESUME_UUID,
      { name: 'Updated Resume Name' },
      3
    );

    expect(mockEqIdForUpdate).toHaveBeenCalledWith('id', RESUME_UUID);
    expect(mockEqVersion).toHaveBeenCalledWith('version', 3);
    expect(updated.version).toBe(4);
    expect(updated.name).toBe('Updated Resume Name');
  });

  it('throws VersionConflictError with the latest server resume when expectedVersion is stale', async () => {
    // Conditional UPDATE ... WHERE id = $1 AND version = 2 matches 0 rows
    mockUpdateMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    // Subsequent GET returns the row at version 5 modified by another tab
    mockSelectMaybeSingle.mockResolvedValueOnce({
      data: makeResumeRow(5, 'Edited in Another Tab'),
      error: null,
    });

    let caughtError: unknown;
    try {
      await updateResume(RESUME_UUID, { name: 'Stale Local Edit' }, 2);
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(VersionConflictError);
    const conflict = caughtError as VersionConflictError;
    expect(conflict.code).toBe('VERSION_CONFLICT');
    expect(conflict.serverResume).not.toBeNull();
    expect(conflict.serverResume?.version).toBe(5);
    expect(conflict.serverResume?.name).toBe('Edited in Another Tab');
  });
});
