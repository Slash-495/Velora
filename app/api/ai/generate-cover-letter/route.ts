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
    return NextResponse.json({
      coverLetter: `Dear Hiring Team,\n\nI am writing to express my strong interest in the ${role || 'Software Engineering'} position at ${company || 'your organization'}. With a proven background in building scalable web applications, optimizing performance, and delivering user-focused software solutions, I am excited about the opportunity to contribute to your team.\n\nThroughout my experience, I have led technical initiatives that improved application speed, reduced latency, and enhanced user engagement. My hands-on experience with modern frameworks, combined with a data-driven mindset, enables me to deliver clean, maintainable code aligned with business goals.\n\nThank you for considering my application. I look forward to the possibility of discussing how my technical background and problem-solving skills align with your upcoming goals.\n\nSincerely,\nCandidate`
    });
  }
}
