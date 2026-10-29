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

  const rateLimitResponse = await enforceRateLimit(supabase, user.id, 'evaluate-session');
  if (rateLimitResponse) return rateLimitResponse;

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return apiError('BAD_REQUEST', 'Invalid JSON request body.', 400);
  }

  const { role, userName } = payload ?? {};
  const history = Array.isArray(payload?.history) ? payload.history : [];

  const validationError =
    validateStringLength(role, 'role', INPUT_LIMITS.MAX_SHORT_TEXT_CHARS) ||
    validateStringLength(userName, 'userName', INPUT_LIMITS.MAX_SHORT_TEXT_CHARS) ||
    validateJsonSize(history, 'history');
  if (validationError) return validationError;

  try {
    // 1. Response Caching: Check cache for identical transcript evaluation
    const cachedEvaluation = aiCache.get<any>("evaluate-session", payload);
    if (cachedEvaluation) {
      console.log("[AI Cache Hit] Returning cached evaluation report.");
      return apiSuccess(cachedEvaluation);
    }

    const userResponses = history.filter((h: any) => h.role === 'user');
    const totalWordsSpoken = userResponses.reduce(
      (acc: number, curr: any) => acc + (curr.text || '').trim().split(/\s+/).filter(Boolean).length,
      0
    );

    // If candidate spoke less than 10 words, return INCOMPLETE report
    if (userResponses.length === 0 || totalWordsSpoken < 10) {
      const incompleteReport = {
        score: 0,
        status: "Incomplete / No Answers",
        summary: "The interview was ended before any substantial answers were provided. No technical data was recorded.",
        technicalDepth: 0,
        communication: 0,
        problemSolving: 0,
        strengths: ["No technical responses recorded."],
        areasForImprovement: ["Participate and answer questions during the voice screen to receive an evaluation."],
        isComplete: false
      };
      return apiSuccess(incompleteReport);
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      You are an expert Chief Technology Officer and AI Technical Interviewer.
      Evaluate the candidate's actual interview performance strictly based on their spoken transcript below.

      Candidate Name: ${userName || 'Candidate'}
      Target Role: ${role || 'Software Engineer'}

      Full Spoken Transcript:
      ${JSON.stringify(history, null, 2)}

      Evaluate strictly and realistically:
      - Score (0 to 100 integer based on technical accuracy, clarity, and depth).
      - Status ("Passed", "Consider", or "Needs Practice").
      - Summary (2 sentences summarizing how they performed based ONLY on what they said).
      - technicalDepth (0-100 integer).
      - communication (0-100 integer).
      - problemSolving (0-100 integer).
      - strengths (array of 2-3 specific bullet points citing what they did well in their transcript).
      - areasForImprovement (array of 2-3 specific bullet points citing where they were lacking or vague).

      Output STRICT JSON matching this exact structure:
      {
        "score": 82,
        "status": "Passed",
        "summary": "Summary text...",
        "technicalDepth": 80,
        "communication": 85,
        "problemSolving": 80,
        "strengths": ["Point 1", "Point 2"],
        "areasForImprovement": ["Point 1", "Point 2"],
        "isComplete": true
      }
    `;

    // 2. Retry Logic with Exponential Backoff for HTTP 429 errors
    const evaluationData = await callWithRetry(async () => {
      const result = await model.generateContent(prompt);
      const text = (await result.response).text().trim();
      const cleanJson = text.replace(/```(?:json)?/gi, '').trim();
      return JSON.parse(cleanJson);
    }, { maxRetries: 3, initialDelayMs: 800 });

    // Cache the result
    aiCache.set("evaluate-session", payload, evaluationData);

    return apiSuccess(evaluationData);
  } catch (error: any) {
    return handleAIError(error, 'evaluate interview session');
  }
}
