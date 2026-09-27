const CANONICAL = /^[1-9]\d*$/;
const MAX_ID = 2_147_483_647;

/**
 * A card or account id from an address segment; `null` for anything that is not the canonical spelling
 * of a positive 32-bit integer — `1e2`, `0x10`, `007` and `+5` are missing pages, not other ids (ISS-20).
 */
export function parseCardId(raw: string): number | null {
  if (!CANONICAL.test(raw)) return null;
  const parsed = Number(raw);
  return parsed <= MAX_ID ? parsed : null;
}
