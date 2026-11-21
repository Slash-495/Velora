import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JobApplicationRow } from '@/lib/data/types';

const mockFrom = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

import {
  createApplication,
  deleteApplication,
  getApplication,
  listApplications,
  updateApplication,
  updateApplicationStatus,
} from '@/lib/data/applications';

const APP_ID = '55555555-5555-4555-8555-555555555555';
const APP_ID_2 = '66666666-6666-4666-8666-666666666666';
const RESUME_ID = '22222222-2222-4222-8222-222222222222';
const USER_ID = '11111111-1111-4111-8111-111111111111';

function makeAppRow(overrides: Partial<JobApplicationRow> = {}): JobApplicationRow {
  return {
    id: APP_ID,
    user_id: USER_ID,
    company_name: 'Stripe',
    role_title: 'Backend Engineer',
    job_description: 'Build distributed payments APIs.',
    resume_id: RESUME_ID,
    status: 'applied',
    location: 'Remote',
    salary_range: '$180k - $210k',
    application_link: 'https://stripe.com/jobs/123',
    deadline: '2026-12-01T00:00:00.000Z',
    notes: 'Referred by staff engineer',
    created_at: '2026-10-15T10:00:00.000Z',
    updated_at: '2026-10-16T10:00:00.000Z',
    ...overrides,
  };
}

