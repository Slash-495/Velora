import type {
  ApplicationStatus,
  CareerTrack,
  JobApplication,
  Resume,
  ResumeContent,
} from '@/lib/mock-data';
import type { ResumeThemeConfig } from '@/lib/templates';

export type {
  ApplicationStatus,
  CareerTrack,
  JobApplication,
  Resume,
  ResumeContent,
  ResumeThemeConfig,
};

export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(id: string | undefined | null): id is string {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

export class VersionConflictError extends Error {
  public readonly code = 'VERSION_CONFLICT';
  public readonly serverResume: Resume | null;

  constructor(message: string, serverResume: Resume | null = null) {
    super(message);
    this.name = 'VersionConflictError';
    this.serverResume = serverResume;
  }
}

export interface ResumeRow {
  id: string;
  user_id: string;
  track_id: string | null;
  name: string;
  ats_score: number | null;
  template_id: string | null;
  theme_config: Record<string, any> | null;
  content: ResumeContent;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface CareerTrackRow {
  id: string;
  user_id: string;
  name: string;
  role: string;
  status: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobApplicationRow {
  id: string;
  user_id: string;
  company_name: string;
  role_title: string;
  job_description: string | null;
  resume_id: string | null;
  status: ApplicationStatus;
  location: string | null;
  salary_range: string | null;
  application_link: string | null;
  deadline: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateResumeInput {
  id?: string;
  trackId?: string | null;
  name: string;
  atsScore?: number;
  template?: string;
  themeConfig?: ResumeThemeConfig;
  content: ResumeContent;
}

export interface UpdateResumeInput {
  trackId?: string | null;
  name?: string;
  atsScore?: number;
  template?: string;
  themeConfig?: ResumeThemeConfig;
  content?: ResumeContent;
}

export interface CreateTrackInput {
  id?: string;
  name: string;
  role: string;
  status?: CareerTrack['status'];
  color?: string;
}

export interface UpdateTrackInput {
  name?: string;
  role?: string;
  status?: CareerTrack['status'];
  color?: string;
}

export interface CreateApplicationInput {
  id?: string;
  companyName: string;
  roleTitle: string;
  status?: ApplicationStatus;
  location?: string;
  salaryRange?: string;
  applicationLink?: string;
  jobUrl?: string;
  applicationDate?: string;
  deadline?: string;
  resumeId?: string | null;
  jobDescription?: string;
  notes?: string;
}

export type UpdateApplicationInput = Partial<CreateApplicationInput>;
