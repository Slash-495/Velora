export interface CareerTrack {
  id: string;
  name: string;
  role: string;
  status: "Active" | "Archived" | "Needs Optimization";
  color: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface ResumeContent {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    linkedin: string;
    github: string;
    summary: string;
    photoUrl?: string;
  };
  experience: {
    id: string;
    company: string;
    role: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }[];
  education: {
    id: string;
    school: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    gpa: string;
  }[];
  projects: {
    id: string;
    name: string;
    description: string;
    techStack: string;
    link: string;
  }[];
  skills: {
    id: string;
    category: string;
    items: string;
  }[];
}

import { ResumeThemeConfig, defaultThemeConfig } from "./templates";

export interface Resume {
  id: string;
  trackId: string;
  name: string;
  atsScore: number;
  template: string;
  themeConfig: ResumeThemeConfig;
  updatedAt: string;
  content: ResumeContent;
  isDemo?: boolean;
}

export type ApplicationStatus = "wishlist" | "applied" | "oa" | "interview" | "offer" | "rejected";

export interface JobApplication {
  id: string;
  companyName: string;
  roleTitle: string;
  location?: string;
  status: ApplicationStatus;
  resumeId?: string;
  applicationDate?: string;
  deadline?: string;
  salaryRange?: string;
  notes?: string;
  jobUrl?: string;
  isDemo?: boolean;
}

export const mockTracks: CareerTrack[] = [
  {
    id: "track-1",
    name: "Software Engineering",
    role: "Fullstack / Backend Developer",
    status: "Active",
    color: "blue",
    updatedAt: new Date().toISOString()
  }
];

const defaultContent: ResumeContent = {
  personalInfo: {
    fullName: "Alex Developer",
    email: "alex@example.com",
    phone: "(555) 019-2834",
    location: "San Francisco, CA",
    website: "alex.dev",
    linkedin: "linkedin.com/in/alexdev",
    github: "github.com/alexdev",
    summary: "Software engineer with experience building web applications, designing APIs, and optimizing database performance."
  },
  experience: [
    {
      id: "exp-1",
      company: "TechNova Solutions",
      role: "Software Engineer",
      location: "San Francisco, CA",
      startDate: "Jan 2022",
      endDate: "Present",
      current: true,
      description: "- Developed responsive web interfaces using React and Next.js.\n- Engineered microservices and improved API response times by 35%.\n- Collaborated with cross-functional product teams to release quarterly features."
    }
  ],
  education: [
    {
      id: "edu-1",
      school: "University of Technology",
      degree: "Bachelor of Science",
      field: "Computer Science",
      startDate: "Sep 2018",
      endDate: "May 2022",
      gpa: "3.8/4.0"
    }
  ],
  projects: [
    {
      id: "proj-1",
      name: "Velora AI Workspace",
      description: "An AI-powered career workspace that helps users tailor resumes and track job applications.",
      techStack: "Next.js, TypeScript, TailwindCSS, Supabase",
      link: "github.com/alexdev/velora"
    }
  ],
  skills: [
    { id: "skill-1", category: "Languages", items: "JavaScript, TypeScript, Python, HTML/CSS, SQL" },
    { id: "skill-2", category: "Frameworks & Libraries", items: "React, Next.js, Node.js, Express, TailwindCSS" },
    { id: "skill-3", category: "Tools & Infrastructure", items: "Git, Docker, AWS, Vercel, Supabase" }
  ]
};

export const mockApplications: JobApplication[] = [
  {
    id: "app-1",
    companyName: "Google",
    roleTitle: "Software Engineer",
    location: "Mountain View, CA",
    status: "interview",
    resumeId: "res-1",
    applicationDate: new Date(Date.now() - 86400000 * 3).toISOString(),
    deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
    salaryRange: "$150k - $200k",
  },
  {
    id: "app-2",
    companyName: "Stripe",
    roleTitle: "Backend Developer",
    location: "Remote",
    status: "applied",
    applicationDate: new Date(Date.now() - 86400000 * 1).toISOString(),
    salaryRange: "$160k - $210k",
  }
];

export const mockResumes: Resume[] = [
  {
    id: "res-1",
    trackId: "track-1",
    name: "Software Engineer Core Resume",
    atsScore: 92,
    template: "velora-professional",
    themeConfig: defaultThemeConfig,
    updatedAt: new Date().toISOString(),
    content: defaultContent
  }
];

export const mockCompanies = [
  {
    id: "comp-1",
    name: "Google",
    industry: "Internet & Technology",
    overview: "Global technology leader in search, cloud computing, and artificial intelligence.",
    description: "Global technology leader in search, cloud computing, and AI.",
    location: "Mountain View, CA",
    website: "google.com",
    careersUrl: "careers.google.com",
    techStack: ["Go", "C++", "Python", "Kubernetes", "gRPC"],
    culturalFocus: ["Focus on the user", "30% time for innovation", "Data-backed decisions"]
  },
  {
    id: "comp-2",
    name: "Stripe",
    industry: "Financial Infrastructure",
    overview: "Financial infrastructure for the internet powering global digital commerce.",
    description: "Financial infrastructure for the internet powering global digital commerce.",
    location: "San Francisco, CA (Remote)",
    website: "stripe.com",
    careersUrl: "stripe.com/jobs",
    techStack: ["Ruby", "TypeScript", "React", "AWS", "Kafka"],
    culturalFocus: ["Users first", "Move fast & fix things", "Meticulous quality"]
  }
];
