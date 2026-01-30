// extension/background.js
const PROXY_URL = "https://dmuc-dont-miss-ur-chance.vercel.app/api/analyze";

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

        // 2. Call your Proxy
        const proxyRes = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emails: emailDetails })
        });

        const { resultText } = await proxyRes.json();

        // 3. Parse results
        const finalResults = emailDetails.map((email, i) => {
            const match = resultText.match(new RegExp(`${i}\\|(ADMITTED|REJECTION|NEUTRAL)\\|(\\d+)`, 'i'));
            return {
                subject: email.subject,
                category: match ? match[1].toUpperCase() : "NEUTRAL",
                score: match ? parseInt(match[2]) : 0
            };
        });

        sendResponse({ emails: finalResults });
    } catch (err) {
        sendResponse({ status: "Error: " + err.message });
    }
}