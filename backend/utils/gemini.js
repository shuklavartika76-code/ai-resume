require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const { GoogleGenerativeAI } = require('@google/generative-ai');

const initGemini = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenerativeAI(apiKey);
};

const defaultATS = {
    atsScore: 68,
    matchingKeywords: ["React", "JavaScript", "Frontend"],
    missingKeywords: ["Node.js", "System Design", "Testing"],
    improvementTips: [
        "Include more quantifiable metrics in your bullet points (e.g. 'improved speed by 20%').",
        "Add a dedicated 'Skills' section specifically listing Node.js and Testing frameworks.",
        "Ensure your past experience explicitly mentions the target role keywords."
    ]
};

const defaultQuestions = [
    "Tell me about yourself and your background.",
    "Looking at your resume, can you explain the architecture of a recent project you built?",
    "(Mock Tech Question) Can you explain how you manage state and handle performance optimization in your frontend stack?",
    "(Mock Tech Question) How do you approach debugging complex backend or database issues?",
    "What is your approach to testing and ensuring code quality?"
];

// Helper: retry a Gemini API call up to maxRetries times with delay
const callGeminiWithRetry = async (prompt, label, maxRetries = 3) => {
    const ai = initGemini();
    if (!ai) return null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[${label}] Attempt ${attempt}...`);
            const model = ai.getGenerativeModel({ model: "gemini-flash-latest" });
            const result = await model.generateContent(prompt);
            let text = result.response.text().trim();
            if (text.startsWith('```json')) text = text.replace('```json', '').replace('```', '').trim();
            if (text.startsWith('```')) text = text.replace(/```/g, '').trim();

            const parsed = JSON.parse(text);
            console.log(`[${label}] SUCCESS on attempt ${attempt}`);
            return parsed;
        } catch (error) {
            console.error(`[${label}] Attempt ${attempt} FAILED:`, error.message);
            if (attempt < maxRetries) {
                const delay = attempt * 2000;
                console.log(`[${label}] Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    console.error(`[${label}] All ${maxRetries} attempts failed. Using fallback.`);
    return null;
};

const analyzeResume = async (role, resumeText) => {
    const prompt = `Act as an expert Applicant Tracking System (ATS) and Senior Tech Recruiter.
Evaluate the following resume against the target role: "${role}".

Resume Text:
---
${resumeText.substring(0, 3000)}
---

Return ONLY a valid JSON object with no markdown formatting. The JSON must have:
{
  "atsScore": <number between 0 and 100 representing keyword and experience match>,
  "matchingKeywords": ["<keyword 1>", "<keyword 2>"],
  "missingKeywords": ["<keyword 1>", "<keyword 2>"],
  "improvementTips": ["<actionable tip 1>", "<actionable tip 2>"]
}`;

    const result = await callGeminiWithRetry(prompt, "ATS Analysis");
    return result || defaultATS;
};

const generateQuestions = async (role, experience, resumeText) => {
    const prompt = `You are an expert technical interviewer hiring for a ${role} position. 
The candidate has ${experience} experience.
Here is their parsed resume text:
---
${resumeText.substring(0, 3000)}
---
Generate exactly 5 highly-technical, placement-oriented interview questions for this candidate. 
CRITICAL RULES:
1. Look at the specific tech stack (e.g., React, Node, Python, SQL) mentioned in their resume and ask in-depth questions about those specific technologies.
2. Ask about a specific project they listed on their resume.
3. Keep the questions focused on engineering, architecture, and coding principles rather than generic HR questions.

Return ONLY a valid JSON array of strings, no markdown formatting or extra text.
Example format: ["Technical Q1", "Tech Stack Q2", "Project Q3", "Scenario Q4", "System Design Q5"]`;

    const result = await callGeminiWithRetry(prompt, "Question Generation");
    return result || defaultQuestions;
};

const evaluateAnswers = async (role, experience, questions, transcript) => {
    const defaultEval = {
        score: 75,
        strengths: ["Clear communication", "Basic understanding of the role"],
        weaknesses: ["Needs more technical depth", "Elaborate more on past experiences"],
        feedback: questions.map((q, i) => ({
            question: q,
            userAnswer: transcript[i] || "No answer provided.",
            idealAnswer: "A detailed answer covering key technical aspects.",
            feedback: "Fair attempt, but lack of depth.",
            score: 7
        }))
    };

    const prompt = `You are an expert technical interviewer evaluating a candidate for a ${role} position (${experience} level).
Here are the questions asked and the candidate's transcribed answers:
${questions.map((q, i) => `Q${i+1}: ${q}\nCandidate Answer: ${transcript[i] || "No answer provided."}`).join('\n\n')}

Evaluate the candidate's performance. Return ONLY a valid JSON object with the following structure, no markdown formatting:
{
  "score": <overall score from 0 to 100>,
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "feedback": [
    {
      "question": "<The question asked>",
      "userAnswer": "<The candidate's answer>",
      "idealAnswer": "<What a perfect answer would look like>",
      "feedback": "<Specific feedback for this answer>",
      "score": <score out of 10>
    }
  ]
}`;

    const result = await callGeminiWithRetry(prompt, "Answer Evaluation");
    return result || defaultEval;
};

module.exports = { analyzeResume, generateQuestions, evaluateAnswers };
