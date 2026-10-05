import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LibraryScreen } from "@/components/library/LibraryScreen";
import { parseLibraryParams } from "@/server/services/libraryParams";
import type { LibraryRow } from "@/server/services/listFlashcards";

// The start-session action pulls in Auth.js; a static render has no use for it. Same for the router.
vi.mock("@/server/actions/startSession", () => ({ startSessionAction: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const row = (over: Partial<LibraryRow> = {}): LibraryRow => ({
  id: 4,
  category: "PHP",
  question: "Czym jest <code>let</code>?",
  submittedAt: new Date("2026-09-19T10:00:00Z"),
  author: "anna_w",
  mark: "know",
  hiddenUntil: new Date("2026-09-29T10:00:00Z"),
  ...over,
});

const render = (query: Record<string, string>, page: { rows: LibraryRow[]; shown: number; total: number }) =>
  renderToStaticMarkup(<LibraryScreen page={page} params={parseLibraryParams(query)} categories={[{ id: 1, name: "PHP", position: 1 }]} />);

describe("SCR-08 — biblioteka", () => {
  it("draws the empty pool from the mockup: no actions of the list, no filter bar", () => {
    const html = render({}, { rows: [], shown: 0, total: 0 });
    expect(html).toContain("Nie ma jeszcze żadnych fiszek");
    expect(html).toContain("0 fiszek");
    expect(html).toContain("Wróć na start");
    expect(html).not.toContain("Ucz się z tych fiszek");
    expect(html).not.toContain('role="search"');
  });

  it("draws the no-match state with the filter bar kept and no session button", () => {
    const html = render({ query: "zzz" }, { rows: [], shown: 0, total: 0 });
    expect(html).toContain("Żadna fiszka nie spełnia Twoich filtrów");
    expect(html).toContain('role="search"');
    expect(html).not.toContain("Ucz się z tych fiszek");
  });

  it("lists a hidden card with its date, escapes the question (DEV-03) and carries the filters to SCR-09", () => {
    const html = render({ category: "1", sort: "mark" }, { rows: [row()], shown: 1, total: 41 });
    expect(html).toContain("Ukryta do 29.09.2026");
    expect(html).toContain("Umiem");
    expect(html).toContain("Czym jest &lt;code&gt;let&lt;/code&gt;?");
    expect(html).toContain('href="/fiszki/4?category=1&amp;sort=mark"');
    expect(html).toContain("41 fiszek spełniają wybrane filtry");
    expect(html).toContain("Pokazano 1 z 41 fiszek");
    expect(html).toContain('href="/fiszki?category=1&amp;sort=mark&amp;limit=40"');
  });

  it("offers no Pokaż więcej once everything is shown", () => {
    const html = render({}, { rows: [row()], shown: 1, total: 1 });
    expect(html).toContain("Pokazano 1 z 1 fiszki");
    expect(html).not.toContain("Pokaż więcej");
  });
});
