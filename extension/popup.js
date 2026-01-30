// popup.js
document.getElementById('scanBtn').addEventListener('click', () => {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = "<i>Agentic AI is analyzing...</i>";

    chrome.runtime.sendMessage({ action: "scan_emails" }, (response) => {
        if (response.emails) {
            resultsDiv.innerHTML = response.emails.map(e => `
        <div style="border-left: 5px solid ${getColor(e.category)}; padding: 10px; margin: 8px 0; background: #fdfdfd; border-radius: 4px; box-shadow: 1px 1px 3px #eee;">
          <div style="font-weight: bold; color: #333;">${e.subject}</div>
          <div style="font-size: 0.85em; color: ${getColor(e.category)}; font-weight: bold;">
            ${e.category} — Score: ${e.score}
          </div>
        </div>
      `).join('');
        } else {
            resultsDiv.innerText = response.status;
        }
    });
});

function getColor(cat) {
    if (cat === "ADMITTED") return "#2e7d32"; // Green
    if (cat === "REJECTION") return "#c62828"; // Red
    return "#f9a825"; // Orange/Yellow
}