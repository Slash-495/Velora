import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  buildAtsAnalysisPrompt,
  calculateBaselineAtsScore,
  parseAndNormalizeAtsAnalysis,
} from '@/lib/ats-analyzer';
import type { ResumeContent } from '@/lib/mock-data';

const mockGenerateContent = vi.fn();
const mockGetUser = vi.fn();
const mockMaybeSingle = vi.fn();
const mockInsert = vi.fn();

vi.mock('@google/generative-ai', () => ({
  SchemaType: {
    OBJECT: 'OBJECT',
    INTEGER: 'INTEGER',
    ARRAY: 'ARRAY',
    STRING: 'STRING',
  },
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn(() => ({
      generateContent: mockGenerateContent,
    })),
  })),
}));

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: mockMaybeSingle,
            })),
          })),
        })),
      })),
      insert: mockInsert,
    })),
  })),
}));

const fullResumeContent: ResumeContent = {
  personalInfo: {
    fullName: 'Ada Lovelace',
    email: 'ada@analytical.engine',
    phone: '+1-555-234-5678',
    location: 'London, UK',
    website: 'adalovelace.dev',
    linkedin: 'linkedin.com/in/adalovelace',
    github: 'github.com/adalovelace',
    summary:
      'Staff Software Engineer with 8 years of experience architecting distributed cloud systems, reducing latency by 45%, and leading platform teams across high-throughput environments.',
  },
  experience: [
    {
      id: 'exp-1',
      company: 'Analytical Systems',
      role: 'Senior Backend Engineer',
      location: 'Remote',
      startDate: 'Jan 2021',
      endDate: 'Present',
      current: true,
      description:
        '- Cut p99 API latency by 42% using Redis caching and PostgreSQL indexing.\n- Scaled event pipeline to 50,000+ requests/sec.',
    },
  ],
  education: [
    {
      id: 'edu-1',
      school: 'University of London',
      degree: 'B.S.',
      field: 'Computer Science',
      startDate: '2014',
      endDate: '2018',
      gpa: '3.9',
    },
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'Velora Engine',
      description: 'Open-source distributed job scheduler.',
      techStack: 'Go, PostgreSQL, Docker',
      link: 'github.com/adalovelace/velora-engine',
    },
  ],
  skills: [
    {
      id: 'skill-1',
      category: 'Languages & Cloud',
      items: 'TypeScript, Go, Python, PostgreSQL, Redis, Docker, Kubernetes',
    },
  ],
};

describe('ATS Scoring & Analysis Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('computes a high baseline ATS score for a complete, quantified resume and a low score for an empty resume', () => {
    const fullScore = calculateBaselineAtsScore(fullResumeContent);
    expect(fullScore).toBe(100);

    const emptyContent: ResumeContent = {
      personalInfo: {
        fullName: '',
        email: '',
        phone: '',
        location: '',
        website: '',
        linkedin: '',
        github: '',
        summary: '',
      },
      experience: [],
      education: [],
      projects: [],
      skills: [],
    };
    expect(calculateBaselineAtsScore(emptyContent)).toBe(0);
  });

  it('parses markdown-fenced JSON and clamps out-of-range ATS scores to [0, 100]', () => {
    const raw = `\`\`\`json
    {
      "score": 115,
      "matchPercentage": -10,
      "missingKeywords": [" Kubernetes ", "", "GraphQL"],
      "strongAreas": ["Distributed Systems"],
      "weakAreas": ["Frontend Testing"]
    }
    \`\`\``;

    const result = parseAndNormalizeAtsAnalysis(raw);
    expect(result).toEqual({
      score: 100,
      matchPercentage: 0,
      missingKeywords: ['Kubernetes', 'GraphQL'],
      strongAreas: ['Distributed Systems'],
      weakAreas: ['Frontend Testing'],
    });
  });

  it('throws on malformed JSON or missing score fields', () => {
    expect(() => parseAndNormalizeAtsAnalysis('not-json')).toThrow();
    expect(() =>
      parseAndNormalizeAtsAnalysis(JSON.stringify({ missingKeywords: ['Go'] }))
    ).toThrow(/missing required score fields/i);
  });

  it('builds a prompt containing role, company, JD text, and serialized resume content', () => {
    const prompt = buildAtsAnalysisPrompt({
      resumeContent: fullResumeContent,
      jdText: 'Looking for a Principal Go Engineer with Kubernetes experience.',
      company: 'Acme Cloud',
      role: 'Principal Engineer',
    });

    expect(prompt).toContain('Principal Engineer');
    expect(prompt).toContain('Acme Cloud');
    expect(prompt).toContain('Looking for a Principal Go Engineer');
    expect(prompt).toContain('Ada Lovelace');
  });

  it('POST /api/ai/analyze-resume returns normalized ATS analysis using mocked Gemini and Supabase', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: '11111111-1111-4111-8111-111111111111' } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockInsert.mockResolvedValue({ error: null });
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            score: 88,
            matchPercentage: 84,
            missingKeywords: ['Terraform'],
            strongAreas: ['Go', 'PostgreSQL'],
            weakAreas: ['IaC tooling'],
          }),
      },
    });

    const { POST } = await import('@/app/api/ai/analyze-resume/route');
    const req = new Request('http://localhost:3000/api/ai/analyze-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeContent: fullResumeContent,
        jdText: 'Senior Backend Engineer role requiring Go, PostgreSQL, and Terraform.',
        company: 'Velora',
        role: 'Senior Backend Engineer',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      data: {
        score: 88,
        matchPercentage: 84,
        missingKeywords: ['Terraform'],
        strongAreas: ['Go', 'PostgreSQL'],
        weakAreas: ['IaC tooling'],
      },
    });
  });
});
