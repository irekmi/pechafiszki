const EXCERPT_LENGTH = 80;

/** API-19's `answerExcerpt`: the first ~80 characters of the answer, whitespace collapsed, ellipsised. */
export function answerExcerpt(answer: string): string {
  const text = answer.trim().replace(/\s+/g, " ");
  return text.length <= EXCERPT_LENGTH ? text : `${text.slice(0, EXCERPT_LENGTH).trimEnd()}…`;
}
