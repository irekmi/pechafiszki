/** What SCR-10's form gets back from API-16: a message per offending field, or the no-categories flag. */
export type SubmitErrors = { category?: string; question?: string; answer?: string; codeExample?: string };

export type SubmitState = { errors: SubmitErrors; noCategories?: boolean };

export const emptySubmitState: SubmitState = { errors: {} };
