export interface CareerTrack {
  id: string;
  name: string;
  role: string;
  status: "Active" | "Archived" | "Needs Optimization";
  color: string;
  updatedAt: string;
}

export interface Resume {
  id: string;
  trackId: string;
  name: string;
  atsScore: number;
  template: "Modern" | "Minimalist" | "Professional";
  updatedAt: string;
  // Future scalable JSON structure
  content: {
    personalInfo: any;
    experience: any[];
    projects: any[];
    skills: any[];
  };
}

export const mockTracks: CareerTrack[] = [
  {
    id: "track-1",
    name: "SDE Track",
    role: "Backend / Fullstack Engineer",
    status: "Active",
    color: "blue",
    updatedAt: "2024-03-15T10:00:00Z"
  },
  {
    id: "track-2",
    name: "Data Analyst",
    role: "Data Science / Analytics",
    status: "Active",
    color: "emerald",
    updatedAt: "2024-03-14T15:30:00Z"
  },
  {
    id: "track-3",
    name: "Product Manager",
    role: "Technical PM",
    status: "Needs Optimization",
    color: "orange",
    updatedAt: "2024-03-10T09:15:00Z"
  }
];

export const mockResumes: Resume[] = [
  // SDE Track Resumes
  {
    id: "res-1",
    trackId: "track-1",
    name: "Backend Engineer Core",
    atsScore: 94,
    template: "Modern",
    updatedAt: "2024-03-15T10:00:00Z",
    content: { personalInfo: {}, experience: [], projects: [], skills: [] }
  },
  {
    id: "res-2",
    trackId: "track-1",
    name: "Google SWE Tailored",
    atsScore: 96,
    template: "Minimalist",
    updatedAt: "2024-03-12T14:20:00Z",
    content: { personalInfo: {}, experience: [], projects: [], skills: [] }
  },
  {
    id: "res-3",
    trackId: "track-1",
    name: "Startup Fullstack",
    atsScore: 88,
    template: "Modern",
    updatedAt: "2024-03-01T11:00:00Z",
    content: { personalInfo: {}, experience: [], projects: [], skills: [] }
  },
  // Data Analyst Track Resumes
  {
    id: "res-4",
    trackId: "track-2",
    name: "Product Analytics focused",
    atsScore: 88,
    template: "Professional",
    updatedAt: "2024-03-14T15:30:00Z",
    content: { personalInfo: {}, experience: [], projects: [], skills: [] }
  },
  {
    id: "res-5",
    trackId: "track-2",
    name: "Data Engineering Junior",
    atsScore: 82,
    template: "Minimalist",
    updatedAt: "2024-02-28T09:00:00Z",
    content: { personalInfo: {}, experience: [], projects: [], skills: [] }
  },
  // PM Track Resumes
  {
    id: "res-6",
    trackId: "track-3",
    name: "Technical PM General",
    atsScore: 76,
    template: "Professional",
    updatedAt: "2024-03-10T09:15:00Z",
    content: { personalInfo: {}, experience: [], projects: [], skills: [] }
  }
];
