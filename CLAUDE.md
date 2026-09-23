# CLAUDE.md — Fiszki (developer interview flashcards)

This file is authoritative for this repository: stack, structure, conventions, commands and test
policy. Where it disagrees with a tool, a template or an agent's default, this file wins.

Written in English; **the user interface is Polish**. See §4.

---

## 1. The project

A responsive web application for learning answers to developer-interview questions with flashcards.
One shared pool of cards. A learner starts a study session, reads a question, reveals the answer with
a code example and marks how well they know it (**Umiem** / **Do powtórki** / **Nie umiem**). Known
cards are mixed back in for reinforcement, and a card confirmed as known several times is hidden from
sessions for a week. Any signed-in person may submit a card; it reaches the pool only after an
administrator approves it. Roles: Guest, User, Administrator.

**Sources of product truth, in this order:**

| What | Where |
|---|---|
| Functional specification, 23 screens (E-01…E-23) | `.agent-team/pechafiszki/input/docs/flashcards-functional-spec.md` |
| HTML mockups, one file per screen | `.agent-team/pechafiszki/input/mocups/` — note the spelling, **`mocups`**, not `mockups` |
| Generated spec, once it exists | `.agent-team/pechafiszki/spec/` |

`.agent-team/` is a working tree, never application code and never committed.

---

## 2. Stack — binding

- **Next.js 15**, App Router, React 19, **TypeScript strict**. `any` is not allowed; use `unknown`
  plus a narrowing check.
- **Prisma + PostgreSQL**. All data access goes through Prisma; no raw SQL unless a query provably
  cannot be expressed otherwise, and then with a comment saying why.
- **Auth.js v5 (NextAuth)**, credentials provider. Passwords hashed with **argon2**.
- **Nodemailer over SMTP** for the password-reset message. That is the only message the system sends
  and the only external integration that exists (section 7 of the functional specification).
- **Tailwind CSS v4** for all styling, with the mockups' design tokens registered in its theme (§3).
- **Zod** at every input boundary — form actions, route handlers, URL search params.
- **Vitest** for unit and integration tests, **Playwright** for end-to-end tests.

**Forbidden without a recorded decision:** any component or UI library (MUI, shadcn, Radix,
Headless UI, daisyUI); any CSS-in-JS; any i18n framework; any client-side
state-management library (Redux, Zustand, Jotai) — server components plus `useState` cover this
application; any analytics, tracking or third-party SDK; any file import/export, payment or social
sign-in library. The specification's out-of-scope list rules these out, and the mockups plus Tailwind
make them unnecessary.

---

## 3. Styling — Tailwind, with the mockups as the visual contract

**Tailwind CSS v4 is the styling mechanism. The mockups are still the design.** Tailwind changes how
the pixels are produced, not which pixels: a screen with a mockup is reproduced 1:1 from it.

- The only stylesheet is `src/app/globals.css`: `@import "tailwindcss"`, one `@theme` block, and the
  Chakra Petch font. No CSS modules, no per-component `.css` files.
- **The theme is read out of the mockups.** Port the tokens of
  `.agent-team/pechafiszki/input/mocups/styles.css` into `@theme` under Tailwind names:

  | Mockup token | Tailwind theme key |
  |---|---|
  | `--bg` `--surface` `--surface-2` `--ink` `--ink-2` `--line` | `--color-bg` `--color-surface` `--color-surface-2` `--color-ink` `--color-ink-2` `--color-line` |
  | `--brand` `--brand-2` `--gold` `--cta` `--cta-ink` | `--color-brand` `--color-brand-2` `--color-gold` `--color-cta` `--color-cta-ink` |
  | `--know` `--repeat` `--unknown` and their `-soft` variants | `--color-know` `--color-repeat` `--color-unknown`, `--color-know-soft` … |
  | `--sh-1` `--sh-2` `--sh-3` (hard offset shadows) | `--shadow-hard` `--shadow-hard-lg` `--shadow-hard-xl` |
  | `--display` (Chakra Petch), `--mono` | `--font-display`, `--font-mono` |
  | `--page` 1152 px | `--spacing-page` |

- **No raw values in JSX.** `bg-brand`, `text-gold`, `shadow-hard`, `font-display` — never
  `bg-[#2a1650]` and never an arbitrary value where a token exists. An arbitrary value is a sign the
  token is missing from `@theme`; add it there instead.
- The mockup's look is not negotiable and is easy to lose in utilities: 2 px ink borders, hard offset
  shadows (`0 3px 0` style, no blur), pill radii on buttons and chips, the 1152 px page, and the
  single breakpoint at 768 px (`md:`). Compare against the mockup in the browser before calling a
  screen done.
- **Every repeating element from the mockups is a component, not a repeated utility string** — button
  and its variants, marking button, flashcard, badge, tile, chip, filter bar, table wrapper, list
  item, empty state, notice, toast, modal. They live in `src/components/ui/`, one file each, and a
  long utility string never appears twice in the codebase. Variants are plain props, composed with
  `clsx` and `tailwind-merge`; those two are the only styling dependencies allowed.
