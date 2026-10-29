import { GoogleGenerativeAI } from '@google/generative-ai';
import { callWithRetry } from '@/lib/ai-retry-cache';
import {
  apiError,
  apiSuccess,
  enforceRateLimit,
  handleAIError,
  INPUT_LIMITS,
  requireUser,
  validateStringLength,
} from '@/lib/api-guard';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  const { user, supabase, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const rateLimitResponse = await enforceRateLimit(supabase, user.id, 'company-insights');
  if (rateLimitResponse) return rateLimitResponse;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return apiError('BAD_REQUEST', 'Invalid JSON request body.', 400);
  }

  const { companyName, industry, notes } = body ?? {};

  if (!companyName) {
    return apiError('BAD_REQUEST', 'Missing company name.', 400);
  }

  const validationError =
    validateStringLength(companyName, 'companyName', INPUT_LIMITS.MAX_SHORT_TEXT_CHARS) ||
    validateStringLength(industry, 'industry', INPUT_LIMITS.MAX_SHORT_TEXT_CHARS) ||
    validateStringLength(notes, 'notes', INPUT_LIMITS.MAX_TEXT_CHARS);
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
      Your task is to provide deep, actionable insights for preparing for an interview at a specific company.

      Company: ${companyName}
      Industry (if known): ${industry || 'Unknown'}
      
      User's Personal Preparation Notes (Context):
      """
      ${notes || 'No notes provided yet.'}
      """

      Analyze the company and incorporate the user's specific notes (if any) to provide tailored advice.

      Output STRICT JSON in the exact format below, with NO markdown blocks around it and NO comments:
      {
        "techStack": ["React", "Go", "AWS", "gRPC"],
        "culturalFocus": ["Bias for action", "Data-driven decisions", "Customer obsession"],
        "commonTopics": [
          { "topic": "System Design", "context": "Expect heavy focus on microservices and scalability." },
          { "topic": "Behavioral", "context": "They use the STAR method heavily." }
        ],
        "redFlags": ["Do not say you prefer working alone.", "Avoid disparaging past employers."],
        "greenFlags": ["Mentioning scale", "Discussing trade-offs explicitly"]
      }
    `;

    const insights = await callWithRetry(async () => {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const jsonText = response.text();
      const cleanJson = jsonText.replace(/```(?:json)?/gi, '').trim();
      return JSON.parse(cleanJson);
    });

    return apiSuccess(insights);
  } catch (error: any) {
    return handleAIError(error, 'generate company insights');
  }
}
