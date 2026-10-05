/**
 * Browsers submit a textarea with CRLF although `maxlength` counted it as LF, and PostgreSQL cannot
 * store a NUL byte; both are normalised before any length is measured. Shared by every service that
 * takes free text from a form.
 */
export function cleanText(value: string): string {
  return value.replaceAll("\r\n", "\n").replaceAll("\r", "\n").replaceAll("\0", "");
}
