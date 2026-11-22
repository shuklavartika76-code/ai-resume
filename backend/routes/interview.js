const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { analyzeResume, generateQuestions, evaluateAnswers } = require('../utils/gemini');
const { saveInterview, getInterview, updateInterview } = require('../utils/db');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No resume file uploaded.' });
        }
        
        const pdfData = await pdfParse(req.file.buffer);
        const resumeText = pdfData.text;
        
        res.json({ message: 'Resume parsed successfully', resumeText });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to parse resume.' });
    }
});

router.post('/ats', async (req, res) => {
    try {
        const { role, resumeText } = req.body;
        if (!role || !resumeText) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }

        const atsReport = await analyzeResume(role, resumeText);
        res.json(atsReport);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to analyze resume.' });
    }
});

router.post('/generate', async (req, res) => {
    try {
        const { role, experience, resumeText } = req.body;
        if (!role || !experience || !resumeText) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }

        const questions = await generateQuestions(role, experience, resumeText);
        
        const interview = await saveInterview({
            role,
            experience,
            resumeText,
            questions,
            status: 'in-progress'
        });

        res.json({ 
            interviewId: interview._id,
            questions
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate interview questions.' });
    }
});

router.post('/submit', async (req, res) => {
    try {
        const { interviewId, transcript } = req.body;
        if (!interviewId || !transcript) {
            return res.status(400).json({ error: 'Missing interview ID or transcript.' });
        }

        const interview = await getInterview(interviewId);
        if (!interview) {
            return res.status(404).json({ error: 'Interview not found.' });
        }

        const evaluation = await evaluateAnswers(
            interview.role, 
            interview.experience, 
            interview.questions, 
            transcript,
            interview.resumeText || ''
        );

        const updated = await updateInterview(interviewId, {
            transcript,
            evaluation,
            score: evaluation.score,
            strengths: evaluation.strengths,
            weaknesses: evaluation.weaknesses,
            status: 'completed'
        });

        res.json({ message: 'Interview evaluated successfully', report: updated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to evaluate interview.' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const interview = await getInterview(req.params.id);
        if (!interview) {
            return res.status(404).json({ error: 'Interview not found.' });
        }
        res.json(interview);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch interview.' });
    }
});

module.exports = router;
