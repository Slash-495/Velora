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

  const rateLimitResponse = await enforceRateLimit(supabase, user.id, 'generate-questions');
  if (rateLimitResponse) return rateLimitResponse;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return apiError('BAD_REQUEST', 'Invalid JSON request body.', 400);
  }

  const { resumeContent, jdText, role } = body ?? {};

  if (!resumeContent || !jdText || !role) {
    return apiError('BAD_REQUEST', 'Missing required fields.', 400);
  }

  const validationError =
    validateJsonSize(resumeContent, 'resumeContent') ||
    validateStringLength(jdText, 'jdText', INPUT_LIMITS.MAX_TEXT_CHARS) ||
    validateStringLength(role, 'role', INPUT_LIMITS.MAX_SHORT_TEXT_CHARS);
  if (validationError) return validationError;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
      You are an expert Technical Interviewer and Career Coach.
      Your task is to generate exactly 5 highly relevant interview questions for the candidate based on their Resume and the Job Description.

      Role: ${role}
      
      Job Description:
      ${jdText}

      Candidate Resume:
      ${JSON.stringify(resumeContent, null, 2)}

      Requirements for questions:
      - 2 Technical/Skill-based questions directly related to the JD.
      - 1 Behavioral question (e.g., conflict, leadership, challenge).
      - 2 Resume Deep-Dive questions (ask them to explain a specific project or achievement mentioned in their resume).
      - CRITICAL: Adapt the complexity, depth, and expectations of ALL questions to match the seniority level implied by the Role (e.g., Junior vs. Senior vs. Lead) and the candidate's experience. A Senior should be asked about architecture, trade-offs, and leadership, while a Junior might be asked about implementation details.
      - Ensure questions are realistic, professional, and highly practical.

      Output STRICT JSON in this exact format, with NO comments:
      [
        {
          "question": "The interview question text",
          "category": "Technical" 
        }
      ]
    `;

    const questions = await callWithRetry(async () => {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const jsonText = response.text();
      const cleanJson = jsonText.replace(/```(?:json)?/gi, '').trim();
      return JSON.parse(cleanJson);
    });

    return apiSuccess({ questions });
  } catch (error: any) {
    return handleAIError(error, 'generate interview questions');
  }
}
