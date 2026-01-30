// extension/background.js
const PROXY_URL = "https://dmuc-dont-miss-ur-chance.vercel.app/api/analyze";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scan_emails") {
        handleFullScan(request.days, sendResponse);
        return true; // Keeps the message channel open for async response
    }
});

/**
 * Main orchestrator for the scan process
 */
async function handleFullScan(days, sendResponse) {
    try {
        // 1. Get raw email data from Gmail
        const emailData = await fetchEmailDetails(days);

        if (!emailData || emailData.length === 0) {
            sendResponse({ emails: [], status: "No emails found in this period." });
            return;
        }

        // 2. Send to AI for analysis
        const proxyRes = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emails: emailData })
        });

        if (!proxyRes.ok) throw new Error("AI analysis returned an error.");

        const { results } = await proxyRes.json();
        const aiResults = results || [];

        // 3. Merge AI scores with email subjects
        const finalResults = emailData.map((email) => {
            const aiData = aiResults.find(r => r.id === email.id);
            return {
                subject: email.subject,
                category: aiData ? aiData.category : "NEUTRAL",
                score: aiData ? aiData.score : 0
            };
        });

        sendResponse({ emails: finalResults });

    } catch (err) {
        console.error("Scan Error:", err);
        sendResponse({ status: `Error: ${err.message}` });
    }
}

/**
 * Logic-only function to interface with Gmail API
 */
async function fetchEmailDetails(days) {
    const { token } = await chrome.identity.getAuthToken({ interactive: true });

    // Calculate timeframe
    const secondsInDay = 24 * 60 * 60;
    const afterTimestamp = Math.floor(Date.now() / 1000) - (days * secondsInDay);
    const query = `after:${afterTimestamp}`;

    // Fetch message list
    const listRes = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!listRes.ok) throw new Error("Failed to fetch message list from Gmail.");

    const listData = await listRes.json();
    if (!listData.messages) return [];

    // Fetch individual snippets
    return Promise.all(listData.messages.map(async (msg) => {
        const detailRes = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!detailRes.ok) return { id: msg.id, subject: "Error loading", snippet: "" };

        const details = await detailRes.json();
        const subject = details.payload.headers.find(h => h.name === 'Subject')?.value || "No Subject";

        return {
            id: msg.id,
            subject: subject,
            snippet: details.snippet || ""
        };
    }));
}