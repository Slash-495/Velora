import { GoogleGenerativeAI } from '@google/generative-ai';
import { callWithRetry } from '@/lib/ai-retry-cache';
import {
  apiError,
  apiSuccess,
  enforceRateLimit,
  handleAIError,
  INPUT_LIMITS,
  requireUser,
  validateStringLength,
} from '@/lib/api-guard';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  const { user, supabase, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const rateLimitResponse = await enforceRateLimit(supabase, user.id, 'parse-resume');
  if (rateLimitResponse) return rateLimitResponse;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return apiError('BAD_REQUEST', 'Invalid JSON request body.', 400);
  }

  const { rawText, base64Data, mimeType } = body ?? {};

  if (!rawText && !base64Data) {
    return apiError('BAD_REQUEST', 'Missing resume text or file data.', 400);
  }

  const validationError =
    validateStringLength(rawText, 'rawText', INPUT_LIMITS.MAX_JSON_CHARS) ||
    validateStringLength(base64Data, 'base64Data', INPUT_LIMITS.MAX_BASE64_CHARS) ||
    validateStringLength(mimeType, 'mimeType', INPUT_LIMITS.MAX_SHORT_TEXT_CHARS);
  if (validationError) return validationError;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      }
    });

    const promptText = `
      You are an elite AI Resume Parser and Technical Recruiter.
      Extract all details from the provided candidate resume and output a STRICT JSON object with this exact schema:

      {
        "personalInfo": {
          "fullName": "Candidate Full Name",
          "email": "email@domain.com",
          "phone": "(555) 000-0000",
          "location": "City, State",
          "website": "portfolio link",
          "linkedin": "linkedin link",
          "github": "github link",
          "summary": "Professional summary of candidate"
        },
        "experience": [
          {
            "id": "exp-1",
            "company": "Company Name",
            "role": "Job Title",
            "location": "Location / Remote",
            "startDate": "Start Date",
            "endDate": "End Date or Present",
            "current": true,
            "description": "Bullet points of key accomplishments"
          }
        ],
        "education": [
          {
            "id": "edu-1",
            "school": "University Name",
            "degree": "Degree",
            "field": "Field of Study",
            "startDate": "2018",
            "endDate": "2022",
            "gpa": ""
          }
        ],
        "projects": [
          {
            "id": "proj-1",
            "name": "Project Name",
            "description": "Description of project",
            "techStack": "Technologies used",
            "link": "Project URL"
          }
        ],
        "skills": [
          {
            "id": "skill-1",
            "category": "Languages & Frameworks",
            "items": "React, TypeScript, Node.js, Python"
          }
        ]
      }

      Rules:
      1. Extract candidate's REAL name, email, phone, location, links, and summary accurately from the document.
      2. Extract ALL work experience entries with exact company names, roles, dates, and bullet points.
      3. Extract ALL education entries and technical skills.
      4. DO NOT use generic placeholder text. Preserve actual candidate data.
    `;

    const contents: any[] = [];
    if (base64Data) {
      contents.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType || "application/pdf"
        }
      });
    }

    if (rawText && typeof rawText === 'string' && !rawText.includes('/FlateDecode') && !rawText.includes('/Type /XRef')) {
      contents.push(`Candidate Resume Text:\n${rawText.substring(0, 10000)}`);
    }

    contents.push(promptText);

    const parsedContent = await callWithRetry(async () => {
      const result = await model.generateContent(contents);
      const text = (await result.response).text().trim();
      const cleanJson = text.replace(/```(?:json)?/gi, '').trim();
      return JSON.parse(cleanJson);
    }, { maxRetries: 3, initialDelayMs: 800 });

    const fallbackInfo = parsedContent.personalInfo || {};
    const finalContent = {
      personalInfo: {
        fullName: fallbackInfo.fullName || "Candidate Resume",
        email: fallbackInfo.email || "",
        phone: fallbackInfo.phone || "",
        location: fallbackInfo.location || "",
        website: fallbackInfo.website || "",
        linkedin: fallbackInfo.linkedin || "",
        github: fallbackInfo.github || "",
        summary: fallbackInfo.summary || "Professional candidate resume content."
      },
      experience: Array.isArray(parsedContent.experience) && parsedContent.experience.length > 0 
        ? parsedContent.experience.map((e: any, i: number) => ({ ...e, id: e.id || `exp-imp-${Date.now()}-${i}` }))
        : [{ id: `exp-imp-${Date.now()}-0`, company: "Professional Experience", role: "Candidate Role", location: "", startDate: "", endDate: "Present", current: true, description: "Candidate experience history imported from resume." }],
      education: Array.isArray(parsedContent.education) && parsedContent.education.length > 0
        ? parsedContent.education.map((ed: any, i: number) => ({ ...ed, id: ed.id || `edu-imp-${Date.now()}-${i}` }))
        : [{ id: `edu-imp-${Date.now()}-0`, school: "University", degree: "Degree", field: "", startDate: "", endDate: "", gpa: "" }],
      projects: Array.isArray(parsedContent.projects)
        ? parsedContent.projects.map((p: any, i: number) => ({ ...p, id: p.id || `proj-imp-${Date.now()}-${i}` }))
        : [],
      skills: Array.isArray(parsedContent.skills) && parsedContent.skills.length > 0
        ? parsedContent.skills.map((s: any, i: number) => ({ ...s, id: s.id || `skill-imp-${Date.now()}-${i}` }))
        : [{ id: `skill-imp-${Date.now()}-0`, category: "Core Skills", items: "Technical Skills, Communication, Problem Solving" }]
    };

    return apiSuccess({ content: finalContent });
  } catch (error: any) {
    return handleAIError(error, 'parse resume');
  }
}
