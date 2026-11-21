import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockResumes } from '@/lib/mock-data';
import { defaultThemeConfig } from '@/lib/templates';
import { VersionConflictError, type ResumeRow } from '@/lib/data/types';

const mockFrom = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

import {
  createResume,
  deleteResume,
  getResume,
  listResumes,
  updateResume,
} from '@/lib/data/resumes';

const RESUME_ID = '22222222-2222-4222-8222-222222222222';
const TRACK_ID = '33333333-3333-4333-8333-333333333333';
const USER_ID = '11111111-1111-4111-8111-111111111111';

function makeRow(overrides: Partial<ResumeRow> = {}): ResumeRow {
  return {
    id: RESUME_ID,
    user_id: USER_ID,
    track_id: TRACK_ID,
    name: 'Senior SWE Resume',
    ats_score: 92,
    template_id: 'velora-professional',
    theme_config: {
      ...defaultThemeConfig,
      __templateId: 'creative-accent',
    },
    content: mockResumes[0].content,
    version: 3,
    created_at: '2026-10-01T00:00:00.000Z',
    updated_at: '2026-10-02T00:00:00.000Z',
    ...overrides,
  };
}

describe('lib/data/resumes.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listResumes', () => {
    it('lists and maps resumes ordered by updated_at desc, preserving __templateId', async () => {
      const orderMock = vi.fn().mockResolvedValueOnce({
        data: [
          makeRow(),
          makeRow({
            id: '44444444-4444-4444-8444-444444444444',
            track_id: null,
            ats_score: null,
            template_id: null,
            theme_config: null,
            updated_at: '',
            version: undefined as unknown as number,
          }),
        ],
        error: null,
      });
      const selectMock = vi.fn(() => ({ order: orderMock }));
      mockFrom.mockReturnValueOnce({ select: selectMock });

      const resumes = await listResumes();

      expect(mockFrom).toHaveBeenCalledWith('resumes');
      expect(selectMock).toHaveBeenCalledWith('*');
      expect(orderMock).toHaveBeenCalledWith('updated_at', { ascending: false });
      expect(resumes).toHaveLength(2);
      expect(resumes[0]).toMatchObject({
        id: RESUME_ID,
        trackId: TRACK_ID,
        template: 'creative-accent',
        atsScore: 92,
        version: 3,
        isDemo: false,
      });
      expect(resumes[1]).toMatchObject({
        trackId: '',
        atsScore: 0,
        template: 'velora-professional',
        updatedAt: '2026-10-01T00:00:00.000Z',
        version: 1,
      });
    });

    it('throws when Supabase returns an error', async () => {
      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          order: vi.fn().mockResolvedValueOnce({
            data: null,
            error: { message: 'permission denied' },
          }),
        })),
      });

      await expect(listResumes()).rejects.toThrow(
        'Failed to load resumes: permission denied'
      );
    });
  });

  describe('getResume', () => {
    it('returns null without querying Supabase for an invalid UUID', async () => {
      const result = await getResume('not-a-uuid');
      expect(result).toBeNull();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('fetches and maps a single resume by UUID', async () => {
      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValueOnce({
              data: makeRow(),
              error: null,
            }),
          })),
        })),
      });

      const resume = await getResume(RESUME_ID);
      expect(resume?.id).toBe(RESUME_ID);
      expect(resume?.version).toBe(3);
    });

    it('returns null when no row matches and throws on DB error', async () => {
      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValueOnce({
              data: null,
              error: null,
            }),
          })),
        })),
      });

      expect(await getResume(RESUME_ID)).toBeNull();

      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValueOnce({
              data: null,
              error: { message: 'db down' },
            }),
          })),
        })),
      });

      await expect(getResume(RESUME_ID)).rejects.toThrow(
        'Failed to fetch resume: db down'
      );
    });
  });

  describe('createResume', () => {
    it('normalizes unseeded templates and validates optional UUIDs', async () => {
      const singleMock = vi.fn().mockResolvedValueOnce({
        data: makeRow({ version: 1 }),
        error: null,
      });
      const selectMock = vi.fn(() => ({ single: singleMock }));
      const insertMock = vi.fn(() => ({ select: selectMock }));
      mockFrom.mockReturnValueOnce({ insert: insertMock });

      const created = await createResume({
        id: RESUME_ID,
        name: '',
        template: 'creative-accent',
        trackId: 'invalid-track-id',
        content: mockResumes[0].content,
      });

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: RESUME_ID,
          name: 'Untitled Resume',
          ats_score: 85,
          template_id: 'velora-professional',
          track_id: null,
          theme_config: expect.objectContaining({
            __templateId: 'creative-accent',
          }),
        })
      );
      expect(created.version).toBe(1);
    });

    it('throws when insert fails', async () => {
      mockFrom.mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValueOnce({
              data: null,
              error: { message: 'violates RLS' },
            }),
          })),
        })),
      });

      await expect(
        createResume({
          name: 'Test',
          content: mockResumes[0].content,
        })
      ).rejects.toThrow('Failed to create resume: violates RLS');
    });
  });

  describe('updateResume (optimistic concurrency & error paths)', () => {
    it('rejects non-UUID resume IDs', async () => {
      await expect(
        updateResume('bad-id', { name: 'Nope' }, 1)
      ).rejects.toThrow('Invalid resume ID.');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('applies conditional version predicate when expectedVersion is supplied and maps full updates', async () => {
      const maybeSingleMock = vi.fn().mockResolvedValueOnce({
        data: makeRow({ version: 4, name: 'v4' }),
        error: null,
      });
      const eqVersionMock = vi.fn(() => ({
        select: vi.fn(() => ({ maybeSingle: maybeSingleMock })),
      }));
      const eqIdMock = vi.fn(() => ({ eq: eqVersionMock }));
      const updateMock = vi.fn(() => ({ eq: eqIdMock }));
      mockFrom.mockReturnValueOnce({ update: updateMock });

      const updated = await updateResume(
        RESUME_ID,
        {
          name: 'v4',
          atsScore: 95,
          content: mockResumes[0].content,
          trackId: TRACK_ID,
          template: 'dev-terminal',
          themeConfig: defaultThemeConfig,
        },
        3
      );

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'v4',
          ats_score: 95,
          track_id: TRACK_ID,
          template_id: 'dev-terminal',
          theme_config: expect.objectContaining({
            __templateId: 'dev-terminal',
          }),
        })
      );
      expect(eqIdMock).toHaveBeenCalledWith('id', RESUME_ID);
      expect(eqVersionMock).toHaveBeenCalledWith('version', 3);
      expect(updated.version).toBe(4);
    });

    it('omits version filter when expectedVersion is omitted', async () => {
      const maybeSingleMock = vi.fn().mockResolvedValueOnce({
        data: makeRow({ version: 4 }),
        error: null,
      });
      const selectMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
      const eqIdMock = vi.fn(() => ({ select: selectMock }));
      const updateMock = vi.fn(() => ({ eq: eqIdMock }));
      mockFrom.mockReturnValueOnce({ update: updateMock });

      const updated = await updateResume(RESUME_ID, {
        trackId: 'not-a-uuid',
      });

      expect(updateMock).toHaveBeenCalledWith({ track_id: null });
      expect(updated.version).toBe(4);
    });

    it('throws VersionConflictError with latest server row when conditional update returns 0 rows', async () => {
      mockFrom
        .mockReturnValueOnce({
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValueOnce({
                    data: null,
                    error: null,
                  }),
                })),
              })),
            })),
          })),
        })
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValueOnce({
                data: makeRow({ version: 7, name: 'Newer Server Copy' }),
                error: null,
              }),
            })),
          })),
        });

      try {
        await updateResume(RESUME_ID, { name: 'Stale Write' }, 3);
        expect.fail('Expected VersionConflictError');
      } catch (err) {
        expect(err).toBeInstanceOf(VersionConflictError);
        const conflict = err as VersionConflictError;
        expect(conflict.code).toBe('VERSION_CONFLICT');
        expect(conflict.serverResume?.version).toBe(7);
        expect(conflict.serverResume?.name).toBe('Newer Server Copy');
      }
    });

    it('throws Resume not found when row was deleted before update', async () => {
      mockFrom
        .mockReturnValueOnce({
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValueOnce({
                    data: null,
                    error: null,
                  }),
                })),
              })),
            })),
          })),
        })
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValueOnce({
                data: null,
                error: null,
              }),
            })),
          })),
        });

      await expect(
        updateResume(RESUME_ID, { name: 'Deleted' }, 3)
      ).rejects.toThrow('Resume not found.');
    });

    it('throws when Supabase update returns an error', async () => {
      mockFrom.mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValueOnce({
                data: null,
                error: { message: 'constraint error' },
              }),
            })),
          })),
        })),
      });

      await expect(updateResume(RESUME_ID, { name: 'Err' })).rejects.toThrow(
        'Failed to update resume: constraint error'
      );
    });
  });

  describe('deleteResume', () => {
    it('silently ignores non-UUID IDs', async () => {
      await deleteResume('demo-1');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('deletes valid UUIDs and throws on error', async () => {
      const eqMock = vi.fn().mockResolvedValueOnce({ error: null });
      mockFrom.mockReturnValueOnce({
        delete: vi.fn(() => ({ eq: eqMock })),
      });

      await deleteResume(RESUME_ID);
      expect(eqMock).toHaveBeenCalledWith('id', RESUME_ID);

      mockFrom.mockReturnValueOnce({
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValueOnce({
            error: { message: 'delete blocked' },
          }),
        })),
      });

      await expect(deleteResume(RESUME_ID)).rejects.toThrow(
        'Failed to delete resume: delete blocked'
      );
    });
  });
});
