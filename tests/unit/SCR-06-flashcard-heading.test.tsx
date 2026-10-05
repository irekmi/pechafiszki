import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Flashcard } from "@/components/ui/Flashcard";
import { EmptyState } from "@/components/ui/EmptyState";

// SCR-06 rendered fidelity — the mockup's global `h1 { color: var(--brand) }` and `.empty` ink art.

describe("SCR-06 — question heading colour", () => {
  it("draws the question as a brand-coloured h1 on the study screen", () => {
    const html = renderToStaticMarkup(<Flashcard heading="h1" question="Pytanie" />);
    expect(html).toMatch(/<h1 class="[^"]*\btext-brand\b/);
    expect(html).toMatch(/<h1 class="[^"]*\btext-27\b/);
  });

  it("leaves the h2 question in ink", () => {
    expect(renderToStaticMarkup(<Flashcard question="Pytanie" />)).not.toContain("text-brand");
  });

  it("draws the empty-state art in ink, as the mockup's .empty does", () => {
    const html = renderToStaticMarkup(<EmptyState title="T" art={<svg />} />);
    expect(html).toMatch(/<span class="[^"]*\btext-ink\b[^-]/);
  });
});
