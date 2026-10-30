import { createClient } from '@/utils/supabase/client';
import {
  ApplicationStatus,
  CreateApplicationInput,
  isValidUuid,
  JobApplication,
  JobApplicationRow,
  UpdateApplicationInput,
} from './types';

function mapRowToApplication(row: JobApplicationRow): JobApplication {
  return {
    id: row.id,
    companyName: row.company_name,
    roleTitle: row.role_title,
    status: row.status,
    location: row.location ?? undefined,
    salaryRange: row.salary_range ?? undefined,
    applicationLink: row.application_link ?? undefined,
    jobUrl: row.application_link ?? undefined,
    applicationDate: row.created_at,
    deadline: row.deadline ?? undefined,
    resumeId: row.resume_id ?? undefined,
    jobDescription: row.job_description ?? undefined,
    notes: row.notes ?? undefined,
    isDemo: false,
  };
}

export async function listApplications(): Promise<JobApplication[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('job_applications')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load applications: ${error.message}`);
  }

  return ((data as JobApplicationRow[]) || []).map(mapRowToApplication);
}

export async function getApplication(id: string): Promise<JobApplication | null> {
  if (!isValidUuid(id)) return null;
  const supabase = createClient();
  const { data, error } = await supabase
    .from('job_applications')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch application: ${error.message}`);
  }

  return data ? mapRowToApplication(data as JobApplicationRow) : null;
}

export async function createApplication(
  input: CreateApplicationInput
): Promise<JobApplication> {
  const supabase = createClient();
  const payload: Record<string, any> = {
    company_name: input.companyName,
    role_title: input.roleTitle,
    status: input.status || 'wishlist',
    location: input.location || null,
    salary_range: input.salaryRange || null,
    application_link: input.applicationLink || input.jobUrl || null,
    deadline: input.deadline || null,
    resume_id: isValidUuid(input.resumeId) ? input.resumeId : null,
    job_description: input.jobDescription || null,
    notes: input.notes || null,
  };

  if (input.applicationDate) {
    const parsedDate = new Date(input.applicationDate);
    if (!isNaN(parsedDate.getTime())) {
      payload.created_at = parsedDate.toISOString();
    }
  }

  if (isValidUuid(input.id)) {
    payload.id = input.id;
  }

  const { data, error } = await supabase
    .from('job_applications')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create application: ${error.message}`);
  }

  return mapRowToApplication(data as JobApplicationRow);
}

export async function updateApplication(
  id: string,
  updates: UpdateApplicationInput
): Promise<JobApplication> {
  if (!isValidUuid(id)) {
    throw new Error('Invalid application ID.');
  }

  const supabase = createClient();
  const payload: Record<string, any> = {};

  if (updates.companyName !== undefined) payload.company_name = updates.companyName;
  if (updates.roleTitle !== undefined) payload.role_title = updates.roleTitle;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.location !== undefined) payload.location = updates.location || null;
  if (updates.salaryRange !== undefined) payload.salary_range = updates.salaryRange || null;
  if (updates.applicationLink !== undefined || updates.jobUrl !== undefined) {
    payload.application_link = updates.applicationLink ?? updates.jobUrl ?? null;
  }
  if (updates.deadline !== undefined) payload.deadline = updates.deadline || null;
  if (updates.resumeId !== undefined) {
    payload.resume_id = isValidUuid(updates.resumeId) ? updates.resumeId : null;
  }
  if (updates.jobDescription !== undefined) {
    payload.job_description = updates.jobDescription || null;
  }
  if (updates.notes !== undefined) payload.notes = updates.notes || null;

  const { data, error } = await supabase
    .from('job_applications')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to update application: ${error.message}`);
  }

  return mapRowToApplication(data as JobApplicationRow);
}

// Track in-flight status transitions per application ID so duplicate drops are coalesced idempotently
const inFlightStatusUpdates = new Map<
  string,
  { status: ApplicationStatus; promise: Promise<JobApplication> }
>();

/**
 * Idempotent Kanban status update:
 * - Coalesces concurrent requests setting the same status on the same card
 * - Avoids redundant mutations and timeline events when the row is already at `status`
 */
export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus
): Promise<JobApplication> {
  if (!isValidUuid(id)) {
    throw new Error('Invalid application ID.');
  }

  const existingInFlight = inFlightStatusUpdates.get(id);
  if (existingInFlight && existingInFlight.status === status) {
    return existingInFlight.promise;
  }

  const promise = (async () => {
    const supabase = createClient();

    const { data: current, error: fetchError } = await supabase
      .from('job_applications')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      throw new Error(`Failed to check application status: ${fetchError.message}`);
    }
    if (!current) {
      throw new Error('Application not found.');
    }

    const currentRow = current as JobApplicationRow;
    if (currentRow.status === status) {
      return mapRowToApplication(currentRow);
    }

    const { data: updated, error: updateError } = await supabase
      .from('job_applications')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      throw new Error(`Failed to update application status: ${updateError.message}`);
    }

    return mapRowToApplication(updated as JobApplicationRow);
  })();

  inFlightStatusUpdates.set(id, { status, promise });

  try {
    return await promise;
  } finally {
    const latest = inFlightStatusUpdates.get(id);
    if (latest?.promise === promise) {
      inFlightStatusUpdates.delete(id);
    }
  }
}

export async function deleteApplication(id: string): Promise<void> {
  if (!isValidUuid(id)) return;
  const supabase = createClient();
  const { error } = await supabase.from('job_applications').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete application: ${error.message}`);
  }
}
