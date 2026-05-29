import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { resumeContent, jdText, role } = await request.json();

    if (!resumeContent || !jdText || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
      You are an expert Technical Interviewer and Career Coach.
      Your task is to generate exactly 5 highly relevant interview questions for the candidate based on their Resume and the Job Description.

      Role: ${role}
      
      Job Description:
      ${jdText}

      Candidate Resume:
      ${JSON.stringify(resumeContent, null, 2)}

      Requirements for questions:
      - 2 Technical/Skill-based questions directly related to the JD.
      - 1 Behavioral question (e.g., conflict, leadership, challenge).
      - 2 Resume Deep-Dive questions (ask them to explain a specific project or achievement mentioned in their resume).
      - CRITICAL: Adapt the complexity, depth, and expectations of ALL questions to match the seniority level implied by the Role (e.g., Junior vs. Senior vs. Lead) and the candidate's experience. A Senior should be asked about architecture, trade-offs, and leadership, while a Junior might be asked about implementation details.
      - Ensure questions are realistic, professional, and highly practical.

      Output STRICT JSON in this exact format, with NO comments:
      [
        {
          "question": "The interview question text",
          "category": "Technical" 
        }
      ]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text();
    const cleanJson = jsonText.replace(/```(?:json)?/gi, '').trim();
    
    return NextResponse.json({ questions: JSON.parse(cleanJson) });
  } catch (error: any) {
    console.error('Error generating questions:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate questions' }, { status: 500 });
  }
}
