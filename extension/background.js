// extension/background.js
const PROXY_URL = "https://dmuc-dont-miss-ur-chance.vercel.app/api/analyze";

chrome.identity.clearAllCachedAuthTokens();
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scan_emails") {
        runSecureScan(sendResponse);
        return true;
    }
});

async function runSecureScan(sendResponse) {
    try {
        const { token } = await chrome.identity.getAuthToken({ interactive: true });

        // 1. Fetch from Gmail
        const listRes = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=15', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const listData = await listRes.json();

        const emailDetails = await Promise.all(listData.messages.map(async (msg) => {
            const detailRes = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const details = await detailRes.json();
            return {
                subject: details.payload.headers.find(h => h.name === 'Subject')?.value || "",
                snippet: details.snippet || ""
            };
        }));

        const proxyRes = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emails: emailDetails })
        });

        const { results } = await proxyRes.json(); // "results" is now a clean array from the AI

        // Map the AI results back to the original email list
        const finalResults = emailDetails.map((email, i) => {
            // Find the AI's analysis for this specific ID
            const aiData = results.find(r => r.id === i);

            return {
                subject: email.subject,
                category: aiData ? aiData.category : "NEUTRAL",
                score: aiData ? aiData.score : 0
            };
        });

        sendResponse({ emails: finalResults });
    } catch (err) {
        sendResponse({ status: "Error: " + err.message });
    }
}