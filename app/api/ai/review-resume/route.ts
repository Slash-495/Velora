import { GoogleGenerativeAI } from '@google/generative-ai';
import { callWithRetry } from '@/lib/ai-retry-cache';
import {
  apiError,
  apiSuccess,
  enforceRateLimit,
  handleAIError,
  INPUT_LIMITS,
  requireUser,
  validateJsonSize,
  validateStringLength,
} from '@/lib/api-guard';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  const { user, supabase, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const rateLimitResponse = await enforceRateLimit(supabase, user.id, 'review-resume');
  if (rateLimitResponse) return rateLimitResponse;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return apiError('BAD_REQUEST', 'Invalid JSON request body.', 400);
  }

  const { resumeContent, targetRole } = body ?? {};

  if (!resumeContent || !targetRole) {
    return apiError('BAD_REQUEST', 'Missing required fields.', 400);
  }

  const validationError =
    validateJsonSize(resumeContent, 'resumeContent') ||
    validateStringLength(targetRole, 'targetRole', INPUT_LIMITS.MAX_SHORT_TEXT_CHARS);
  if (validationError) return validationError;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
      You are an elite Silicon Valley Technical Recruiter and Career Coach.
      Your task is to provide a brutal, actionable, and deeply analytical review of this resume for the target role of "${targetRole}".

      Candidate Resume Data:
      ${JSON.stringify(resumeContent, null, 2)}

      Analyze the resume against top-tier industry standards and output STRICT JSON in the exact format below, with NO markdown blocks around it and NO comments:
      {
        "scores": {
          "overall": 85,
          "ats": 90,
          "recruiter": 75,
          "technical": 80,
          "readability": 95
        },
        "careerInsights": "A 2-3 sentence overarching strategic analysis of their positioning for this role.",
        "sectionAnalysis": [
          {
            "section": "Experience",
            "strengths": ["Quantified metrics in most bullet points.", "Clear progression."],
            "weaknesses": ["Lacks mention of system architecture decisions.", "Too many weak action verbs (e.g., 'Helped', 'Worked on')."],
            "recommendations": ["Replace 'Helped' with 'Engineered' or 'Architected'.", "Add 1 bullet on scalability."]
          },
          {
            "section": "Projects",
            "strengths": ["..."],
            "weaknesses": ["..."],
            "recommendations": ["..."]
          }
        ],
        "skillGaps": [
          {
            "skill": "Docker/Kubernetes",
            "context": "Highly expected for Senior Backend roles, but entirely missing."
          }
        ],
        "roadmap": {
          "thisWeek": ["Rewrite the 3 weakest bullet points.", "Remove obsolete skills (HTML/CSS)."],
          "thisMonth": ["Deploy 'Duffy' project to AWS to prove cloud knowledge."],
          "nextQuarter": ["Prepare for system design interviews.", "Contribute to 1 open source project."]
        }
      }
    `;

    const reviewData = await callWithRetry(async () => {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const jsonText = response.text();
      const cleanJson = jsonText.replace(/```(?:json)?/gi, '').trim();
      return JSON.parse(cleanJson);
    });

    return apiSuccess(reviewData);
  } catch (error: any) {
    return handleAIError(error, 'review resume');
  }
}
