"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  ApplicationStatus,
  CareerTrack,
  JobApplication,
  Resume,
  ResumeContent,
} from "./mock-data";
import { defaultThemeConfig } from "./templates";
import { calculateBaselineAtsScore } from "./ats-analyzer";
import {
  createApplication,
  createResume,
  createTrack,
  deleteApplication,
  deleteResume,
  deleteTrack,
  getDemoApplications,
  getDemoResumes,
  getDemoTracks,
  isValidUuid,
  listApplications,
  listResumes,
  listTracks,
  migrateLocalStorageToSupabaseOnce,
  setDemoApplications,
  setDemoResumes,
  setDemoTracks,
  updateApplication,
  updateApplicationStatus,
  updateResume,
  updateTrack,
} from "./data";

const STORE_EVENT = "velora_store_update_event";

export interface QueryListWithMeta<T> extends Array<T> {
  isLoading: boolean;
  error: string | null;
  isDemoMode: boolean;
  refresh: () => Promise<void>;
}

export interface StoreHookState<T> {
  data: T[];
  isLoading: boolean;
  error: string | null;
  isDemoMode: boolean;
  refresh: () => Promise<void>;
}

function attachMeta<T>(
  items: T[],
  meta: {
    isLoading: boolean;
    error: string | null;
    isDemoMode: boolean;
    refresh: () => Promise<void>;
  }
): QueryListWithMeta<T> {
  const copy = [...items] as QueryListWithMeta<T>;
  Object.defineProperties(copy, {
    isLoading: { value: meta.isLoading, enumerable: false },
    error: { value: meta.error, enumerable: false },
    isDemoMode: { value: meta.isDemoMode, enumerable: false },
    refresh: { value: meta.refresh, enumerable: false },
  });
  return copy;
}

// Shared in-memory state across mounted hooks to avoid redundant fetches & broadcast mutations
interface StoreMemoryCache {
  userId: string | null;
  initialized: boolean;
  resumes: Resume[];
  tracks: CareerTrack[];
  applications: JobApplication[];
  resumesLoading: boolean;
  tracksLoading: boolean;
  applicationsLoading: boolean;
  resumesError: string | null;
  tracksError: string | null;
  applicationsError: string | null;
}

const memoryCache: StoreMemoryCache = {
  userId: null,
  initialized: false,
  resumes: [],
  tracks: [],
  applications: [],
  resumesLoading: true,
  tracksLoading: true,
  applicationsLoading: true,
  resumesError: null,
  tracksError: null,
  applicationsError: null,
};

let initPromise: Promise<void> | null = null;
let authListenerAttached = false;

function notifyStoreListeners() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STORE_EVENT));
  }
}

async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function refreshAllUserData(): Promise<void> {
  const userId = await getCurrentUserId();
  memoryCache.userId = userId;

  if (!userId) {
    // Explicit logged-out Demo Mode
    memoryCache.resumes = getDemoResumes();
    memoryCache.tracks = getDemoTracks();
    memoryCache.applications = getDemoApplications();
    memoryCache.resumesLoading = false;
    memoryCache.tracksLoading = false;
    memoryCache.applicationsLoading = false;
    memoryCache.resumesError = null;
    memoryCache.tracksError = null;
    memoryCache.applicationsError = null;
    memoryCache.initialized = true;
    notifyStoreListeners();
    return;
  }

  memoryCache.resumesLoading = true;
  memoryCache.tracksLoading = true;
  memoryCache.applicationsLoading = true;
  notifyStoreListeners();

  // One-time import of any existing non-demo localStorage items after sign-in
  await migrateLocalStorageToSupabaseOnce(userId);

  const [resumesResult, tracksResult, appsResult] = await Promise.allSettled([
    listResumes(),
    listTracks(),
    listApplications(),
  ]);

  if (resumesResult.status === "fulfilled") {
    memoryCache.resumes = resumesResult.value;
    memoryCache.resumesError = null;
  } else {
    memoryCache.resumesError =
      resumesResult.reason?.message || "Failed to load resumes.";
  }
  memoryCache.resumesLoading = false;

  if (tracksResult.status === "fulfilled") {
    memoryCache.tracks = tracksResult.value;
    memoryCache.tracksError = null;
  } else {
    memoryCache.tracksError =
      tracksResult.reason?.message || "Failed to load career tracks.";
  }
  memoryCache.tracksLoading = false;

  if (appsResult.status === "fulfilled") {
    memoryCache.applications = appsResult.value;
    memoryCache.applicationsError = null;
  } else {
    memoryCache.applicationsError =
      appsResult.reason?.message || "Failed to load job applications.";
  }
  memoryCache.applicationsLoading = false;

  memoryCache.initialized = true;
  notifyStoreListeners();
}

