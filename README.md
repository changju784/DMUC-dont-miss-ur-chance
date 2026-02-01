# DMUC - Don't Miss Ur Chance

**DMUC** is an AI-powered Chrome Extension designed to scan your Gmail for school or job application updates. It uses a serverless Vercel backend to securely analyze email snippets using **Google Gemini 2.5 Flash**, categorizing them so you never miss a "Congratulations" or a critical follow-up.
<img width="1200" height="700" alt="image" src="https://github.com/user-attachments/assets/9838f97a-eaf5-44b4-b18a-ea9c01a532b8" />

---

## System Architecture

The project follows a secure 3-tier architecture to protect API keys and ensure high performance.

### Core Flow:
1.  **Frontend (Extension):** Fetches raw email data from the **Gmail API** via OAuth2.
2.  **Middleware (Vercel):** Acts as a secure proxy to hide the Gemini API Key.
3.  **AI Layer (Gemini):** Processes snippets and returns structured analysis (Category, Score, Reason).

---

## Project Structure

```text
├── extension/             # Chrome Extension files
│   ├── manifest.json      # Extension permissions & OAuth2 config
│   ├── background.js      # Service worker handling the async bridge
│   ├── popup.html/js      # User interface and results display
│   └── icons/             # Asset files
└── api/                   # Serverless Backend (Vercel)
    └── analyze.js         # Gemini API integration & prompt logic
