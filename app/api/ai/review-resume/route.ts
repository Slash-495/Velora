import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { resumeContent, targetRole } = await request.json();

    if (!resumeContent || !targetRole) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
      You are an elite Silicon Valley Technical Recruiter and Career Coach.
      Your task is to provide a brutal, actionable, and deeply analytical review of this resume for the target role of "${targetRole}".

      Candidate Resume Data:
      ${JSON.stringify(resumeContent, null, 2)}

      Analyze the resume against top-tier industry standards and output STRICT JSON in the exact format below, with NO markdown blocks around it and NO comments:
      {
        "scores": {
          "overall": 85,
          "ats": 90,
          "recruiter": 75,
          "technical": 80,
          "readability": 95
        },
        "careerInsights": "A 2-3 sentence overarching strategic analysis of their positioning for this role.",
        "sectionAnalysis": [
          {
            "section": "Experience",
            "strengths": ["Quantified metrics in most bullet points.", "Clear progression."],
            "weaknesses": ["Lacks mention of system architecture decisions.", "Too many weak action verbs (e.g., 'Helped', 'Worked on')."],
            "recommendations": ["Replace 'Helped' with 'Engineered' or 'Architected'.", "Add 1 bullet on scalability."]
          },
          {
            "section": "Projects",
            "strengths": ["..."],
            "weaknesses": ["..."],
            "recommendations": ["..."]
          }
        ],
        "skillGaps": [
          {
            "skill": "Docker/Kubernetes",
            "context": "Highly expected for Senior Backend roles, but entirely missing."
          }
        ],
        "roadmap": {
          "thisWeek": ["Rewrite the 3 weakest bullet points.", "Remove obsolete skills (HTML/CSS)."],
          "thisMonth": ["Deploy 'Duffy' project to AWS to prove cloud knowledge."],
          "nextQuarter": ["Prepare for system design interviews.", "Contribute to 1 open source project."]
        }
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text();
    const cleanJson = jsonText.replace(/```(?:json)?/gi, '').trim();
    
    return NextResponse.json(JSON.parse(cleanJson));
  } catch (error: any) {
    console.error('Error reviewing resume:', error);
    return NextResponse.json({ error: error.message || 'Failed to review resume' }, { status: 500 });
  }
}
