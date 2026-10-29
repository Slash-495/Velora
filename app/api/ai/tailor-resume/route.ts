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

  const rateLimitResponse = await enforceRateLimit(supabase, user.id, 'tailor-resume');
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
      model: 'gemini-flash-latest', // Downgraded to flash because user API key has 0 quota for pro models
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
      You are an expert Resume Writer and ATS Optimizer.
      Your task is to tailor the provided Resume Content specifically for the given Job Description.
      
      Job Description Context:
      Role: ${role || 'Not specified'}
      Company: ${company || 'Not specified'}
      JD Text: ${jdText}

      Original Resume Content:
      ${JSON.stringify(resumeContent, null, 2)}

      Instructions:
      1. Rewrite the "summary" string inside personalInfo to align strongly with the JD requirements.
      2. Rewrite the "description" bullet points in the "experience" array. Inject relevant keywords from the JD naturally. Ensure bullet points are impactful, measurable, and action-oriented.
      3. Do NOT invent fake experience, degrees, or skills. Only reframe existing experience to highlight relevance.
      4. Return the EXACT SAME JSON structure for 'tailoredContent' as the original 'ResumeContent', containing the updated 'personalInfo' and 'experience' arrays.
      
      Output strict JSON containing 'tailoredContent' and 'changesMade'.
    `;

    const tailoredResult = await callWithRetry(async () => {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const jsonText = response.text();
      const cleanJson = jsonText.replace(/```(?:json)?/gi, '').trim();
      return JSON.parse(cleanJson);
    });

    return apiSuccess(tailoredResult);
  } catch (error: any) {
    return handleAIError(error, 'tailor resume');
  }
}
