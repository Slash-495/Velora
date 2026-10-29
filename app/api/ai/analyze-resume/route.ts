import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
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

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  const { user, supabase, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const rateLimitResponse = await enforceRateLimit(supabase, user.id, 'analyze-resume');
  if (rateLimitResponse) return rateLimitResponse;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return apiError('BAD_REQUEST', 'Invalid JSON request body.', 400);
  }

  const { resumeContent, jdText, company, role } = body ?? {};

  if (!resumeContent || !jdText) {
    return apiError('BAD_REQUEST', 'Missing resume content or job description.', 400);
  }

  const validationError =
    validateJsonSize(resumeContent, 'resumeContent') ||
    validateStringLength(jdText, 'jdText', INPUT_LIMITS.MAX_TEXT_CHARS) ||
    validateStringLength(company, 'company', INPUT_LIMITS.MAX_SHORT_TEXT_CHARS) ||
    validateStringLength(role, 'role', INPUT_LIMITS.MAX_SHORT_TEXT_CHARS);
  if (validationError) return validationError;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            score: {
              type: SchemaType.INTEGER,
              description: "The ATS match score out of 100",
            },
            matchPercentage: {
              type: SchemaType.INTEGER,
              description: "The match percentage",
            },
            missingKeywords: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
              description: "3-5 crucial keywords missing from the resume",
            },
            strongAreas: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
              description: "3-5 areas where the resume perfectly aligns with the JD",
            },
            weakAreas: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
              description: "1-3 areas where the resume is weak compared to the JD",
            },
          },
          required: ["score", "matchPercentage", "missingKeywords", "strongAreas", "weakAreas"]
        }
      }
    });

    const prompt = `
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

    const analysis = await callWithRetry(async () => {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const jsonText = response.text();
      const cleanJson = jsonText.replace(/```(?:json)?/gi, '').trim();
      return JSON.parse(cleanJson);
    });

    return apiSuccess(analysis);
  } catch (error: any) {
    return handleAIError(error, 'analyze resume');
  }
}
