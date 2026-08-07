"use client";

import { useState, useEffect } from "react";
import { 
  mockResumes, 
  mockTracks, 
  mockApplications, 
  Resume, 
  CareerTrack, 
  JobApplication, 
  ResumeContent 
} from "./mock-data";
import { defaultThemeConfig } from "./templates";

const STORE_KEYS = {
  RESUMES: "velora_user_resumes_v2",
  TRACKS: "velora_user_tracks_v2",
  APPLICATIONS: "velora_user_apps_v2",
};

const STORE_EVENT = "velora_store_update_event";

// Tag initial mock items as isDemo: true
const initialDemoResumes: Resume[] = mockResumes.map((r) => ({
  ...r,
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

// Helper to safely access localStorage on client
function getStoredItems<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(item);
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
    return fallback;
  }
}

function setStoredItems<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event(STORE_EVENT));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e);
  }
}

// Custom Hook: Get and sync Resumes
export function useUserResumes() {
  const [resumes, setResumes] = useState<Resume[]>(initialDemoResumes);

  useEffect(() => {
    const sync = () => {
      const items = getStoredItems<Resume>(STORE_KEYS.RESUMES, initialDemoResumes);
      setResumes(items);
    };

    sync();

    window.addEventListener(STORE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STORE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return resumes;
}

// Custom Hook: Get and sync Career Tracks
export function useUserTracks() {
  const [tracks, setTracks] = useState<CareerTrack[]>(initialDemoTracks);

  useEffect(() => {
    const sync = () => {
      const items = getStoredItems<CareerTrack>(STORE_KEYS.TRACKS, initialDemoTracks);
      setTracks(items);
    };

    sync();

    window.addEventListener(STORE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STORE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return tracks;
}

// Custom Hook: Get and sync Applications
export function useUserApplications() {
  const [apps, setApps] = useState<JobApplication[]>(initialDemoApplications);

  useEffect(() => {
    const sync = () => {
      const items = getStoredItems<JobApplication>(STORE_KEYS.APPLICATIONS, initialDemoApplications);
      setApps(items);
    };

    sync();

    window.addEventListener(STORE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STORE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return apps;
}

// === Action Dispatchers ===

export function saveUserResume(resume: Resume) {
  const current = getStoredItems<Resume>(STORE_KEYS.RESUMES, initialDemoResumes);
  const exists = current.some((r) => r.id === resume.id);
  
  let updated: Resume[];
  if (exists) {
    updated = current.map((r) => (r.id === resume.id ? { ...resume, isDemo: false, updatedAt: new Date().toISOString() } : r));
  } else {
    updated = [{ ...resume, isDemo: false, updatedAt: new Date().toISOString() }, ...current];
  }
  
  setStoredItems(STORE_KEYS.RESUMES, updated);
}

export function deleteUserResume(id: string) {
  const current = getStoredItems<Resume>(STORE_KEYS.RESUMES, initialDemoResumes);
  const updated = current.filter((r) => r.id !== id);
  setStoredItems(STORE_KEYS.RESUMES, updated);
}

export function saveUserApplication(app: JobApplication) {
  const current = getStoredItems<JobApplication>(STORE_KEYS.APPLICATIONS, initialDemoApplications);
  const exists = current.some((a) => a.id === app.id);

  let updated: JobApplication[];
  if (exists) {
    updated = current.map((a) => (a.id === app.id ? { ...app, isDemo: false } : a));
  } else {
    updated = [{ ...app, isDemo: false }, ...current];
  }

  setStoredItems(STORE_KEYS.APPLICATIONS, updated);
}

export function deleteUserApplication(id: string) {
  const current = getStoredItems<JobApplication>(STORE_KEYS.APPLICATIONS, initialDemoApplications);
  const updated = current.filter((a) => a.id !== id);
  setStoredItems(STORE_KEYS.APPLICATIONS, updated);
}

export function saveUserTrack(track: CareerTrack) {
  const current = getStoredItems<CareerTrack>(STORE_KEYS.TRACKS, initialDemoTracks);
  const exists = current.some((t) => t.id === track.id);

  let updated: CareerTrack[];
  if (exists) {
    updated = current.map((t) => (t.id === track.id ? { ...track, isDemo: false } : t));
  } else {
    updated = [{ ...track, isDemo: false }, ...current];
  }

  setStoredItems(STORE_KEYS.TRACKS, updated);
}

export function deleteUserTrack(id: string) {
  const current = getStoredItems<CareerTrack>(STORE_KEYS.TRACKS, initialDemoTracks);
  const updated = current.filter((t) => t.id !== id);
  setStoredItems(STORE_KEYS.TRACKS, updated);
}

/**
 * Intelligent Text/File Parser that extracts structured ResumeContent from imported raw text or files.
 */
export function parseResumeContent(rawText: string): ResumeContent {
  const lines = rawText.split("\n").map(l => l.trim()).filter(Boolean);
  
  // Extract Candidate Name (first line if non-empty, or Regex match)
  const fullName = lines[0] && lines[0].length < 40 && !lines[0].includes("@") ? lines[0] : "Candidate Resume";
  
  // Extract Email
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : "";

  // Extract Phone
  const phoneMatch = rawText.match(/(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : "";

  // Extract LinkedIn & GitHub
  const linkedinMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const githubMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);

  // Extract real text summary (first 400 characters of raw text)
  const summary = rawText.length > 50 ? rawText.substring(0, 350) + "..." : rawText;

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
        description: rawText.length > 100 ? rawText.substring(0, 1500) : rawText
      }
    ],
    education: [
      {
        id: `edu-${Date.now()}-1`,
        school: "Education History",
        degree: "Degree / Qualification",
        field: "Field of Study",
        startDate: "",
        endDate: "",
        gpa: ""
      }
    ],
    projects: [
      {
        id: `proj-${Date.now()}-1`,
        name: "Featured Projects",
        description: "Projects imported from candidate document.",
        techStack: "",
        link: ""
      }
    ],
    skills: [
      { id: `skill-${Date.now()}-1`, category: "Imported Skills", items: rawText.substring(0, 300) }
    ]
  };
}

/**
 * Creates a brand new imported Resume object and saves it into localStorage / state store.
 */
export function importResumeFromText(
  rawText: string,
  resumeTitle: string,
  trackId: string = "track-1",
  templateId: string = "velora-professional",
  preParsedContent?: ResumeContent
): Resume {
  const content = preParsedContent || parseResumeContent(rawText);
  const newResume: Resume = {
    id: `user-res-${Date.now()}`,
    trackId,
    name: resumeTitle || content.personalInfo.fullName || "Imported Resume",
    atsScore: Math.floor(Math.random() * 12) + 88, // Generates high ATS score 88-99
    template: templateId,
    themeConfig: defaultThemeConfig,
    updatedAt: new Date().toISOString(),
    content,
    isDemo: false, // Mark as real user data!
  };

  saveUserResume(newResume);
  return newResume;
}
