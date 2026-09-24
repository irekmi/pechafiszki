// Extracts the legacy `const C = [...]` array of index.html into prisma/seed-data.json.
// CLAUDE.md §12 and REQ-03: that array is the real content of the pool, mapped
// c -> category, q -> question, a -> answer, ex -> codeExample. Run it again only if the
// legacy file changes; index.html itself disappears in the stage that retires the PWA
// (CLAUDE.md §13), which is why its content is committed here as JSON.
// Usage: node prisma/extract-legacy-cards.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const legacy = readFileSync(join(here, "..", "index.html"), "utf8");

const start = legacy.indexOf("const C = [");
if (start === -1) throw new Error("index.html no longer holds `const C = [`");
const open = legacy.indexOf("[", start);
const close = legacy.indexOf("\n];", open);
if (close === -1) throw new Error("index.html no longer closes the array with `\\n];`");

const source = legacy.slice(open, close + 2);
/** @type {{c: string, q: string, a: string, ex?: string}[]} */
const cards = new Function(`"use strict"; return ${source};`)();

const out = cards.map((card) => ({
  category: card.c,
  question: card.q,
  answer: card.a,
  codeExample: card.ex ?? null,
}));

writeFileSync(join(here, "seed-data.json"), `${JSON.stringify(out, null, 2)}\n`, "utf8");
console.log(`extracted ${out.length} flashcards in ${new Set(out.map((c) => c.category)).size} categories`);