- `@apply` is not used. If a rule is worth naming, it is worth a component.
- `.agent-team/pechafiszki/input/mocups/app.js` is mockup scaffolding — modals, tabs, chips, card
  flip, password show/hide, toast. Its **behaviour** is re-implemented in React; the file itself is
  never ported or imported.
- Every screen has a mockup, so no screen is designed from scratch. Deviate only from a deviation
  recorded as `DEV-NN` in the spec.

---

## 4. Language

- The interface is Polish. **Copy the strings verbatim from the mockups** — "Zacznij naukę",
  "Umiem", "Do powtórki", "Nie umiem", "Zapisano ocenę", "Wyczyść filtry" — do not re-translate or
  rephrase them. `<html lang="pl">`. No translation layer and no message catalogue; a single-language
  interface is a deliberate scope decision.
- Everything else is English: identifiers, types, database tables and columns, file names under
  `src/`, comments, commit messages, test names.
- Route segments are Polish and follow the mockup file names (`/nauka`, `/fiszki`,
  `/administracja/oczekujace`).

---

## 5. Directory map

```
src/app/(auth)/          E-01 logowanie, E-02 rejestracja, E-03 reset-hasla, E-04 nowe-haslo
src/app/(app)/           E-05 start, E-06 nauka, E-07 podsumowanie, E-08 fiszki,
                         E-09 fiszki/[id], E-10 dodaj, E-11 moje-fiszki, E-12 edytuj/[id],
                         E-13 statystyki, E-14 profil, E-23 profil/usun-konto
src/app/(admin)/administracja/
                         E-15 overview, E-16 oczekujace, E-17 ocena/[id], E-18 fiszki,
                         E-19 uzytkownicy, E-20 uzytkownicy/[id], E-21 kategorie
src/app/not-found.tsx    E-22, both variants — missing page and missing permission
src/domain/              pure TypeScript: the study and progress rules (§7)
src/server/              db.ts (Prisma singleton), auth.ts, permissions.ts, mail.ts
src/server/services/     one file per use case: createFlashcard, approveFlashcard, markCard, …
src/components/ui/       the mockups' repeating elements: Button, Badge, Tile, Chip, Flashcard, …
src/components/<screen>/ parts belonging to one screen family
prisma/                  schema.prisma, migrations/, seed.ts
tests/unit/  tests/integration/  tests/e2e/
```

Server components by default; `"use client"` only where an interaction needs it (card flip, filter
chips, modals). Mutations are **server actions**, not API routes, unless something outside the
browser has to call them. One Prisma client, from `src/server/db.ts` — never `new PrismaClient()`
anywhere else.

---

## 6. Code size and reuse — hard limits

**No file exceeds 100 lines.** This is a limit, not a guideline: a file that grows past it is split
before the stage ends, and a file over 100 lines is a reviewer finding on its own. It applies to
every `.ts` and `.tsx` file under `src/` — pages, components, services, domain modules and server
actions alike. `prisma/schema.prisma`, migrations and the seed are exempt.

What the limit forces, and what is meant by it:

- **Small, reusable components.** Anything that appears on two screens is one component used twice —
  never copied. Before writing a piece of UI, look in `src/components/ui/` for it; it is probably
  already there, because every repeating element of the mockups lives there (§3).
- **A page file wires, it does not build.** A route file loads its data, checks permission and
  composes components. No business logic, no long JSX, no inline data shaping.
- **One use case per service.** `src/server/services/` holds one file per operation —
  `approveFlashcard.ts`, `markCard.ts`, `submitFlashcard.ts`. A service that cannot say what it does
  in one sentence is two services. Services are the only place a server action's work lives; an
  action validates input with Zod, calls one service and returns.
- **One rule per domain function** (§7), so a unit test names a single behaviour.
- Splitting is by responsibility, never by line count: cutting a 140-line component into
  `Part1`/`Part2` at line 100 is not a split, it is the same file with a seam in it.

---

## 7. Domain rules live in `src/domain/`

The study rules — the count of five **Umiem** markings, the week-long hide, reinforcement of known
cards among unknown ones, "zapamiętane w tym tygodniu", what resets the counter, what happens when
the hidden week ends — are **pure functions** in `src/domain/`: plain data in, plain data out, no
Prisma import, no React import, callable from a test without a database. Route handlers and server
actions load the data, call these functions and persist the result; they never re-implement a rule
inline.

**The values themselves are not fixed by this file.** They are open questions 1–4 and 7 of the
specification. A stage implements a rule only once it is recorded as a `DEC-NN` in
`.agent-team/pechafiszki/spec/decisions.md`, and the implementing function's doc comment cites that
`DEC-NN`. If a rule is needed and no decision exists, raise it as a question rather than guessing a
number.

---

## 8. Security and permissions — binding

- **Every** route handler, server action and page that is not public re-checks the session and the
  role **on the server**. A client-side check is never sufficient. The role comes from the session,
  never from a request body, a query parameter or a header.
