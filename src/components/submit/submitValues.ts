/** What the person has typed on SCR-10 — the single source both the fields and the preview read. */
export type SubmitValues = { category: string; question: string; answer: string; codeExample: string };

export const emptySubmitValues: SubmitValues = { category: "", question: "", answer: "", codeExample: "" };
