/** The two-card illustrations of the empty states, drawn with theme colours (the mockups' oklch literals are stale). */

export function NoResultsArt() {
  return (
    <svg viewBox="0 0 132 92" aria-hidden="true" className="block w-full h-full">
      <rect x="14" y="16" width="80" height="58" rx="10" fill="none" stroke="currentColor" strokeOpacity="0.22" strokeWidth="2" />
      <rect x="38" y="28" width="80" height="58" rx="10" className="fill-surface-2 stroke-surface-3" strokeWidth="2" />
      <circle cx="72" cy="52" r="13" fill="none" className="stroke-brand" strokeWidth="2.4" />
      <path d="M82 62l12 12" className="stroke-brand" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/** `08-biblioteka-fiszek-pusty.html` — an empty pool: a ghost card behind a card with two text lines. */
export function EmptyPoolArt() {
  return (
    <svg viewBox="0 0 132 92" aria-hidden="true" className="block w-full h-full">
      <rect x="10" y="14" width="86" height="60" rx="10" fill="none" stroke="currentColor" strokeOpacity="0.22" strokeWidth="2" />
      <rect x="34" y="26" width="86" height="60" rx="10" className="fill-accent-soft stroke-brand" strokeWidth="2" />
      <rect x="48" y="44" width="58" height="6" rx="3" className="fill-brand" fillOpacity="0.45" />
      <rect x="48" y="58" width="36" height="6" rx="3" className="fill-brand" fillOpacity="0.28" />
    </svg>
  );
}

/** `11-moje-fiszki-pusty.html` — a blank card with a plus: nothing submitted yet. */
export function NoSubmissionsArt() {
  return (
    <svg viewBox="0 0 132 92" aria-hidden="true" className="block w-full h-full">
      <rect x="22" y="12" width="88" height="64" rx="10" className="fill-surface-2 stroke-surface-3" strokeWidth="2" />
      <path d="M66 30v28M52 44h28" className="stroke-brand" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
