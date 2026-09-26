import { expect, test } from "@playwright/test";

/**
 * SCR-01 against `01-logowanie.html`, and the Guest half of NFR-01. Nothing here needs a database:
 * the credentials themselves are exercised in `tests/integration/API-02-signIn.test.ts`, and the
 * signed-in flow closes in ST-04, which puts rejestracja in front of it (NFR-03).
 */

test.describe("SCR-01 — logowanie", () => {
  test("renders the mockup's copy, both panels and both links", async ({ page }) => {
    await page.goto("/logowanie");
    await expect(page.getByRole("heading", { name: "Zaloguj się" })).toBeVisible();
    await expect(
      page.getByText("Fiszki na rozmowy rekrutacyjne dla programistów"),
    ).toBeVisible();
    await expect(
      page.getByText("Powtarzaj pytania rekrutacyjne, aż odpowiedź przychodzi sama."),
    ).toBeVisible();
    await expect(page.getByText("Czym jest domknięcie?")).toBeVisible();
    await expect(page.getByRole("link", { name: "Nie pamiętasz hasła?" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Utwórz konto" })).toBeVisible();
  });

  test("Pokaż reveals the password and becomes Ukryj (behaviour row 3)", async ({ page }) => {
    await page.goto("/logowanie");
    const password = page.locator("#password");
    await expect(password).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Pokaż" }).click();
    await expect(password).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Ukryj" }).click();
    await expect(password).toHaveAttribute("type", "password");
  });

  test("hides the aside panel below 768 px and shows it above (AC-03.7)", async ({ page }) => {
    const aside = page.locator("aside");
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/logowanie");
    await expect(aside).toBeVisible();
    await page.setViewportSize({ width: 400, height: 900 });
    await expect(aside).toBeHidden();
    await expect(page.getByRole("heading", { name: "Zaloguj się" })).toBeVisible();
  });
});

test.describe("NFR-01 — a Guest at a protected address", () => {
  for (const path of ["/", "/fiszki", "/administracja"]) {
    test(`${path} sends a Guest to SCR-01, carrying the address (AC-03.3)`, async ({ page }) => {
      await page.goto(path);
      // SCR-01 returns a signed-in person to SCR-05 on its own, so `/` carries no return address.
      const expected = path === "/" ? "/logowanie" : `/logowanie?powrot=${encodeURIComponent(path)}`;
      await expect(page).toHaveURL(expected);
      await expect(page.getByRole("heading", { name: "Zaloguj się" })).toBeVisible();
    });
  }

  test("a public address is left alone", async ({ page }) => {
    const response = await page.goto("/logowanie");
    expect(response?.status()).toBe(200);
  });
});
