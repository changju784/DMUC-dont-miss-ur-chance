const PROXY_URL = "https://dmuc-dont-miss-ur-chance.vercel.app/api/analyze";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scan_emails") {
        handleFullScan(request.days, request.mode, sendResponse);
        return true;
    }
});

async function handleFullScan(days, mode, sendResponse) {
    try {
        const emailData = await fetchEmailDetails(days);
        if (!emailData.length) return sendResponse({ emails: [] });

        const proxyRes = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emails: emailData, mode: mode })
        });

        const { results } = await proxyRes.json();
        const finalResults = emailData.map(email => {
            const ai = (results || []).find(r => r.id === email.id);
            return {
                subject: email.subject,
                category: ai ? ai.category : "NEUTRAL",
                score: ai ? ai.score : 0
            };
        });
        sendResponse({ emails: finalResults });
    } catch (err) {
        sendResponse({ status: err.message });
    }
}

async function fetchEmailDetails(days) {
    const { token } = await chrome.identity.getAuthToken({ interactive: true });
    const after = Math.floor(Date.now() / 1000) - (days * 86400);
    const res = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages?q=after:${after}&maxResults=15`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.messages) return [];

    return Promise.all(data.messages.map(async (msg) => {
        const dRes = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const d = await dRes.json();
        return {
            id: msg.id,
            subject: d.payload.headers.find(h => h.name === 'Subject')?.value || "No Subject",
            snippet: d.snippet || ""
        };
    }));
}