require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const { GoogleGenerativeAI } = require('@google/generative-ai');

const initGemini = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        console.warn('[Gemini] No valid API key set — using fallback data.');
        return null;
    }
    return new GoogleGenerativeAI(apiKey);
};

const defaultATS = {
    atsScore: 68,
    matchingKeywords: ['React', 'JavaScript', 'Frontend', 'HTML', 'CSS'],
    missingKeywords: ['Node.js', 'System Design', 'Testing', 'TypeScript'],
    improvementTips: [
        "Include quantifiable metrics in your bullet points (e.g. 'improved load time by 30%').",
        "Add a dedicated 'Skills' section listing Node.js, TypeScript and testing frameworks.",
        "Ensure your past experience explicitly mentions the target role keywords.",
        "Tailor your resume summary to match the job description language."
    ]
};

const defaultQuestions = [
    'Tell me about yourself and your background.',
    'Looking at your resume, can you explain the architecture of a recent project you built?',
    'How do you manage state and handle performance optimization in your stack?',
    'How do you approach debugging complex issues in a production application?',
    'What is your approach to testing and ensuring code quality?'
];

// Helper: call Gemini with retry — 2 attempts, fast fallback
const callGeminiWithRetry = async (prompt, label, maxRetries = 2) => {
    const ai = initGemini();
    if (!ai) return null;

    const modelsToTry = ['gemini-1.5-flash', 'gemini-2.0-flash'];

    for (const modelName of modelsToTry) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`[${label}] Trying model=${modelName} attempt=${attempt}...`);
                const model = ai.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                let text = result.response.text().trim();

                // Strip markdown code fences if present
                text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

                const parsed = JSON.parse(text);
                console.log(`[${label}] SUCCESS with model=${modelName} attempt=${attempt}`);
                return parsed;
            } catch (error) {
                console.error(`[${label}] model=${modelName} attempt=${attempt} FAILED:`, error.message);
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
            }
        }
    }

    console.error(`[${label}] All attempts failed — using fallback data.`);
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

    const result = await callGeminiWithRetry(prompt, 'ATS Analysis');
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

Return ONLY a valid JSON array of 5 strings, no markdown formatting or extra text.
Example format: ["Technical Q1", "Tech Stack Q2", "Project Q3", "Scenario Q4", "System Design Q5"]`;

    const result = await callGeminiWithRetry(prompt, 'Question Generation');
    return Array.isArray(result) ? result : defaultQuestions;
};

const evaluateAnswers = async (role, experience, questions, transcript, resumeText = '') => {
    const defaultEval = {
        score: 75,
        strengths: ['Clear communication', 'Basic understanding of the role'],
        weaknesses: ['Needs more technical depth', 'Elaborate more on past experiences'],
        feedback: questions.map((q, i) => ({
            question: q,
            userAnswer: transcript[i] || 'No answer provided.',
            idealAnswer: 'A strong answer would cover the core concept clearly, explain the reasoning behind your approach, mention relevant trade-offs, and ideally back it up with a concrete example from your experience or a real-world scenario.',
            feedback: 'Fair attempt, but could benefit from more technical depth and concrete examples.',
            score: 7
        }))
    };

    const resumeContext = resumeText
        ? `Candidate's Resume (for context):\n---\n${resumeText.substring(0, 2000)}\n---\n`
        : '';

    const prompt = `You are a Senior Engineering Manager and expert technical interviewer evaluating a candidate for a ${role} position (${experience} level).
${resumeContext}
Here are the interview questions and the candidate's transcribed answers:
${questions.map((q, i) => `Q${i + 1}: ${q}\nCandidate Answer: ${transcript[i] || 'No answer provided.'}`).join('\n\n')}

For EACH question, generate a comprehensive "idealAnswer" that:
1. Directly answers the question with technical depth appropriate for a ${experience} ${role} candidate.
2. Mentions specific technologies, frameworks, or concepts relevant to the question and the candidate's resume stack.
3. Includes concrete examples, code patterns, or real-world scenarios where applicable.
4. Covers key trade-offs, edge cases, or best practices that a strong candidate would mention.
5. Is 3-5 sentences minimum — detailed enough to be genuinely educational and actionable.

Return ONLY a valid JSON object with no markdown formatting:
{
  "score": <overall score from 0 to 100>,
  "strengths": ["<specific strength observed>", "<specific strength observed>"],
  "weaknesses": ["<specific area needing improvement>", "<specific area needing improvement>"],
  "feedback": [
    {
      "question": "<The exact question asked>",
      "userAnswer": "<The candidate's verbatim answer>",
      "idealAnswer": "<A thorough, technically detailed ideal answer — minimum 3-5 sentences covering the concept, best practices, trade-offs, and a concrete example>",
      "feedback": "<Specific, constructive feedback comparing the candidate's answer to the ideal — mention what was good and what was missing>",
      "score": <score out of 10>
    }
  ]
}`;

    const result = await callGeminiWithRetry(prompt, 'Answer Evaluation');
    return result || defaultEval;
};

module.exports = { analyzeResume, generateQuestions, evaluateAnswers };
