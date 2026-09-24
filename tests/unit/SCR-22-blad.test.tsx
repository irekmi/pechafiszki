import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ErrorScreen } from "@/components/error/ErrorScreen";

const render = (markup: ReactElement) => renderToStaticMarkup(markup);

describe("SCR-22 — błąd", () => {
  it("renders the 404 variant's copy (DEC-57, row 1)", () => {
    const html = render(<ErrorScreen variant="404" signedIn />);
    expect(html).toContain("Błąd 404");
    expect(html).toContain("Nie znaleziono strony");
    expect(html).toContain("Ta strona nie istnieje lub została usunięta.");
  });

  it("renders the 403 variant's copy (DEC-57, row 3)", () => {
    const html = render(<ErrorScreen variant="403" signedIn />);
    expect(html).toContain("Błąd 403");
    expect(html).toContain("Brak dostępu");
    expect(html).toContain("Obszar administracji jest dostępny tylko dla administratorów.");
  });

  it("shows a signed-in visitor both actions and no sign-in action", () => {
    const html = render(<ErrorScreen variant="404" signedIn />);
    expect(html).toContain("Wróć na start");
    expect(html).toContain("Przeglądaj fiszki");
    expect(html).not.toContain("Wróć do logowania");
  });

  it("shows a guest only Wróć do logowania — the other two are absent from the DOM", () => {
    const html = render(<ErrorScreen variant="404" signedIn={false} />);
    expect(html).toContain("Wróć do logowania");
    expect(html).not.toContain("Wróć na start");
    expect(html).not.toContain("Przeglądaj fiszki");
  });
});
