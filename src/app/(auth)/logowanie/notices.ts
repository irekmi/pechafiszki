/**
 * The fixed set of success notices SCR-01 renders after a redirect from another screen — a code on
 * the query string, resolved here, never free text carried on the URL. SCR-04 behaviour row 3 is
 * the first user; a later stage's own post-action redirect to SCR-01 (e.g. ST-22's account
 * deletion) adds a code here rather than inventing a second mechanism.
 */
const NOTICES = {
  "haslo-zmienione": "Hasło zmienione. Możesz się zalogować.",
} as const;

type NoticeCode = keyof typeof NOTICES;

export function resolveLogowanieNotice(code: string | undefined): string | undefined {
  return code !== undefined && code in NOTICES ? NOTICES[code as NoticeCode] : undefined;
}
