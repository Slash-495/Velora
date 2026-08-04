import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiCache, callWithRetry } from '@/lib/ai-retry-cache';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { role, jdText, resumeContent, userAnswer, conversationHistory } = payload;

    // 1. Response Caching (Requirement 3): Check cache for repeated prompts
    const cachedResponse = aiCache.get<{ reply: string }>("interview-chat", payload);
    if (cachedResponse) {
      console.log("[AI Cache Hit] Returning cached response for repeated prompt.");
      return NextResponse.json(cachedResponse);
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

    // 2. Retry Logic with Exponential Backoff (Requirement 2) for HTTP 429 errors
    const aiText = await callWithRetry(async () => {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    }, { maxRetries: 3, initialDelayMs: 800 });

    const responsePayload = { reply: aiText };

    // Cache result
    aiCache.set("interview-chat", payload, responsePayload);

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error('Error in interview-chat route:', error);
    return NextResponse.json({
      reply: "Thank you for sharing that. Building on your experience, how do you approach monitoring and error handling in a production environment?"
    });
  }
}
