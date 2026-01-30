// proxy/utils/prompts.js

const SCHOOL_RULES = `
- Focus: University Admissions.
- ADMITTED (90-100): Direct acceptance, "Congratulations", "Welcome to the class of", or enrollment deposit instructions.
- REJECTION (0-20): "Unable to offer admission", "Regret to inform", or "We cannot offer you a place".
- NEUTRAL (40-60): Waitlist offers, interview invites, requests for transcripts, or generic "Status Updated" portal alerts.
`;

const WORK_RULES = `
- Focus: Job Applications & Recruiting.
- ADMITTED (90-100): Job offers, "We'd like to offer you the position", or signing documents/onboarding.
- REJECTION (0-20): "Decided to move forward with other candidates", "Will not be proceeding", or "Thank you for your interest".
- NEUTRAL (40-60): Interview requests, "We'd like to schedule a call", background check starts, or technical assessment invitations.
`;

export function getAnalysisPrompt(emails, mode) {
    const rules = mode === 'school' ? SCHOOL_RULES : WORK_RULES;
    const context = mode === 'school' ? 'university admission' : 'job application';

    return `
    You are an expert ${context} analyzer. 
    Analyze the provided ${emails.length} emails and categorize them strictly according to these rules:
    ${rules}

    Return a JSON array of objects. Each object must have:
    "id": (the matching ID provided),
    "category": ("ADMITTED", "REJECTION", or "NEUTRAL"),
    "score": (a number between 0-100 based on the confidence of the category),
    "reason": (a short 1-sentence explanation of why it was categorized this way)

    Emails to analyze:
    ${emails.map((e) => `ID:${e.id} | Subj: ${e.subject} | Snippet: ${e.snippet}`).join('\n')}
    `;
}