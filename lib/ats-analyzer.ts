import type { ResumeContent } from './mock-data';

export interface AtsAnalysisInput {
  resumeContent: ResumeContent;
  jdText: string;
  company?: string;
  role?: string;
}

export interface AtsAnalysisResult {
  score: number;
  matchPercentage: number;
  missingKeywords: string[];
  strongAreas: string[];
  weakAreas: string[];
}

/**
 * Computes a deterministic baseline ATS score (0–100) from structured ResumeContent
 * based on contact completeness, summary depth, quantified experience impact,
 * education, skills, and projects.
 */
export function calculateBaselineAtsScore(content: ResumeContent): number {
  let score = 0;

  const info = content?.personalInfo;
  if (info) {
    if (info.fullName?.trim()) score += 8;
    if (info.email?.trim()) score += 8;
    if (info.phone?.trim()) score += 6;
    if (info.linkedin?.trim() || info.github?.trim() || info.website?.trim()) {
      score += 6;
    }
    const summaryWords = (info.summary || '').trim().split(/\s+/).filter(Boolean).length;
    if (summaryWords >= 15) {
      score += 12;
    } else if (summaryWords >= 5) {
      score += 6;
    }
  }

  const experiences = content?.experience || [];
  if (experiences.length > 0) {
    score += 18;
    const allDescriptions = experiences.map((e) => e.description || '').join('\n');
    const hasMetrics = /(\d+%|\$\d+|\d+\+|\b\d{2,}\b)/.test(allDescriptions);
    if (hasMetrics) score += 12;
  }

  const education = content?.education || [];
  if (education.length > 0 && education.some((e) => e.school?.trim())) {
    score += 10;
  }

  const skills = content?.skills || [];
  const totalSkillItems = skills
    .flatMap((s) => (s.items || '').split(','))
    .map((item) => item.trim())
    .filter(Boolean).length;
  if (totalSkillItems >= 6) {
    score += 12;
  } else if (totalSkillItems >= 1) {
    score += 6;
  }

  const projects = content?.projects || [];
  if (projects.length > 0 && projects.some((p) => p.name?.trim())) {
    score += 8;
  }

  return Math.max(0, Math.min(100, score));
}

export function buildAtsAnalysisPrompt(input: AtsAnalysisInput): string {
  const { resumeContent, jdText, company, role } = input;
  return `
      You are an expert ATS (Applicant Tracking System) and technical recruiter.
      Analyze the provided Resume Content against the Job Description.

      Job Description Context:
      Role: ${role || 'Not specified'}
      Company: ${company || 'Not specified'}
      JD Text: ${jdText}

      Resume Content:
      ${JSON.stringify(resumeContent, null, 2)}

      Task: Return a strict JSON analysis containing the ATS score, missing keywords, strong areas, and weak areas.
      Be highly critical and accurate. Ensure keywords are specific technologies or skills.
    `;
}

function clampScore(value: unknown, fallback = 0): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Strips optional markdown code fences, parses the AI JSON response, and normalizes
 * numeric scores (clamped to 0–100) and string arrays.
 */
export function parseAndNormalizeAtsAnalysis(rawText: string): AtsAnalysisResult {
  const cleanJson = rawText.replace(/```(?:json)?/gi, '').trim();
  const parsed = JSON.parse(cleanJson) as Record<string, unknown>;

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('ATS analysis response must be a JSON object.');
  }

  if (parsed.score === undefined && parsed.matchPercentage === undefined) {
    throw new Error('ATS analysis response is missing required score fields.');
  }

  const score = clampScore(parsed.score ?? parsed.matchPercentage, 0);
  const matchPercentage = clampScore(parsed.matchPercentage ?? score, score);

  return {
    score,
    matchPercentage,
    missingKeywords: normalizeStringArray(parsed.missingKeywords),
    strongAreas: normalizeStringArray(parsed.strongAreas),
    weakAreas: normalizeStringArray(parsed.weakAreas),
  };
}
