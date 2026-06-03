import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { company, role, jobDescription, tone } = await request.json();

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return NextResponse.json({ coverLetter: text.trim() });
  } catch (error: any) {
    console.error('Error generating cover letter:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate cover letter' }, { status: 500 });
  }
}
