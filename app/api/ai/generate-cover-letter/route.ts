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

  const rateLimitResponse = await enforceRateLimit(supabase, user.id, 'generate-cover-letter');
  if (rateLimitResponse) return rateLimitResponse;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return apiError('BAD_REQUEST', 'Invalid JSON request body.', 400);
  }

  const { company, role, jobDescription, tone } = body ?? {};

  const validationError =
    validateStringLength(company, 'company', INPUT_LIMITS.MAX_SHORT_TEXT_CHARS) ||
    validateStringLength(role, 'role', INPUT_LIMITS.MAX_SHORT_TEXT_CHARS) ||
    validateStringLength(tone, 'tone', INPUT_LIMITS.MAX_SHORT_TEXT_CHARS) ||
    validateStringLength(jobDescription, 'jobDescription', INPUT_LIMITS.MAX_TEXT_CHARS);
  if (validationError) return validationError;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
    });

    const prompt = `
      You are an expert Career Coach and Executive Resume Writer.
      Your task is to write a highly tailored, professional cover letter for a candidate.

      Target Company: ${company || '[Company Name]'}
      Target Role: ${role || '[Role Name]'}
      Desired Tone: ${tone || 'Professional'}

      Job Description:
      ${jobDescription || 'None provided. Focus on general best practices for the role.'}

      Requirements:
      1. DO NOT use generic, robotic, or cliché phrases (e.g., "I am writing to express my interest in...", "To whom it may concern").
      2. Use a strong, engaging opening hook.
      3. Tailor the content to highlight skills implicitly relevant to the provided Job Description.
      4. Ensure the tone closely matches the selected tone: "${tone}".
      5. Output ONLY the raw text of the cover letter. Do not include markdown formatting like bolding (**) or italics.
      6. Use standard business letter format (greeting, body paragraphs, sign-off).
      7. Use placeholders like [Your Name], [Contact Information] at the top or bottom as appropriate.

      Write the cover letter now:
    `;

    const coverLetter = await callWithRetry(async () => {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    });

    return apiSuccess({ coverLetter });
  } catch (error: any) {
    return handleAIError(error, 'generate cover letter');
  }
}
