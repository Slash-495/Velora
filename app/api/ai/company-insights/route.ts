import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { companyName, industry, notes } = await request.json();

    if (!companyName) {
      return NextResponse.json({ error: 'Missing company name' }, { status: 400 });
    }

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text();
    const cleanJson = jsonText.replace(/```(?:json)?/gi, '').trim();
    
    return NextResponse.json(JSON.parse(cleanJson));
  } catch (error: any) {
    console.error('Error generating company insights:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate insights' }, { status: 500 });
  }
}
