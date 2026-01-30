// proxy/api/analyze.js
import { getAnalysisPrompt } from '../utils/prompt.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { emails, mode } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!emails || !Array.isArray(emails)) {
        return res.status(400).json({ error: "No emails provided" });
    }

    console.log("--- DEBUG: ANALYZER INPUT START ---");
    console.log(`Mode: ${mode}`);
    console.log(`Emails Received: ${emails?.length}`);
    console.log(JSON.stringify(emails, null, 2));
    console.log("--- DEBUG: ANALYZER INPUT END ---");

    const systemInstruction = `You are a specialized ${mode === 'school' ? 'Admissions' : 'Recruitment'} assistant. 
    Your goal is to detect opportunities and return ONLY valid JSON. 
    Categorize interview invites or "move forward" status as ADMITTED.`;

    const userPrompt = getAnalysisPrompt(emails, mode || 'work');

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemInstruction }] },
                contents: [{ role: "user", parts: [{ text: userPrompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.1
                }
            })
        });

        const data = await response.json();

        console.log("--- DEBUG: RAW AI RESPONSE START ---");
        console.log(JSON.stringify(data, null, 2));
        console.log("--- DEBUG: RAW AI RESPONSE END ---");

        if (!data.candidates || !data.candidates[0].content) {
            console.error("AI returned no content. Feedback:", data.promptFeedback);
            return res.status(200).json({ results: [] });
        }

        const resultText = data.candidates[0].content.parts[0].text;
        const aiResults = JSON.parse(resultText);

        res.status(200).json({ results: aiResults });
    } catch (error) {
        console.error("PROXY ERROR:", error);
        res.status(500).json({ error: error.message });
    }
}