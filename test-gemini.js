const { GoogleGenerativeAI } = require('@google/generative-ai');

// We need an API key to test. We can pull from .env.local if needed, but I'll try without or require dotenv.

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function test() {
  try {
    console.log("Testing Gemini API...");
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const resumeContent = {
      personalInfo: { fullName: "Test User", summary: "Old summary" },
      experience: [{ company: "Old Corp", role: "Dev", description: "Did stuff" }]
    };

    const prompt = `
      You are an expert Resume Writer and ATS Optimizer.
      Your task is to tailor the provided Resume Content specifically for the given Job Description.
      
      Job Description Context:
      Role: Developer
      Company: Tech Co
      JD Text: We need a React dev.

      Original Resume Content:
      ${JSON.stringify(resumeContent, null, 2)}

      Instructions:
      1. Rewrite the "summary" string inside personalInfo to align strongly with the JD requirements.
      2. Rewrite the "description" bullet points in the "experience" array. Inject relevant keywords from the JD naturally. Ensure bullet points are impactful, measurable, and action-oriented.
      3. Do NOT invent fake experience, degrees, or skills. Only reframe existing experience to highlight relevance.
      4. Return the EXACT SAME JSON structure for 'tailoredContent' as the original 'ResumeContent', containing the updated 'personalInfo' and 'experience' arrays.
      
      Output strict JSON containing 'tailoredContent' and 'changesMade'.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log("Success! Response text:");
    console.log(response.text());
  } catch (error) {
    console.error("Failed!", error);
  }
}

test();
