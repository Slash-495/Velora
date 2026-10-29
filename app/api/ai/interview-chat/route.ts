import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiCache, callWithRetry } from '@/lib/ai-retry-cache';
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

  const rateLimitResponse = await enforceRateLimit(supabase, user.id, 'interview-chat', {
    limit: 20,
    windowSeconds: 60,
  });
  if (rateLimitResponse) return rateLimitResponse;

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return apiError('BAD_REQUEST', 'Invalid JSON request body.', 400);
  }

  const { role, jdText, resumeContent, userAnswer, conversationHistory } = payload ?? {};

  const validationError =
    validateStringLength(role, 'role', INPUT_LIMITS.MAX_SHORT_TEXT_CHARS) ||
    validateStringLength(jdText, 'jdText', INPUT_LIMITS.MAX_TEXT_CHARS) ||
    validateStringLength(userAnswer, 'userAnswer', INPUT_LIMITS.MAX_TEXT_CHARS) ||
    validateJsonSize(resumeContent, 'resumeContent') ||
    validateJsonSize(conversationHistory, 'conversationHistory');
  if (validationError) return validationError;

  try {
    // 1. Response Caching: Check cache for repeated prompts
    const cachedResponse = aiCache.get<{ reply: string }>("interview-chat", payload);
    if (cachedResponse) {
      console.log("[AI Cache Hit] Returning cached response for repeated prompt.");
      return apiSuccess(cachedResponse);
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
    });

    const prompt = `
      You are an elite, highly professional AI Technical Recruiter conducting a live technical screening call.
      
      Candidate Context:
      - Target Role: ${role || 'Software Engineer'}
      - Job Description snippet: ${jdText ? jdText.substring(0, 500) : 'General Software Engineering'}
      - Candidate Background snippet: ${resumeContent ? JSON.stringify(resumeContent).substring(0, 500) : 'Experienced developer'}

      Conversation History:
      ${JSON.stringify(conversationHistory || [])}

      Latest Candidate Answer:
      "${userAnswer}"

      Instructions for your reply:
      1. Acknowledge the candidate's response in 1 concise sentence with recruiter professionalism.
      2. If their answer was good, ask a logical, deeper follow-up question or transition to the next technical topic relevant to the JD and Role.
      3. Keep your reply concise (2 to 3 sentences max) so it sounds natural when spoken aloud via voice synthesis during a live call.
      4. Speak directly to the candidate ("Great points on scalability. Next, how do you handle...").
      5. DO NOT include markdown formatting like asterisks or bullet points—just natural spoken text.
    `;

    // 2. Retry Logic with Exponential Backoff for HTTP 429 errors
    const aiText = await callWithRetry(async () => {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    }, { maxRetries: 3, initialDelayMs: 800 });

    const responsePayload = { reply: aiText };

    // Cache result
    aiCache.set("interview-chat", payload, responsePayload);

    return apiSuccess(responsePayload);
  } catch (error: any) {
    return handleAIError(error, 'generate interviewer response');
  }
}