- Permission helpers live in `src/server/permissions.ts` and nowhere else. A missing permission and a
  missing resource both render E-22 — the interface does not distinguish them, and neither should the
  response leak the difference.
- A non-approved flashcard is readable only by its author or an administrator. An author may edit
  their own card while it is Pending or Rejected; an approved card is edited only by an
  administrator.
- Password reset: the token is **hashed at rest**, single use and short-lived. E-03 returns the same
  response whether or not the address exists.
- The "only administrator" blocks on E-19, E-20 and E-23 are enforced server-side, not just by a
  disabled button.
- **Never printed, never committed, never in a fixture:** `DATABASE_URL`, `AUTH_SECRET`,
  `SMTP_PASSWORD`, `SMTP_USER`, `SMTP_HOST`. Secrets come from the environment; `.env` is ignored and
  `.env.example` holds names with empty values.

---

## 9. Tests — required

Write these. They are not optional and they are not deferred to a later stage.

**1. Unit — Vitest, `tests/unit/`.** Required for every exported function in `src/domain/`: the
five-marking counter and what resets it, the week-long hide and its expiry, the insertion of known
cards among unknown ones, the weekly "memorised" calculation, and the state a card returns to when
its hidden week ends. Cover the boundary, not just the happy path — the fourth and the fifth marking,
the last day and the first day after.

**2. Integration — Vitest against a test database, `tests/integration/`.** Required for every server
action and route handler that is access-controlled or changes a flashcard's status:

- each one exercised as Guest, as User and as Administrator, asserting the refusal, not only the
  success;
- Pending → Approved and Pending → Rejected, including the Moderation Decision record and the
  rejection reason;
- reading another person's unapproved card, and opening an administration address as a User — both
  must end at E-22;
- the "only administrator" blocks, and a person's own row on E-19 and E-20.

**3. End-to-end — Playwright, `tests/e2e/`.** Required for three flows, each written **in the same
stage that closes the flow**, never later:

- rejestracja → logowanie → start;
- study session with markings → session summary;
- submit a flashcard → administrator approves it → it appears in the library.

Also: a bug fix ships with a regression test. Name a test after the screen or the decision it covers
(`SCR-06`, `DEC-03`) so a reviewer can find it from the specification.

---

## 10. Commands

```
npm run dev          # local development server
npm run build        # production build
npm run start        # run the production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run test         # Vitest — unit and integration
npm run test:e2e     # Playwright
npx prisma migrate dev     # create and apply a migration
npx prisma db seed         # seed categories and flashcards
```

A schema change is always accompanied by a migration in `prisma/migrations/`; never edit a migration
that has been applied.

---

## 11. Git workflow

- **`develop` is the base branch.** Every branch starts from an up-to-date `develop` and merges back
  into it. `main` holds releases only. Nothing is ever committed directly to `main` or to `develop`.
- **One branch per stage, named after the stage.** The branch name is the stage's own slug from
  `.agent-team/pechafiszki/stages/index.md` — `stage-NN-<slug>`, for example
  `stage-03-study-session`. Not a name invented from the stage title, and never renamed mid-stage.
- **Commit messages: one line, at most 100 characters.** Highlights of what was done and nothing
  else — no body, no bullet list, no explanation of why, no file inventory. English, imperative.

  ```
  stage-03: study session screen, card flip, marking buttons
  stage-03: hide card for a week after fifth Umiem
  stage-07: admin approval queue with reject reason
  ```

- Commit in small, coherent steps as the stage progresses — not one commit at the end, and not a
  commit per saved file.
- The branch is merged into `develop` when the stage is accepted; the stage branch is not reused
  afterwards.
- **Never committed:** `.agent-team/`, `.env` and any file holding a secret, `node_modules/`,
  `.next/`, build output. See `.gitignore`.
- No interactive rebase and no history rewriting on a shared branch.

---

## 12. Seed data

`prisma/seed.ts` seeds the nine categories and the **220 flashcards that already exist in the legacy
[index.html](index.html)** — the `const C = [...]` array, whose objects map straight across:
`c` → category, `q` → question, `a` → answer, `ex` → code example. They are seeded as Approved,
authored by a seeded administrator account. Categories: PHP, Symfony, Doctrine/SQL, API/HTTP,
Security, Testy, React, TypeScript, Architektura.

The seed is the starting content of the pool. Do not start from an empty database and do not invent
flashcards.

---

## 13. The legacy PWA

[index.html](index.html), [sw.js](sw.js), [manifest.webmanifest](manifest.webmanifest),
[icon.svg](icon.svg) and [README.md](README.md) are the current single-file PWA on GitHub Pages. The
new application replaces it, but:

- it stays untouched until the new application covers E-05 and E-06;
- it is then removed in **one** stage that names the removal explicitly — no unrelated stage deletes
  part of it;
- its flashcard content must already be in `prisma/seed.ts` (§12) before anything is deleted.
