import {
  mockApplications,
  mockResumes,
  mockTracks,
  CareerTrack,
  JobApplication,
  Resume,
} from '@/lib/mock-data';
import { createResume } from './resumes';
import { createTrack } from './tracks';
import { createApplication } from './applications';

/**
 * Explicit logged-out Demo Mode localStorage adapter & one-time post-login migration helper.
 */
export const DEMO_STORAGE_KEYS = {
  RESUMES: 'velora_demo_resumes_v3',
  TRACKS: 'velora_demo_tracks_v3',
  APPLICATIONS: 'velora_demo_apps_v3',
  LEGACY_RESUMES: 'velora_user_resumes_v2',
  LEGACY_TRACKS: 'velora_user_tracks_v2',
  LEGACY_APPLICATIONS: 'velora_user_apps_v2',
} as const;

const initialDemoResumes: Resume[] = mockResumes.map((r) => ({
  ...r,
  version: 1,
  isDemo: true,
}));

const initialDemoTracks: CareerTrack[] = mockTracks.map((t) => ({
  ...t,
  isDemo: true,
}));

const initialDemoApplications: JobApplication[] = mockApplications.map((a) => ({
  ...a,
  isDemo: true,
}));

function readStorage<T>(key: string, fallback: T[]): T[] {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T[];
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, items: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (e) {
    console.error(`[DemoStorage] Failed to write ${key}:`, e);
  }
}

export function getDemoResumes(): Resume[] {
  return readStorage<Resume>(DEMO_STORAGE_KEYS.RESUMES, initialDemoResumes);
}

export function setDemoResumes(resumes: Resume[]): void {
  writeStorage(DEMO_STORAGE_KEYS.RESUMES, resumes);
}

export function getDemoTracks(): CareerTrack[] {
  return readStorage<CareerTrack>(DEMO_STORAGE_KEYS.TRACKS, initialDemoTracks);
}

export function setDemoTracks(tracks: CareerTrack[]): void {
  writeStorage(DEMO_STORAGE_KEYS.TRACKS, tracks);
}

export function getDemoApplications(): JobApplication[] {
  return readStorage<JobApplication>(
    DEMO_STORAGE_KEYS.APPLICATIONS,
    initialDemoApplications
  );
}

export function setDemoApplications(apps: JobApplication[]): void {
  writeStorage(DEMO_STORAGE_KEYS.APPLICATIONS, apps);
}

function readRawJsonArray<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * One-time migration of existing localStorage user data into Supabase after sign-in.
 * Imports any non-demo items (`isDemo !== true`) from both legacy v2 keys and demo v3 keys,
 * preserving track -> resume -> application foreign key links.
 */
export async function migrateLocalStorageToSupabaseOnce(
  userId: string
): Promise<boolean> {
  if (typeof window === 'undefined' || !userId) return false;

  const migrationKey = `velora_migrated_to_supabase_${userId}`;
  if (localStorage.getItem(migrationKey) === 'true') {
    return false;
  }

  // Mark in-progress to avoid duplicate concurrent runs
  localStorage.setItem(migrationKey, 'true');

  try {
    const localTracks = [
      ...readRawJsonArray<CareerTrack>(DEMO_STORAGE_KEYS.LEGACY_TRACKS),
      ...readRawJsonArray<CareerTrack>(DEMO_STORAGE_KEYS.TRACKS),
    ].filter((t) => t && !t.isDemo);

    const localResumes = [
      ...readRawJsonArray<Resume>(DEMO_STORAGE_KEYS.LEGACY_RESUMES),
      ...readRawJsonArray<Resume>(DEMO_STORAGE_KEYS.RESUMES),
    ].filter((r) => r && !r.isDemo);

    const localApps = [
      ...readRawJsonArray<JobApplication>(DEMO_STORAGE_KEYS.LEGACY_APPLICATIONS),
      ...readRawJsonArray<JobApplication>(DEMO_STORAGE_KEYS.APPLICATIONS),
    ].filter((a) => a && !a.isDemo);

    if (
      localTracks.length === 0 &&
      localResumes.length === 0 &&
      localApps.length === 0
    ) {
      return false;
    }

    const trackIdMap = new Map<string, string>();
    const seenTrackIds = new Set<string>();

    for (const track of localTracks) {
      if (seenTrackIds.has(track.id)) continue;
      seenTrackIds.add(track.id);
      try {
        const created = await createTrack({
          name: track.name,
          role: track.role,
          status: track.status,
          color: track.color,
        });
        trackIdMap.set(track.id, created.id);
      } catch (e) {
        console.warn('[Migration] Failed to migrate local track:', e);
      }
    }

    const resumeIdMap = new Map<string, string>();
    const seenResumeIds = new Set<string>();

    for (const resume of localResumes) {
      if (seenResumeIds.has(resume.id)) continue;
      seenResumeIds.add(resume.id);
      try {
        const mappedTrackId = trackIdMap.get(resume.trackId) || resume.trackId;
        const created = await createResume({
          name: resume.name,
          atsScore: resume.atsScore,
          template: resume.template,
          themeConfig: resume.themeConfig,
          content: resume.content,
          trackId: mappedTrackId,
        });
        resumeIdMap.set(resume.id, created.id);
      } catch (e) {
        console.warn('[Migration] Failed to migrate local resume:', e);
      }
    }

    const seenAppIds = new Set<string>();
    for (const app of localApps) {
      if (seenAppIds.has(app.id)) continue;
      seenAppIds.add(app.id);
      try {
        const mappedResumeId = app.resumeId
          ? resumeIdMap.get(app.resumeId) || app.resumeId
          : undefined;
        await createApplication({
          companyName: app.companyName,
          roleTitle: app.roleTitle,
          status: app.status,
          location: app.location,
          salaryRange: app.salaryRange,
          applicationLink: app.applicationLink || app.jobUrl,
          applicationDate: app.applicationDate,
          deadline: app.deadline,
          resumeId: mappedResumeId,
          jobDescription: app.jobDescription,
          notes: app.notes,
        });
      } catch (e) {
        console.warn('[Migration] Failed to migrate local application:', e);
      }
    }

    // Clear legacy keys after successful import
    localStorage.removeItem(DEMO_STORAGE_KEYS.LEGACY_TRACKS);
    localStorage.removeItem(DEMO_STORAGE_KEYS.LEGACY_RESUMES);
    localStorage.removeItem(DEMO_STORAGE_KEYS.LEGACY_APPLICATIONS);
    return true;
  } catch (err) {
    console.error('[Migration] Unexpected error during local data import:', err);
    return false;
  }
}
