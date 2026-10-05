import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SubmitScreen } from "@/components/submit/SubmitScreen";

// The action pulls in Auth.js; a static render has no use for it.
vi.mock("@/server/actions/submitFlashcard", () => ({ submitFlashcardAction: vi.fn() }));

const WARNING = "Nie ma jeszcze żadnych kategorii, skontaktuj się z administratorem";

/** SCR-10 — the first-visit form and the no-categories state (AC-13.7, AC-13.6). */
describe("SCR-10 — dodaj fiszkę", () => {
  it("first visit: live fields, the placeholder answer in the shared preview card, no warning", () => {
    const html = renderToStaticMarkup(<SubmitScreen categories={[{ id: 1, name: "PHP" }]} />);
    expect(html).not.toContain(WARNING);
    expect(html).not.toContain('disabled=""');
    expect(html).toContain("Podgląd fiszki w sesji");
    expect(html).toContain("Odpowiedź pojawi się tutaj, gdy wypełnisz pole „Odpowiedź”.");
    expect(html).toContain("Po wysłaniu fiszka trafia do kolejki administratora.");
    expect(html).toContain('<option value="1">PHP</option>');
  });

  it("no categories: every field and the submit button inactive, the warning shown", () => {
    const html = renderToStaticMarkup(<SubmitScreen categories={[]} />);
    expect(html).toContain(WARNING);
    for (const id of ["category", "question", "answer", "code_example"]) {
      expect(html).toMatch(new RegExp(`<(select|input|textarea)[^>]*id="${id}"[^>]*disabled`));
    }
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled/);
  });
});
