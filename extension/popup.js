// popup.js
const daysRange = document.getElementById('daysRange');
const daysVal = document.getElementById('daysVal');
const scanBtn = document.getElementById('scanBtn');
const resultsDiv = document.getElementById('results');
const loader = document.getElementById('loader');
const filterToggle = document.getElementById('filterToggle');

// Update UI text for slider
daysRange.addEventListener('input', (e) => {
    daysVal.innerText = e.target.value;
});

scanBtn.addEventListener('click', () => {
    const days = daysRange.value;
    const showOnlyAcceptance = filterToggle.checked;

    // UI Loading State
    resultsDiv.innerHTML = "";
    loader.style.display = "block";
    scanBtn.disabled = true;

    chrome.runtime.sendMessage({
        action: "scan_emails",
        days: days
    }, (response) => {
        loader.style.display = "none";
        scanBtn.disabled = false;

        if (response && response.emails) {
            let filtered = response.emails;

            // Check if any admissions exist in the full set
            const foundAcceptance = filtered.some(e => e.category === "ADMITTED");

            if (foundAcceptance) {
                triggerConfetti();
            }

            // Apply filter for display
            if (showOnlyAcceptance) {
                filtered = filtered.filter(e => e.category === "ADMITTED");
            }

            if (filtered.length === 0) {
                resultsDiv.innerHTML = `<div style="text-align:center; padding: 20px; color:#64748b; font-size:0.85rem;">
                    No ${showOnlyAcceptance ? 'acceptances' : 'emails'} found in the last ${days} days.
                </div>`;
                return;
            }

            resultsDiv.innerHTML = filtered.map(e => `
                <div style="border-left: 4px solid ${getColor(e.category)}; padding: 12px; margin-bottom: 10px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; border-left-width: 5px; border-left-color: ${getColor(e.category)};">
                    <div style="font-weight: 700; color: #1e293b; font-size: 0.85rem; line-height: 1.4;">${e.subject}</div>
                    <div style="font-size: 0.7rem; color: ${getColor(e.category)}; font-weight: 800; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.05em;">
                        ${e.category} • Score: ${e.score}%
                    </div>
                </div>
            `).join('');
        } else {
            resultsDiv.innerHTML = `<p style="color:#ef4444; font-size:0.8rem; text-align:center;">${response?.status || "Unknown error occurred"}</p>`;
        }
    });
});

function getColor(cat) {
    if (cat === "ADMITTED") return "#FF8C00";
    if (cat === "REJECTION") return "#ef4444";
    return "#94a3b8";
}

function triggerConfetti() {
    if (typeof confetti !== 'function') return; // Safety check

    const duration = 2 * 1000;
    const end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.8 },
            colors: ['#FF8C00', '#FFA500']
        });
        confetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.8 },
            colors: ['#FF8C00', '#ffffff']
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}