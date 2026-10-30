import { createClient } from '@/utils/supabase/client';
import {
  CareerTrack,
  CareerTrackRow,
  CreateTrackInput,
  isValidUuid,
  UpdateTrackInput,
} from './types';

function mapRowToTrack(row: CareerTrackRow): CareerTrack {
  const status =
    row.status === 'Archived' || row.status === 'Needs Optimization'
      ? row.status
      : 'Active';

  return {
    id: row.id,
    name: row.name,
    role: row.role,
    status,
    color: row.color || 'blue',
    updatedAt: row.updated_at || row.created_at,
    isDemo: false,
  };
}

export async function listTracks(): Promise<CareerTrack[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('career_tracks')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load career tracks: ${error.message}`);
  }

  return ((data as CareerTrackRow[]) || []).map(mapRowToTrack);
}

export async function getTrack(id: string): Promise<CareerTrack | null> {
  if (!isValidUuid(id)) return null;
  const supabase = createClient();
  const { data, error } = await supabase
    .from('career_tracks')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch career track: ${error.message}`);
  }

  return data ? mapRowToTrack(data as CareerTrackRow) : null;
}

export async function createTrack(input: CreateTrackInput): Promise<CareerTrack> {
  const supabase = createClient();
  const payload: Record<string, any> = {
    name: input.name,
    role: input.role,
    status: input.status || 'Active',
    color: input.color || 'blue',
  };

  if (isValidUuid(input.id)) {
    payload.id = input.id;
  }

  const { data, error } = await supabase
    .from('career_tracks')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create career track: ${error.message}`);
  }

  return mapRowToTrack(data as CareerTrackRow);
}

export async function updateTrack(
  id: string,
  updates: UpdateTrackInput
): Promise<CareerTrack> {
  if (!isValidUuid(id)) {
    throw new Error('Invalid career track ID.');
  }

  const supabase = createClient();
  const payload: Record<string, any> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.role !== undefined) payload.role = updates.role;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.color !== undefined) payload.color = updates.color;

  const { data, error } = await supabase
    .from('career_tracks')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to update career track: ${error.message}`);
  }

  return mapRowToTrack(data as CareerTrackRow);
}

export async function deleteTrack(id: string): Promise<void> {
  if (!isValidUuid(id)) return;
  const supabase = createClient();
  const { error } = await supabase.from('career_tracks').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete career track: ${error.message}`);
  }
}
