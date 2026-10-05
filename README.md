# Fiszki

A responsive web application for learning answers to developer-interview questions with flashcards.
One shared pool of cards; a learner starts a study session, reveals the answer and marks how well they
know it (**Umiem** / **Do powtórki** / **Nie umiem**). Signed-in people may submit cards, which reach
the pool after an administrator approves them. Roles: Guest, User, Administrator. The interface is
Polish; code, comments and documentation are English.

It replaces the earlier single-file PWA that was served from GitHub Pages, which has been removed. Its
220 flashcards in nine categories live on in `prisma/seed-data.json`, loaded by `prisma/seed.ts`.

## Stack

Next.js 15 (App Router, React 19), TypeScript strict, Prisma with PostgreSQL, Auth.js v5
(credentials, argon2), Nodemailer over SMTP (password reset only), Tailwind CSS v4, Zod, Vitest and
Playwright. `CLAUDE.md` is the authoritative description of conventions, structure and test policy.

## Setup

```
npm install
cp .env.example .env        # then fill in the values; .env is never committed
npx prisma migrate dev      # create the database schema
npx prisma db seed          # nine categories, 220 approved flashcards, one administrator
npm run dev                 # http://localhost:3000
```

Environment names (see `.env.example`): `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `SMTP_HOST`,
`SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, and `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD` for the administrator the seed creates. The seed refuses to run without the
last two. It is idempotent: running it again does not duplicate categories or cards.

## Commands

```
npm run dev          # local development server
npm run build        # production build
npm run start        # run the production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run test         # Vitest — unit and integration (throwaway PostgreSQL, no setup needed)
npm run test:e2e     # Playwright — end-to-end flows, each on its own throwaway database
npx prisma migrate dev     # create and apply a migration
npx prisma db seed         # seed categories and flashcards
```

## Layout

```
src/app/         routes: (auth), (app), (admin)/administracja
src/domain/      pure study and progress rules
src/server/      db, auth, permissions, mail, services, actions
src/components/  ui kit and per-screen parts
prisma/          schema, migrations, seed and seed-data.json (the 220 cards)
tests/           unit, integration, e2e
```
