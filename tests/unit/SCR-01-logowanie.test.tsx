import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { INVALID_CREDENTIALS } from "@/app/(auth)/logowanie/signInState";
import { AuthBrand, AuthLinks, AuthShell } from "@/components/auth/AuthShell";
import { SignInAside } from "@/components/auth/SignInAside";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { TextLink } from "@/components/ui/TextLink";
import { Muted, PageTitle } from "@/components/ui/Typography";

const render = (markup: ReactElement) => renderToStaticMarkup(markup);

describe("SCR-01 — logowanie", () => {
  it("carries the aside panel and the decorative sample card verbatim (elements 1 and 2)", () => {
    const html = render(<SignInAside />);
    expect(html).toContain("Powtarzaj pytania rekrutacyjne, aż odpowiedź przychodzi sama.");
    expect(html).toContain("Wspólna pula fiszek z pytaniami z rozmów o pracę dla programistów.");
    expect(html).toContain("JavaScript");
    expect(html).toContain("Czym jest domknięcie?");
    expect(html).toContain("Kliknij fiszkę, aby zobaczyć odpowiedź i przykład");
  });

  it("hides the aside below 768 px, as the mockup's media query does (AC-03.7)", () => {
    const html = render(<AuthShell aside={<SignInAside />}>box</AuthShell>);
    expect(html).toMatch(/<aside class="[^"]*\bhidden\b[^"]*\bmd:grid\b/);
  });

  it("shows the brand, the heading and the lede (elements 3, 4, 5)", () => {
    const html = render(
      <>
        <AuthBrand />
        <PageTitle>Zaloguj się</PageTitle>
        <Muted>Fiszki na rozmowy rekrutacyjne dla programistów</Muted>
      </>,
    );
    expect(html).toContain(">F<");
    expect(html).toContain("Fiszki");
    expect(html).toContain("Zaloguj się");
    expect(html).toContain("Fiszki na rozmowy rekrutacyjne dla programistów");
  });

  it("links to SCR-03 and SCR-02 with the mockup's wording (element 10)", () => {
    const html = render(
      <AuthLinks>
        <TextLink href="/reset-hasla">Nie pamiętasz hasła?</TextLink>
        <TextLink href="/rejestracja">Utwórz konto</TextLink>
      </AuthLinks>,
    );
    expect(html).toContain('href="/reset-hasla"');
    expect(html).toContain("Nie pamiętasz hasła?");
    expect(html).toContain('href="/rejestracja"');
    expect(html).toContain("Utwórz konto");
  });

  it("has exactly one message for both failure causes (AC-03.2)", () => {
    expect(INVALID_CREDENTIALS).toBe("Nieprawidłowy e-mail lub hasło");
  });

  it("puts the error under its own field and marks the control invalid", () => {
    const html = render(
      <Field label="Hasło" htmlFor="password" error="Hasło jest wymagane">
        <Input id="password" className="border-cta shadow-invalid" />
      </Field>,
    );
    expect(html).toContain('for="password"');
    expect(html).toContain("Hasło jest wymagane");
    expect(html).toContain("border-cta");
  });
});
