import { createClient } from '@/utils/supabase/client';
import { defaultThemeConfig } from '@/lib/templates';
import {
  CreateResumeInput,
  isValidUuid,
  Resume,
  ResumeRow,
  UpdateResumeInput,
  VersionConflictError,
} from './types';

const SEEDED_DB_TEMPLATES = new Set([
  'velora-professional',
  'modern-minimalist',
  'dev-terminal',
]);

function mapRowToResume(row: ResumeRow): Resume {
  const rawTheme = row.theme_config || {};
  const persistedTemplate =
    (typeof rawTheme.__templateId === 'string' && rawTheme.__templateId) ||
    row.template_id ||
    'velora-professional';

  const themeConfig = {
    ...defaultThemeConfig,
    ...rawTheme,
    typography: {
      ...defaultThemeConfig.typography,
      ...(rawTheme.typography || {}),
    },
    colors: {
      ...defaultThemeConfig.colors,
      ...(rawTheme.colors || {}),
    },
    layout: {
      ...defaultThemeConfig.layout,
      ...(rawTheme.layout || {}),
    },
  };

  return {
    id: row.id,
    trackId: row.track_id || '',
    name: row.name,
    atsScore: row.ats_score ?? 0,
    template: persistedTemplate,
    themeConfig,
    updatedAt: row.updated_at || row.created_at,
    content: row.content,
    version: row.version ?? 1,
    isDemo: false,
  };
}

function normalizeTemplateForDb(
  template: string | undefined,
  themeConfig: Record<string, any> | undefined
): { dbTemplateId: string; dbThemeConfig: Record<string, any> } {
  const requestedTemplate = template || 'velora-professional';
  const dbTemplateId = SEEDED_DB_TEMPLATES.has(requestedTemplate)
    ? requestedTemplate
    : 'velora-professional';
  const dbThemeConfig = {
    ...(themeConfig || defaultThemeConfig),
    __templateId: requestedTemplate,
  };
  return { dbTemplateId, dbThemeConfig };
}

export async function listResumes(): Promise<Resume[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load resumes: ${error.message}`);
  }

  return ((data as ResumeRow[]) || []).map(mapRowToResume);
}

export async function getResume(id: string): Promise<Resume | null> {
  if (!isValidUuid(id)) return null;
  const supabase = createClient();
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch resume: ${error.message}`);
  }

  return data ? mapRowToResume(data as ResumeRow) : null;
}

export async function createResume(input: CreateResumeInput): Promise<Resume> {
  const supabase = createClient();
  const { dbTemplateId, dbThemeConfig } = normalizeTemplateForDb(
    input.template,
    input.themeConfig
  );

  const payload: Record<string, any> = {
    name: input.name || 'Untitled Resume',
    ats_score: input.atsScore ?? 85,
    template_id: dbTemplateId,
    theme_config: dbThemeConfig,
    content: input.content,
    track_id: isValidUuid(input.trackId) ? input.trackId : null,
  };

  if (isValidUuid(input.id)) {
    payload.id = input.id;
  }

  const { data, error } = await supabase
    .from('resumes')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create resume: ${error.message}`);
  }

  return mapRowToResume(data as ResumeRow);
}

/**
 * Updates a resume with optional optimistic concurrency check on `version`.
 * If `expectedVersion` is provided and does not match the database row's `version`,
 * throws `VersionConflictError` with the latest server copy instead of overwriting.
 */
export async function updateResume(
  id: string,
  updates: UpdateResumeInput,
  expectedVersion?: number
): Promise<Resume> {
  if (!isValidUuid(id)) {
    throw new Error('Invalid resume ID.');
  }

  const supabase = createClient();
  const payload: Record<string, any> = {};

  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.atsScore !== undefined) payload.ats_score = updates.atsScore;
  if (updates.content !== undefined) payload.content = updates.content;
  if (updates.trackId !== undefined) {
    payload.track_id = isValidUuid(updates.trackId) ? updates.trackId : null;
  }

  if (updates.template !== undefined || updates.themeConfig !== undefined) {
    const { dbTemplateId, dbThemeConfig } = normalizeTemplateForDb(
      updates.template,
      updates.themeConfig
    );
    if (updates.template !== undefined) payload.template_id = dbTemplateId;
    if (updates.themeConfig !== undefined || updates.template !== undefined) {
      payload.theme_config = dbThemeConfig;
    }
  }

  let query = supabase.from('resumes').update(payload).eq('id', id);

  if (typeof expectedVersion === 'number') {
    query = query.eq('version', expectedVersion);
  }

  const { data, error } = await query.select('*').maybeSingle();

  if (error) {
    throw new Error(`Failed to update resume: ${error.message}`);
  }

  if (!data) {
    // Check if the row still exists with a different version (optimistic concurrency conflict)
    const latest = await getResume(id);
    if (
      latest &&
      typeof expectedVersion === 'number' &&
      latest.version !== expectedVersion
    ) {
      throw new VersionConflictError(
        'This resume was modified in another tab or session.',
        latest
      );
    }
    throw new Error('Resume not found.');
  }

  return mapRowToResume(data as ResumeRow);
}

export async function deleteResume(id: string): Promise<void> {
  if (!isValidUuid(id)) return;
  const supabase = createClient();
  const { error } = await supabase.from('resumes').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete resume: ${error.message}`);
  }
}
