// proxy/api/analyze.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { emails } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    const prompt = `Analyze these ${emails.length} job application emails. 
Return a JSON array of objects. Each object must have:
"id" (the number provided), 
"category" (must be "ADMITTED", "REJECTION", or "NEUTRAL"), 
"score" (0-100).
Emails:
${emails.map((e, i) => `ID:${i} | Subj: ${e.subject} | Snippet: ${e.snippet}`).join('\n')}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json" // CRITICAL: Forces JSON output
                }
            })
        });

        const data = await response.json();

        // 2. DEBUG LOGGING: This will appear in your Vercel Logs tab
        console.log("--- RAW AI DATA START ---");
        console.log(JSON.stringify(data, null, 2));
        console.log("--- RAW AI DATA END ---");

        if (!data.candidates || !data.candidates[0].content) {
            console.error("AI returned no content. Possible safety block:", data.promptFeedback);
            return res.status(200).json({ results: [] });
        }

        const resultText = data.candidates[0].content.parts[0].text;
        const aiResults = JSON.parse(resultText); // Parse the AI's JSON string

        res.status(200).json({ results: aiResults });
    } catch (error) {
        console.error("PROXY ERROR:", error);
        res.status(500).json({ error: error.message });
    }
}