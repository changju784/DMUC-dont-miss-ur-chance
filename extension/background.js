// background.js
const PROXY_URL = "https://dmuc-dont-miss-ur-chance.vercel.app/api/analyze";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scan_emails") {
        runSecureScan(request.days, sendResponse);
        return true;
    }
});

async function runSecureScan(days, sendResponse) {
    try {
        const { token } = await chrome.identity.getAuthToken({ interactive: true });

        // Calculate the Gmail Query: e.g., "after:2024/01/20"
        const secondsInDay = 24 * 60 * 60;
        const afterTimestamp = Math.floor(Date.now() / 1000) - (days * secondsInDay);
        const query = `after:${afterTimestamp}`;

        // 1. Fetch from Gmail with date filter
        const listRes = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=20`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const listData = await listRes.json();

        if (!listData.messages) {
            sendResponse({ emails: [] });
            return;
        }

        const emailDetails = await Promise.all(listData.messages.map(async (msg) => {
            const detailRes = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const details = await detailRes.json();
            return {
                id: msg.id,
                subject: details.payload.headers.find(h => h.name === 'Subject')?.value || "No Subject",
                snippet: details.snippet || ""
            };
        }));

        // 2. Call your Vercel Backend
        const proxyRes = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emails: emailDetails })
        });

        const { results } = await proxyRes.json();

        // 3. Map AI results back
        const finalResults = emailDetails.map((email, i) => {
            const aiData = results.find(r => r.id === email.id || r.id === i);
            return {
                subject: email.subject,
                category: aiData ? aiData.category : "NEUTRAL",
                score: aiData ? aiData.score : 0
            };
        });

        sendResponse({ emails: finalResults });
    } catch (err) {
        console.error(err);
        sendResponse({ status: "Error: " + err.message });
    }
}