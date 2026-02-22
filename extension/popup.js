const daysRange = document.getElementById('daysRange');
const daysVal = document.getElementById('daysVal');
const scanBtn = document.getElementById('scanBtn');
const resultsDiv = document.getElementById('results');
const loader = document.getElementById('loader');
const filterToggle = document.getElementById('filterToggle');

daysRange.addEventListener('input', (e) => {
    daysVal.innerText = e.target.value;
});

scanBtn.addEventListener('click', async () => {
    const days = daysRange.value;
    const showOnlyAcceptance = filterToggle.checked;
    const mode = document.querySelector('input[name="scanMode"]:checked').value;

    resultsDiv.innerHTML = "";
    loader.style.display = "block";
    scanBtn.disabled = true;

    // --- Caching Logic: Check for existing results to save quota ---
    const cacheKey = `dmuc_cache_${mode}`;
    const cachedData = await chrome.storage.local.get([cacheKey]);

    if (cachedData[cacheKey] && (Date.now() - cachedData[cacheKey].timestamp < 30 * 60000)) {
        console.log("Loading results from cache...");
        renderResults(cachedData[cacheKey].emails, showOnlyAcceptance);
        loader.style.display = "none";
        scanBtn.disabled = false;
        return;
    }

    chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError || !token) {
            console.error("Auth failed:", chrome.runtime.lastError);
            resultsDiv.innerHTML = `<p style="color:#ef4444; font-size:0.8rem; text-align:center;">Sign-in required to scan emails.</p>`;
            loader.style.display = "none";
            scanBtn.disabled = false;
            return;
        }

        chrome.runtime.sendMessage({
            action: "scan_emails",
            days: days,
            mode: mode
        }, (response) => {
            loader.style.display = "none";
            scanBtn.disabled = false;

            if (response && response.emails) {
                chrome.storage.local.set({
                    [cacheKey]: {
                        emails: response.emails,
                        timestamp: Date.now()
                    }
                });
                renderResults(response.emails, showOnlyAcceptance);
            } else {
                resultsDiv.innerHTML = `<p style="color:#ef4444; font-size:0.8rem; text-align:center;">${response?.status || "Scan failed. Please try again."}</p>`;
            }
        });
    });
});

// Modularized render function to maintain exactly the same styles and logic
function renderResults(emails, showOnlyAcceptance) {
    let filtered = emails.filter(e => e.score > 0);

    const foundAcceptance = filtered.some(e => e.category === "ADMITTED");
    if (foundAcceptance) triggerConfetti();

    if (showOnlyAcceptance) {
        filtered = filtered.filter(e => e.category === "ADMITTED");
    }

    if (filtered.length === 0) {
        resultsDiv.innerHTML = `<div style="text-align:center; padding: 20px; color:#64748b; font-size:0.85rem;">No accepted emails found, but don't worry - you're still in the running!</div>`;
        return;
    }

    resultsDiv.innerHTML = filtered.map(e => `
        <div class="result-card" style="border-left-color: ${getColor(e.category)};">
            <span class="tooltip">${e.reason || 'No specific reason provided.'}</span>
            <div style="font-weight: 700; color: #1e293b; font-size: 0.85rem;">${e.subject}</div>
            <div style="font-size: 0.7rem; color: ${getColor(e.category)}; font-weight: 800; margin-top: 6px; text-transform: uppercase;">
                ${e.category} • Score: ${e.score}%
            </div>
            <a href="https://mail.google.com/mail/u/0/#inbox/${e.threadId}" target="_blank" class="view-btn">
                View Email ↗
            </a>
        </div>
    `).join('');
}

function getColor(cat) {
    if (cat === "ADMITTED") return "#FF8C00";
    if (cat === "REJECTION") return "#ef4444";
    return "#94a3b8";
}

function triggerConfetti() {
    if (typeof confetti !== 'function') return;
    const end = Date.now() + 2000;
    (function frame() {
        confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0, y: 0.8 }, colors: ['#FF8C00', '#FFA500'] });
        confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1, y: 0.8 }, colors: ['#FF8C00', '#ffffff'] });
        if (Date.now() < end) requestAnimationFrame(frame);
    }());
}