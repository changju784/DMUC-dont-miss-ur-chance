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
- ADMITTED (90-100): ANY email indicating a positive step forward. This includes:
  1. Final Job Offers.
  2. Interview invitations ("Schedule a call", "Technical interview", "Next steps").
  3. Recruiters saying "Move you forward".
- REJECTION (0-20): "Not moving forward", "Decided to pass", "Unfortunately", "Decided to move other candidates".
- NEUTRAL (40-60): General status updates with no action required, or automated "Applied" receipts.
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