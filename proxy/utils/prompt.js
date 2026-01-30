// proxy/utils/prompts.js

const SCHOOL_RULES = `
- Focus: University Admissions.
- ADMITTED (90-100): Direct acceptance, "Congratulations", "Welcome", "Enrollment next steps", or "Interview Invitation" (as this is a critical gate).
- REJECTION (0-20): "Unable to offer admission", "Regret to inform", or "Not moving forward".
- NEUTRAL (40-60): Waitlist offers, requests for transcripts, or "Status Updated" portal alerts.
- IGNORE: Newsletters, campus tour ads, general marketing, or student life updates. Categorize as NEUTRAL with score 0.
`;

const WORK_RULES = `
- Focus: Job Applications & Recruiting.
- ADMITTED (90-100): Job offers, "Congratulations", "Move you forward", OR ANY human recruiter outreach ("Would you like to chat?", "Schedule a call", "Interview request"). 
- REJECTION (0-20): "Decided to move forward with others", "Will not be proceeding", or "Unfortunately...".
- NEUTRAL (40-60): Automated "Application Received" (no action needed yet) or technical assessment links.
- IGNORE: LinkedIn job alerts, marketing spam, company newsletters, or payroll/benefits spam. Categorize as NEUTRAL with score 0.
`;

export function getAnalysisPrompt(emails, mode) {
    const rules = mode === 'school' ? SCHOOL_RULES : WORK_RULES;
    const context = mode === 'school' ? 'university admission' : 'job application';

    return `
    You are an expert ${context} analyzer. Your goal is to find OPPORTUNITIES.
    Analyze the provided ${emails.length} emails and categorize them.
    
    CRITICAL LOGIC: 
    1. If the email is a human recruiter asking to talk or an interview invite, mark as ADMITTED.
    2. If the email is clearly noise (marketing, alerts, mass newsletters), mark as NEUTRAL with score 0.
    
    Rules:
    ${rules}

    Return a JSON array of objects. Each object must have:
    "id": (the matching ID provided),
    "category": ("ADMITTED", "REJECTION", or "NEUTRAL"),
    "score": (a number between 0-100),
    "reason": (1-sentence explanation)

    Emails to analyze:
    ${emails.map((e) => `ID:${e.id} | Subj: ${e.subject} | Snippet: ${e.snippet}`).join('\n')}
    `;
}