function ensureStoreInitialized() {
  if (typeof window === "undefined") return;

  if (!authListenerAttached) {
    authListenerAttached = true;
    try {
      const supabase = createClient();
      supabase.auth.onAuthStateChange((_event, session) => {
        const nextUserId = session?.user?.id ?? null;
        if (nextUserId !== memoryCache.userId || !memoryCache.initialized) {
          initPromise = refreshAllUserData();
        }
      });
    } catch {
      // Ignore if client fails to initialize in SSR
    }
  }

  if (!memoryCache.initialized && !initPromise) {
    initPromise = refreshAllUserData().finally(() => {
      initPromise = null;
    });
  }
}

// ============================================================================
// Hooks
// ============================================================================

export function useUserResumesState(): StoreHookState<Resume> {
  const [, setTick] = useState(0);

  useEffect(() => {
    ensureStoreInitialized();
    const sync = () => setTick((t) => t + 1);
    window.addEventListener(STORE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STORE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const refresh = useCallback(async () => {
    await refreshAllUserData();
  }, []);

  return {
    data: memoryCache.resumes,
    isLoading: memoryCache.resumesLoading,
    error: memoryCache.resumesError,
    isDemoMode: !memoryCache.userId,
    refresh,
  };
}

export function useUserResumes(): QueryListWithMeta<Resume> {
  const state = useUserResumesState();
  return attachMeta(state.data, state);
}

export function useUserTracksState(): StoreHookState<CareerTrack> {
  const [, setTick] = useState(0);

  useEffect(() => {
    ensureStoreInitialized();
    const sync = () => setTick((t) => t + 1);
    window.addEventListener(STORE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STORE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const refresh = useCallback(async () => {
    await refreshAllUserData();
  }, []);

  return {
    data: memoryCache.tracks,
    isLoading: memoryCache.tracksLoading,
    error: memoryCache.tracksError,
    isDemoMode: !memoryCache.userId,
    refresh,
  };
}

export function useUserTracks(): QueryListWithMeta<CareerTrack> {
  const state = useUserTracksState();
  return attachMeta(state.data, state);
}

export function useUserApplicationsState(): StoreHookState<JobApplication> {
  const [, setTick] = useState(0);

  useEffect(() => {
    ensureStoreInitialized();
    const sync = () => setTick((t) => t + 1);
    window.addEventListener(STORE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STORE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const refresh = useCallback(async () => {
    await refreshAllUserData();
  }, []);

  return {
    data: memoryCache.applications,
    isLoading: memoryCache.applicationsLoading,
    error: memoryCache.applicationsError,
    isDemoMode: !memoryCache.userId,
    refresh,
  };
}

export function useUserApplications(): QueryListWithMeta<JobApplication> {
  const state = useUserApplicationsState();
  return attachMeta(state.data, state);
}

// ============================================================================
// Actions (Supabase when authenticated; explicit Demo Mode when logged out)
// ============================================================================

export async function saveUserResume(
  resume: Resume,
  expectedVersion?: number
): Promise<Resume> {
  const userId = await getCurrentUserId();

  if (!userId) {
    const current = getDemoResumes();
    const exists = current.some((r) => r.id === resume.id);
    const nextResume: Resume = {
      ...resume,
      isDemo: true,
      version: (resume.version ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    };
    const updated = exists
      ? current.map((r) => (r.id === resume.id ? nextResume : r))
      : [nextResume, ...current];
    setDemoResumes(updated);
    memoryCache.resumes = updated;
    notifyStoreListeners();
    return nextResume;
  }

  const existsInDb =
    isValidUuid(resume.id) &&
    memoryCache.resumes.some((r) => r.id === resume.id);

  const saved = existsInDb
    ? await updateResume(
        resume.id,
        {
          name: resume.name,
          atsScore: resume.atsScore,
          template: resume.template,
          themeConfig: resume.themeConfig,
          content: resume.content,
          trackId: resume.trackId,
        },
        expectedVersion
      )
    : await createResume({
        id: isValidUuid(resume.id) ? resume.id : undefined,
        name: resume.name,
        atsScore: resume.atsScore,
        template: resume.template,
        themeConfig: resume.themeConfig,
        content: resume.content,
        trackId: resume.trackId,
      });

  const alreadyInCache = memoryCache.resumes.some((r) => r.id === saved.id);
  memoryCache.resumes = alreadyInCache
    ? memoryCache.resumes.map((r) => (r.id === saved.id ? saved : r))
    : [saved, ...memoryCache.resumes];
  notifyStoreListeners();
  return saved;
}

export async function deleteUserResume(id: string): Promise<void> {
  const userId = await getCurrentUserId();

  if (!userId) {
    const updated = getDemoResumes().filter((r) => r.id !== id);
    setDemoResumes(updated);
    memoryCache.resumes = updated;
    notifyStoreListeners();
    return;
  }

  const prev = memoryCache.resumes;
  memoryCache.resumes = prev.filter((r) => r.id !== id);
  notifyStoreListeners();

  try {
    await deleteResume(id);
  } catch (err) {
    memoryCache.resumes = prev;
    notifyStoreListeners();
    throw err;
  }
}

export async function saveUserTrack(track: CareerTrack): Promise<CareerTrack> {
  const userId = await getCurrentUserId();

  if (!userId) {
    const current = getDemoTracks();
    const exists = current.some((t) => t.id === track.id);
    const nextTrack: CareerTrack = {
      ...track,
      isDemo: true,
      updatedAt: new Date().toISOString(),
    };
    const updated = exists
      ? current.map((t) => (t.id === track.id ? nextTrack : t))
      : [nextTrack, ...current];
    setDemoTracks(updated);
    memoryCache.tracks = updated;
    notifyStoreListeners();
    return nextTrack;
  }

  const existsInDb =
    isValidUuid(track.id) &&
    memoryCache.tracks.some((t) => t.id === track.id);

  const saved = existsInDb
    ? await updateTrack(track.id, {
        name: track.name,
        role: track.role,
        status: track.status,
        color: track.color,
      })
    : await createTrack({
        id: isValidUuid(track.id) ? track.id : undefined,
        name: track.name,
        role: track.role,
        status: track.status,
        color: track.color,
      });

  const alreadyInCache = memoryCache.tracks.some((t) => t.id === saved.id);
  memoryCache.tracks = alreadyInCache
    ? memoryCache.tracks.map((t) => (t.id === saved.id ? saved : t))
    : [saved, ...memoryCache.tracks];
  notifyStoreListeners();
  return saved;
}

export async function deleteUserTrack(id: string): Promise<void> {
  const userId = await getCurrentUserId();

  if (!userId) {
    const updated = getDemoTracks().filter((t) => t.id !== id);
    setDemoTracks(updated);
    memoryCache.tracks = updated;
    notifyStoreListeners();
    return;
  }

  const prev = memoryCache.tracks;
  memoryCache.tracks = prev.filter((t) => t.id !== id);
  notifyStoreListeners();

  try {
    await deleteTrack(id);
  } catch (err) {
    memoryCache.tracks = prev;
    notifyStoreListeners();
    throw err;
  }
}

export async function saveUserApplication(
  app: JobApplication
): Promise<JobApplication> {
  const userId = await getCurrentUserId();

  if (!userId) {
    const current = getDemoApplications();
    const exists = current.some((a) => a.id === app.id);
    const nextApp: JobApplication = { ...app, isDemo: true };
    const updated = exists
      ? current.map((a) => (a.id === app.id ? nextApp : a))
      : [nextApp, ...current];
    setDemoApplications(updated);
    memoryCache.applications = updated;
    notifyStoreListeners();
    return nextApp;
  }

  const existsInDb =
    isValidUuid(app.id) &&
    memoryCache.applications.some((a) => a.id === app.id);

  const saved = existsInDb
    ? await updateApplication(app.id, app)
    : await createApplication(app);

  const alreadyInCache = memoryCache.applications.some(
    (a) => a.id === saved.id
  );
  memoryCache.applications = alreadyInCache
    ? memoryCache.applications.map((a) => (a.id === saved.id ? saved : a))
    : [saved, ...memoryCache.applications];
  notifyStoreListeners();
  return saved;
}

/**
 * Idempotent Kanban status update with optimistic UI update and rollback on failure.
 */
export async function updateUserApplicationStatus(
  id: string,
  status: ApplicationStatus
): Promise<JobApplication | null> {
  const existing = memoryCache.applications.find((a) => a.id === id);
  if (!existing) return null;

  // Idempotent no-op if status is already equal
  if (existing.status === status) {
    return existing;
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    return saveUserApplication({ ...existing, status });
  }

  // Optimistic update
  const previousApps = memoryCache.applications;
  memoryCache.applications = previousApps.map((a) =>
    a.id === id ? { ...a, status } : a
  );
  notifyStoreListeners();

  try {
    const saved = await updateApplicationStatus(id, status);
    memoryCache.applications = memoryCache.applications.map((a) =>
      a.id === id ? saved : a
    );
    notifyStoreListeners();
    return saved;
  } catch (err) {
    memoryCache.applications = previousApps;
    notifyStoreListeners();
    throw err;
  }
}

export async function deleteUserApplication(id: string): Promise<void> {
  const userId = await getCurrentUserId();

  if (!userId) {
    const updated = getDemoApplications().filter((a) => a.id !== id);
    setDemoApplications(updated);
    memoryCache.applications = updated;
    notifyStoreListeners();
    return;
  }

  const prev = memoryCache.applications;
  memoryCache.applications = prev.filter((a) => a.id !== id);
  notifyStoreListeners();

  try {
    await deleteApplication(id);
  } catch (err) {
    memoryCache.applications = prev;
    notifyStoreListeners();
    throw err;
  }
}

/**
 * Intelligent Text/File Parser that extracts structured ResumeContent from imported raw text or files.
 */
export function parseResumeContent(rawText: string): ResumeContent {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const fullName =
    lines[0] && lines[0].length < 40 && !lines[0].includes("@")
      ? lines[0]
      : "Candidate Resume";

  const emailMatch = rawText.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  );
  const email = emailMatch ? emailMatch[0] : "";

  const phoneMatch = rawText.match(
    /(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/
  );
  const phone = phoneMatch ? phoneMatch[0] : "";

  const linkedinMatch = rawText.match(
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i
  );
  const githubMatch = rawText.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i
  );

  const summary =
    rawText.length > 50 ? rawText.substring(0, 350) + "..." : rawText;

  return {
    personalInfo: {
      fullName,
      email,
      phone,
      location: "",
      website: "",
      linkedin: linkedinMatch ? linkedinMatch[0] : "",
      github: githubMatch ? githubMatch[0] : "",
      summary,
    },
    experience: [
      {
        id: `exp-${Date.now()}-1`,
        company: fullName ? `${fullName}'s Experience` : "Experience History",
        role: "Professional Background",
        location: "",
        startDate: "",
        endDate: "Present",
        current: true,
        description:
          rawText.length > 100 ? rawText.substring(0, 1500) : rawText,
      },
    ],
    education: [
      {
        id: `edu-${Date.now()}-1`,
        school: "Education History",
        degree: "Degree / Qualification",
        field: "Field of Study",
        startDate: "",
        endDate: "",
        gpa: "",
      },
    ],
    projects: [
      {
        id: `proj-${Date.now()}-1`,
        name: "Featured Projects",
        description: "Projects imported from candidate document.",
        techStack: "",
        link: "",
      },
    ],
    skills: [
      {
        id: `skill-${Date.now()}-1`,
        category: "Imported Skills",
        items: rawText.substring(0, 300),
      },
    ],
  };
}

/**
 * Creates a brand new imported Resume and persists it to Supabase (or Demo Mode when logged out).
 */
export async function importResumeFromText(
  rawText: string,
  resumeTitle: string,
  trackId: string = "",
  templateId: string = "velora-professional",
  preParsedContent?: ResumeContent
): Promise<Resume> {
  const content = preParsedContent || parseResumeContent(rawText);
  const draft: Resume = {
    id: `user-res-${Date.now()}`,
    trackId,
    name: resumeTitle || content.personalInfo.fullName || "Imported Resume",
    atsScore: calculateBaselineAtsScore(content),
    template: templateId,
    themeConfig: defaultThemeConfig,
    updatedAt: new Date().toISOString(),
    content,
    version: 1,
    isDemo: false,
  };

  return saveUserResume(draft);
}
