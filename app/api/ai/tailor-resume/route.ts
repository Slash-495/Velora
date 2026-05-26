import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { resumeContent, jdText, company, role } = await request.json();

    if (!resumeContent || !jdText) {
      return NextResponse.json({ error: 'Missing resume content or job description' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest', // Downgraded to flash because user API key has 0 quota for pro models
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            tailoredContent: {
              type: SchemaType.OBJECT,
              description: "The complete tailored resume content object matching the input structure exactly, but with rewritten descriptions and summary.",
            },
            changesMade: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
              description: "A summary of the 3-5 major changes made to tailor the resume to the JD.",
            }
          },
          required: ["tailoredContent", "changesMade"]
        }
      }
    });

    const prompt = `
      You are an expert Resume Writer and ATS Optimizer.
      Your task is to tailor the provided Resume Content specifically for the given Job Description.
      
      Job Description Context:
      Role: ${role || 'Not specified'}
      Company: ${company || 'Not specified'}
      JD Text: ${jdText}

      Original Resume Content:
      ${JSON.stringify(resumeContent, null, 2)}

      Instructions:
      1. Rewrite the "summary" to align strongly with the JD requirements.
      2. Rewrite the "description" bullet points in the "experience" array. Inject relevant keywords from the JD naturally. Ensure bullet points are impactful, measurable, and action-oriented.
      3. Do NOT invent fake experience, degrees, or skills. Only reframe existing experience to highlight relevance.
      4. Return the EXACT SAME JSON structure for 'tailoredContent' as the original 'ResumeContent', just with updated text fields.
      
      Output strict JSON containing 'tailoredContent' and 'changesMade'.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text();
    const cleanJson = jsonText.replace(/```(?:json)?/gi, '').trim();
    
    return NextResponse.json(JSON.parse(cleanJson));
  } catch (error) {
    console.error('Error tailoring resume:', error);
    return NextResponse.json({ error: 'Failed to tailor resume' }, { status: 500 });
  }
}
