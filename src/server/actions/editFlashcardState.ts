import type { SubmitErrors } from "./submitFlashcardState";

/**
 * What SCR-12's form gets back from API-17 / API-22: a message per offending field, the DEC-58
 * conflict (the form goes read-only), or `saved` — when **Zapisz zmiany** succeeded, the moment it did.
 */
export type EditState = { errors: SubmitErrors; conflict?: boolean; saved?: number };

export const emptyEditState: EditState = { errors: {} };