describe('lib/data/applications.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listApplications', () => {
    it('returns mapped job applications ordered by updated_at desc', async () => {
      const orderMock = vi.fn().mockResolvedValueOnce({
        data: [
          makeAppRow(),
          makeAppRow({
            id: APP_ID_2,
            location: null,
            salary_range: null,
            application_link: null,
            deadline: null,
            resume_id: null,
            job_description: null,
            notes: null,
          }),
        ],
        error: null,
      });
      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({ order: orderMock })),
      });

      const apps = await listApplications();

      expect(mockFrom).toHaveBeenCalledWith('job_applications');
      expect(orderMock).toHaveBeenCalledWith('updated_at', { ascending: false });
      expect(apps).toHaveLength(2);
      expect(apps[0]).toMatchObject({
        id: APP_ID,
        companyName: 'Stripe',
        roleTitle: 'Backend Engineer',
        status: 'applied',
        applicationLink: 'https://stripe.com/jobs/123',
        jobUrl: 'https://stripe.com/jobs/123',
        resumeId: RESUME_ID,
        isDemo: false,
      });
      expect(apps[1].location).toBeUndefined();
      expect(apps[1].resumeId).toBeUndefined();
    });

    it('throws on Supabase error', async () => {
      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          order: vi.fn().mockResolvedValueOnce({
            data: null,
            error: { message: 'network timeout' },
          }),
        })),
      });

      await expect(listApplications()).rejects.toThrow(
        'Failed to load applications: network timeout'
      );
    });
  });

  describe('getApplication', () => {
    it('returns null without querying Supabase for invalid UUIDs', async () => {
      expect(await getApplication('app-local-1')).toBeNull();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns mapped application, null on miss, and throws on error', async () => {
      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValueOnce({
              data: makeAppRow(),
              error: null,
            }),
          })),
        })),
      });

      const app = await getApplication(APP_ID);
      expect(app?.companyName).toBe('Stripe');

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
      expect(await getApplication(APP_ID)).toBeNull();

      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValueOnce({
              data: null,
              error: { message: 'boom' },
            }),
          })),
        })),
      });
      await expect(getApplication(APP_ID)).rejects.toThrow(
        'Failed to fetch application: boom'
      );
    });
  });

  describe('createApplication', () => {
    it('maps fields, normalizes dates/UUIDs, and defaults status to wishlist', async () => {
      const insertMock = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValueOnce({
            data: makeAppRow({ status: 'wishlist' }),
            error: null,
          }),
        })),
      }));
      mockFrom.mockReturnValueOnce({ insert: insertMock });

      const created = await createApplication({
        id: APP_ID,
        companyName: 'Stripe',
        roleTitle: 'Backend Engineer',
        jobUrl: 'https://stripe.com/jobs/123',
        applicationDate: '2026-10-15T10:00:00.000Z',
        resumeId: 'not-a-uuid',
      });

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: APP_ID,
          company_name: 'Stripe',
          role_title: 'Backend Engineer',
          status: 'wishlist',
          application_link: 'https://stripe.com/jobs/123',
          created_at: '2026-10-15T10:00:00.000Z',
          resume_id: null,
        })
      );
      expect(created.status).toBe('wishlist');
    });

    it('throws when insert fails', async () => {
      mockFrom.mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValueOnce({
              data: null,
              error: { message: 'insert denied' },
            }),
          })),
        })),
      });

      await expect(
        createApplication({
          companyName: 'Acme',
          roleTitle: 'SWE',
        })
      ).rejects.toThrow('Failed to create application: insert denied');
    });
  });

  describe('updateApplication', () => {
    it('throws for invalid UUIDs', async () => {
      await expect(
        updateApplication('bad-id', { companyName: 'NewCo' })
      ).rejects.toThrow('Invalid application ID.');
    });

    it('updates partial fields and throws on DB error', async () => {
      const updateMock = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValueOnce({
              data: makeAppRow({ company_name: 'Linear', status: 'interview' }),
              error: null,
            }),
          })),
        })),
      }));
      mockFrom.mockReturnValueOnce({ update: updateMock });

      const updated = await updateApplication(APP_ID, {
        companyName: 'Linear',
        roleTitle: 'Staff Engineer',
        status: 'interview',
        location: '',
        salaryRange: '$200k',
        jobUrl: 'https://linear.app/careers',
        deadline: '',
        resumeId: RESUME_ID,
        jobDescription: 'Core sync engine',
        notes: 'Great chat',
      });

      expect(updateMock).toHaveBeenCalledWith({
        company_name: 'Linear',
        role_title: 'Staff Engineer',
        status: 'interview',
        location: null,
        salary_range: '$200k',
        application_link: 'https://linear.app/careers',
        deadline: null,
        resume_id: RESUME_ID,
        job_description: 'Core sync engine',
        notes: 'Great chat',
      });
      expect(updated.companyName).toBe('Linear');

      mockFrom.mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValueOnce({
                data: null,
                error: { message: 'update failed' },
              }),
            })),
          })),
        })),
      });

      await expect(
        updateApplication(APP_ID, { notes: 'fail' })
      ).rejects.toThrow('Failed to update application: update failed');
    });
  });

  describe('updateApplicationStatus (idempotent Kanban moves)', () => {
    it('rejects invalid UUIDs', async () => {
      await expect(
        updateApplicationStatus('bad-id', 'interview')
      ).rejects.toThrow('Invalid application ID.');
    });

    it('is a no-op without calling update when row is already in target status', async () => {
      const updateSpy = vi.fn();
      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValueOnce({
              data: makeAppRow({ status: 'interview' }),
              error: null,
            }),
          })),
        })),
        update: updateSpy,
      });

      const result = await updateApplicationStatus(APP_ID, 'interview');

      expect(result.status).toBe('interview');
      expect(updateSpy).not.toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledTimes(1);
    });

    it('mutates status when row is in a different stage', async () => {
      const updateEqMock = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValueOnce({
            data: makeAppRow({ status: 'offer' }),
            error: null,
          }),
        })),
      }));
      const updateMock = vi.fn(() => ({ eq: updateEqMock }));

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValueOnce({
                data: makeAppRow({ status: 'interview' }),
                error: null,
              }),
            })),
          })),
        })
        .mockReturnValueOnce({
          update: updateMock,
        });

      const result = await updateApplicationStatus(APP_ID, 'offer');

      expect(updateMock).toHaveBeenCalledWith({ status: 'offer' });
      expect(updateEqMock).toHaveBeenCalledWith('id', APP_ID);
      expect(result.status).toBe('offer');
    });

    it('coalesces concurrent duplicate Kanban drops to the same status into one DB round-trip', async () => {
      let resolveFetch!: (val: { data: JobApplicationRow; error: null }) => void;
      const fetchPromise = new Promise<{ data: JobApplicationRow; error: null }>(
        (resolve) => {
          resolveFetch = resolve;
        }
      );

      const updateMock = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValueOnce({
              data: makeAppRow({ status: 'interview' }),
              error: null,
            }),
          })),
        })),
      }));

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => fetchPromise),
            })),
          })),
        })
        .mockReturnValueOnce({
          update: updateMock,
        });

      // Fire 3 concurrent duplicate drops on the same card to the same column
      const p1 = updateApplicationStatus(APP_ID, 'interview');
      const p2 = updateApplicationStatus(APP_ID, 'interview');
      const p3 = updateApplicationStatus(APP_ID, 'interview');

      resolveFetch({ data: makeAppRow({ status: 'applied' }), error: null });

      const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

      expect(r1.status).toBe('interview');
      expect(r2).toEqual(r1);
      expect(r3).toEqual(r1);
      // Only 1 select + 1 update across all 3 concurrent drops
      expect(mockFrom).toHaveBeenCalledTimes(2);
      expect(updateMock).toHaveBeenCalledTimes(1);
    });

    it('handles fetch errors, missing rows, and update errors cleanly and clears in-flight state', async () => {
      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValueOnce({
              data: null,
              error: { message: 'select err' },
            }),
          })),
        })),
      });
      await expect(
        updateApplicationStatus(APP_ID, 'oa')
      ).rejects.toThrow('Failed to check application status: select err');

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
      await expect(
        updateApplicationStatus(APP_ID, 'oa')
      ).rejects.toThrow('Application not found.');

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValueOnce({
                data: makeAppRow({ status: 'applied' }),
                error: null,
              }),
            })),
          })),
        })
        .mockReturnValueOnce({
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValueOnce({
                  data: null,
                  error: { message: 'write err' },
                }),
              })),
            })),
          })),
        });

      await expect(
        updateApplicationStatus(APP_ID, 'oa')
      ).rejects.toThrow('Failed to update application status: write err');
    });
  });

  describe('deleteApplication', () => {
    it('silently ignores non-UUIDs', async () => {
      await deleteApplication('demo-app');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('deletes valid UUIDs and throws on error', async () => {
      const eqMock = vi.fn().mockResolvedValueOnce({ error: null });
      mockFrom.mockReturnValueOnce({
        delete: vi.fn(() => ({ eq: eqMock })),
      });
      await deleteApplication(APP_ID);
      expect(eqMock).toHaveBeenCalledWith('id', APP_ID);

      mockFrom.mockReturnValueOnce({
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValueOnce({
            error: { message: 'delete failed' },
          }),
        })),
      });
      await expect(deleteApplication(APP_ID)).rejects.toThrow(
        'Failed to delete application: delete failed'
      );
    });
  });
});
