/**
 * The mockups' inline SVGs, copied path for path. They are sized by the slot they sit in —
 * `Notice`'s icon slot is already the 18 px of `.notice__icon`.
 */

/** `.notice__icon` as drawn in `01-logowanie.html` and every other danger/warning notice. */
export function AlertIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true" className="block w-full h-full">
      <circle cx="9" cy="9" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M9 5v5M9 12.6v.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** `.topbar__burger`'s icon, drawn on every signed-in screen below 768 px. */
export function BurgerIcon() {
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
      <rect y="0" width="18" height="2" rx="1" fill="currentColor" />
      <rect y="5" width="18" height="2" rx="1" fill="currentColor" />
      <rect y="10" width="18" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

/** `.notice__icon` as drawn in `03-reset-hasla.html`'s success notice. */
export function CheckIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true" className="block w-full h-full">
      <circle cx="9" cy="9" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5.4 9.3l2.4 2.4 4.8-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** `.notice__icon` as drawn in `06-sesja-nauki.html`'s reinforcement notice. */
export function InfoIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true" className="block w-full h-full">
      <circle cx="9" cy="9" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 8v5M9 5.2v.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** `.search__icon` — the magnifier inside the search field. */
export function SearchIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-2 pointer-events-none"
    >
      <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M11 11l4 4" stroke="currentColor" strokeWidth="1.6" fill="none" />
    </svg>
  );
}
