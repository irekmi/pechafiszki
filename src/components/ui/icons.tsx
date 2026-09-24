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
