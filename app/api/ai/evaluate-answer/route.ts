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

  const rateLimitResponse = await enforceRateLimit(supabase, user.id, 'evaluate-answer');
  if (rateLimitResponse) return rateLimitResponse;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return apiError('BAD_REQUEST', 'Invalid JSON request body.', 400);
  }

  const { question, answer, role, jdText, resumeContent } = body ?? {};

  if (!question || !answer) {
    return apiError('BAD_REQUEST', 'Missing question or answer.', 400);
  }

  const validationError =
    validateStringLength(question, 'question', INPUT_LIMITS.MAX_TEXT_CHARS) ||
    validateStringLength(answer, 'answer', INPUT_LIMITS.MAX_TEXT_CHARS) ||
    validateStringLength(role, 'role', INPUT_LIMITS.MAX_SHORT_TEXT_CHARS) ||
    validateStringLength(jdText, 'jdText', INPUT_LIMITS.MAX_TEXT_CHARS) ||
    validateJsonSize(resumeContent, 'resumeContent');
  if (validationError) return validationError;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
      You are an expert Technical Interviewer evaluating a candidate's answer.
      
      Context:
      Role: ${role || 'Not specified'}
      Job Description: ${jdText ? jdText.substring(0, 1000) + '...' : 'Not provided'}
      Candidate Resume Summary: ${resumeContent?.personalInfo?.summary || 'Not provided'}
      
      The Question:
      "${question}"
      
      The Candidate's Answer:
      "${answer}"

      Your task is to evaluate the answer based on:
      - Clarity and communication.
      - Technical accuracy (if applicable).
      - Relevance to the question.
      - Use of the STAR method (if behavioral).

      Output STRICT JSON in this exact format, with no comments:
      {
        "score": 85,
        "feedback": "Detailed constructive feedback on what was good and what can be improved. Be professional and practical.",
        "missingConcepts": ["List", "Of", "Keywords", "Or", "Concepts", "They missed"]
      }
    `;

    const evaluation = await callWithRetry(async () => {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const jsonText = response.text();
      const cleanJson = jsonText.replace(/```(?:json)?/gi, '').trim();
      return JSON.parse(cleanJson);
    });

    return apiSuccess(evaluation);
  } catch (error: any) {
    return handleAIError(error, 'evaluate answer');
  }
}
