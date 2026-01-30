// proxy/api/analyze.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { emails } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    const prompt = `Analyze these ${emails.length} job application emails. 
For each, return: ID|CATEGORY|SCORE. 
Categories: ADMITTED, REJECTION, NEUTRAL.
Emails:
${emails.map((e, i) => `ID:${i} | Subj: ${e.subject} | Snippet: ${e.snippet}`).join('\n---\n')}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        const resultText = data.candidates[0].content.parts[0].text;

        res.status(200).json({ resultText });
    } catch (error) {
        res.status(500).json({ error: "AI Proxy Failed" });
    }
}