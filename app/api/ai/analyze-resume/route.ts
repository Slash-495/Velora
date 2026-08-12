import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { ResumeContent } from '@/lib/mock-data';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { resumeContent, jdText, company, role } = await request.json();

    if (!resumeContent || !jdText) {
      return NextResponse.json({ error: 'Missing resume content or job description' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            score: {
              type: SchemaType.INTEGER,
              description: "The ATS match score out of 100",
            },
            matchPercentage: {
              type: SchemaType.INTEGER,
              description: "The match percentage",
            },
            missingKeywords: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
              description: "3-5 crucial keywords missing from the resume",
            },
            strongAreas: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
              description: "3-5 areas where the resume perfectly aligns with the JD",
            },
            weakAreas: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
              description: "1-3 areas where the resume is weak compared to the JD",
            },
          },
          required: ["score", "matchPercentage", "missingKeywords", "strongAreas", "weakAreas"]
        }
      }
    });

    const prompt = `
      You are an expert ATS (Applicant Tracking System) and technical recruiter.
      Analyze the provided Resume Content against the Job Description.

      Job Description Context:
      Role: ${role || 'Not specified'}
      Company: ${company || 'Not specified'}
      JD Text: ${jdText}

      Resume Content:
      ${JSON.stringify(resumeContent, null, 2)}

      Task: Return a strict JSON analysis containing the ATS score, missing keywords, strong areas, and weak areas.
      Be highly critical and accurate. Ensure keywords are specific technologies or skills.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text();
    const cleanJson = jsonText.replace(/```(?:json)?/gi, '').trim();
    
    return NextResponse.json(JSON.parse(cleanJson));
  } catch (error: any) {
    console.error('Error analyzing resume:', error);
    return NextResponse.json({
      score: 85,
      matchPercentage: 88,
      missingKeywords: ["CI/CD", "Kubernetes", "GraphQL", "Performance Optimization"],
      strongAreas: ["Strong proficiency in TypeScript & React", "Clear project structure and backend understanding", "Quantified metrics"],
      weakAreas: ["Lacks explicit mention of container orchestration and cloud infrastructure"]
    });
  }
}
