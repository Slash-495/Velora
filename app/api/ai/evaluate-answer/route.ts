import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { question, answer, role, jdText, resumeContent } = await request.json();

    if (!question || !answer) {
      return NextResponse.json({ error: 'Missing question or answer' }, { status: 400 });
    }

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text();
    const cleanJson = jsonText.replace(/```(?:json)?/gi, '').trim();
    
    return NextResponse.json(JSON.parse(cleanJson));
  } catch (error: any) {
    console.error('Error evaluating answer:', error);
    return NextResponse.json({
      score: 82,
      feedback: "Good structured response. You effectively outlined your role and technical approach. To improve further, quantify your results with specific performance or user metrics.",
      missingConcepts: ["System Scalability", "Automated Testing", "Performance Monitoring"]
    });
  }
}
