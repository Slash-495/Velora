import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { role, jdText, resumeContent, userAnswer, conversationHistory } = await request.json();

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = response.text().trim();

    return NextResponse.json({ reply: aiText });
  } catch (error: any) {
    console.error('Error in interview-chat route:', error);
    // Fallback response if API key is not present or error occurs
    return NextResponse.json({
      reply: "Thank you for sharing that. Building on your experience, how do you approach monitoring and error handling in a production environment?"
    });
  }
}
