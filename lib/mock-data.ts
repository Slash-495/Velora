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
  template: string; // Updated to reference template ID
  themeConfig: ResumeThemeConfig;
  updatedAt: string;
  content: ResumeContent;
  isDemo?: boolean;
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

const defaultContent: ResumeContent = {
  personalInfo: {
    fullName: "Alex Developer",
    email: "alex@example.com",
    phone: "(555) 123-4567",
    location: "San Francisco, CA",
    website: "alex.dev",
    linkedin: "linkedin.com/in/alexdev",
    github: "github.com/alexdev",
    summary: "Passionate software engineer with 5+ years of experience building scalable web applications. Strong focus on modern frontend architectures and performance optimization."
  },
  experience: [
    {
      id: "exp-1",
      company: "TechNova Solutions",
      role: "Senior Frontend Engineer",
      location: "San Francisco, CA",
      startDate: "Jan 2021",
      endDate: "Present",
      current: true,
      description: "- Spearheaded the migration of a legacy monolithic frontend to a micro-frontend architecture using Next.js and React.\n- Improved core web vitals by 40%, leading to a 15% increase in user retention.\n- Mentored a team of 4 junior developers and established code review best practices."
    },
    {
      id: "exp-2",
      company: "Digital Horizon",
      role: "Software Engineer",
      location: "Austin, TX",
      startDate: "Jun 2018",
      endDate: "Dec 2020",
      current: false,
      description: "- Developed and maintained RESTful APIs using Node.js and Express.\n- Implemented responsive, mobile-first UI components using React and TailwindCSS.\n- Reduced deployment time by 50% through CI/CD pipeline optimizations."
    }
  ],
  education: [
    {
      id: "edu-1",
      school: "University of Technology",
      degree: "Bachelor of Science",
      field: "Computer Science",
      startDate: "Sep 2014",
      endDate: "May 2018",
      gpa: "3.8/4.0"
    }
  ],
  projects: [
    {
      id: "proj-1",
      name: "Velora AI Workspace",
      description: "An AI-powered career workspace that helps users tailor resumes and track applications.",
      techStack: "Next.js, TypeScript, TailwindCSS, Supabase",
      link: "github.com/alexdev/velora"
    }
  ],
  skills: [
    { id: "skill-1", category: "Languages", items: "JavaScript, TypeScript, Python, HTML/CSS" },
    { id: "skill-2", category: "Frameworks", items: "React, Next.js, Node.js, Express, TailwindCSS" },
    { id: "skill-3", category: "Tools", items: "Git, Docker, AWS, Vercel, Supabase" }
  ]
};

export const mockApplications: JobApplication[] = [
  {
    id: "app-1",
    companyName: "Google",
    roleTitle: "Software Engineer",
    location: "Mountain View, CA",
    status: "interview",
    resumeId: "1",
    applicationDate: "2024-05-10T10:00:00Z",
    salaryRange: "$150k - $200k",
  },
  {
    id: "app-2",
    companyName: "Stripe",
    roleTitle: "Backend Developer",
    location: "Remote",
    status: "applied",
    applicationDate: "2024-05-20T10:00:00Z",
    salaryRange: "$160k - $210k",
  },
  {
    id: "app-3",
    companyName: "Vercel",
    roleTitle: "Frontend Engineer",
    location: "Remote",
    status: "wishlist",
    salaryRange: "$140k - $180k",
  },
  {
    id: "app-4",
    companyName: "Meta",
    roleTitle: "Production Engineer",
    location: "Menlo Park, CA",
    status: "oa",
    applicationDate: "2024-05-15T10:00:00Z",
    deadline: "2024-06-01T10:00:00Z",
  },
  {
    id: "app-5",
    companyName: "Netflix",
    roleTitle: "Senior Software Engineer",
    location: "Los Gatos, CA",
    status: "rejected",
    applicationDate: "2024-04-10T10:00:00Z",
  }
];

export const mockResumes: Resume[] = [
  // SDE Track Resumes
  {
    id: "res-1",
    trackId: "track-1",
    name: "Backend Engineer Core",
    atsScore: 94,
    template: "velora-professional",
    themeConfig: defaultThemeConfig,
    updatedAt: "2024-03-15T10:00:00Z",
    content: defaultContent
  },
  {
    id: "res-2",
    trackId: "track-1",
    name: "Google SWE Tailored",
    atsScore: 96,
    template: "modern-minimalist",
    themeConfig: defaultThemeConfig,
    updatedAt: "2024-03-12T14:20:00Z",
    content: defaultContent
  },
  {
    id: "res-3",
    trackId: "track-1",
    name: "Startup Fullstack",
    atsScore: 88,
    template: "velora-professional",
    themeConfig: defaultThemeConfig,
    updatedAt: "2024-03-01T11:00:00Z",
    content: defaultContent
  },
  // Data Analyst Track Resumes
  {
    id: "res-4",
    trackId: "track-2",
    name: "Product Analytics focused",
    atsScore: 88,
    template: "velora-professional",
    themeConfig: defaultThemeConfig,
    updatedAt: "2024-03-14T15:30:00Z",
    content: defaultContent
  },
  {
    id: "res-5",
    trackId: "track-2",
    name: "Data Engineering Junior",
    atsScore: 82,
    template: "modern-minimalist",
    themeConfig: defaultThemeConfig,
    updatedAt: "2024-02-28T09:00:00Z",
    content: defaultContent
  },
  // PM Track Resumes
  {
    id: "res-6",
    trackId: "track-3",
    name: "Technical PM General",
    atsScore: 76,
    template: "velora-professional",
    themeConfig: defaultThemeConfig,
    updatedAt: "2024-03-10T09:15:00Z",
    content: defaultContent
  }
];

export interface Company {
  id: string;
  name: string;
  industry: string;
  location: string;
  overview: string;
  website: string;
  careersUrl: string;
  logoUrl?: string;
}

export const mockCompanies: Company[] = [
  {
    id: "comp-1",
    name: "Google",
    industry: "Technology",
    location: "Mountain View, CA",
    overview: "Google is a multinational technology company focusing on search engine technology, online advertising, cloud computing, computer software, quantum computing, e-commerce, artificial intelligence, and consumer electronics.",
    website: "google.com",
    careersUrl: "careers.google.com"
  },
  {
    id: "comp-2",
    name: "Stripe",
    industry: "Financial Services",
    location: "San Francisco, CA",
    overview: "Stripe is an Irish-American financial services and software as a service company dual-headquartered in South San Francisco, California and Dublin, Ireland.",
    website: "stripe.com",
    careersUrl: "stripe.com/jobs"
  },
  {
    id: "comp-3",
    name: "Vercel",
    industry: "Cloud Platform",
    location: "San Francisco, CA",
    overview: "Vercel is a platform for frontend frameworks and static sites, built to integrate with headless content, commerce, or database.",
    website: "vercel.com",
    careersUrl: "vercel.com/careers"
  }
];
