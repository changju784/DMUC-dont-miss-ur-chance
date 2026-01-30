// proxy/api/analyze.js
import { getAnalysisPrompt } from '../utils/prompts';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { emails, mode } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!emails || !Array.isArray(emails)) {
        return res.status(400).json({ error: "No emails provided" });
    }

    const prompt = getAnalysisPrompt(emails, mode || 'work');

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        const data = await response.json();

        if (!data.candidates || !data.candidates[0].content) {
            console.error("AI returned no content. Feedback:", data.promptFeedback);
            return res.status(200).json({ results: [] });
        }

        const resultText = data.candidates[0].content.parts[0].text;
        const aiResults = JSON.parse(resultText);

        // Ensure the response is always wrapped in a results key for the background.js logic
        res.status(200).json({ results: aiResults });
    } catch (error) {
        console.error("PROXY ERROR:", error);
        res.status(500).json({ error: error.message });
    }
}