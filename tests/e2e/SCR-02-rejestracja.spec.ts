import { expect, test } from "@playwright/test";

/**
 * SCR-02 against `02-rejestracja.html` — rendering, the **Pokaż** toggle and the 768 px aside.
 * Submitting the form needs a real database, so the actual account creation is exercised in
 * `tests/integration/SCR-02-signup.test.ts`; the rejestracja → logowanie → start chain closes in
 * ST-07, per the stage file's own "Explicitly NOT in this stage" table.
 */

test.describe("SCR-02 — rejestracja", () => {
  test("renders the mockup's copy, both panels, the consent line and both links", async ({ page }) => {
    await page.goto("/rejestracja");
    await expect(page.getByRole("heading", { name: "Utwórz konto" })).toBeVisible();
    await expect(page.getByText("Wystarczy adres e-mail, pseudonim i hasło.")).toBeVisible();
    await expect(page.getByText("Jedno konto, wspólna pula pytań.")).toBeVisible();
    await expect(page.getByText("Co to jest ORM?")).toBeVisible();
    await expect(
      page.getByText("Rejestrując się, zgadzasz się na przechowywanie Twoich ocen fiszek."),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Mam już konto" })).toBeVisible();
    await expect(
      page.getByText("Pod tym pseudonimem inni zobaczą fiszki, które zgłosisz."),
    ).toBeVisible();
  });

  test("Pokaż reveals only the password field, never Powtórz hasło (behaviour row 6)", async ({
    page,
  }) => {
    await page.goto("/rejestracja");
    const password = page.locator("#password");
    const repeat = page.locator("#password_repeat");
    await expect(password).toHaveAttribute("type", "password");
    await expect(repeat).toHaveAttribute("type", "password");
    await expect(page.getByRole("button", { name: "Pokaż" })).toHaveCount(1);

    await page.getByRole("button", { name: "Pokaż" }).click();
    await expect(password).toHaveAttribute("type", "text");
    await expect(repeat).toHaveAttribute("type", "password");

    await page.getByRole("button", { name: "Ukryj" }).click();
    await expect(password).toHaveAttribute("type", "password");
  });

  test("hides the aside panel below 768 px and shows it above", async ({ page }) => {
    const aside = page.locator("aside");
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/rejestracja");
    await expect(aside).toBeVisible();
    await page.setViewportSize({ width: 400, height: 900 });
    await expect(aside).toBeHidden();
    await expect(page.getByRole("heading", { name: "Utwórz konto" })).toBeVisible();
  });

  test("Mam już konto goes to SCR-01", async ({ page }) => {
    await page.goto("/rejestracja");
    await page.getByRole("link", { name: "Mam już konto" }).click();
    await expect(page).toHaveURL("/logowanie");
  });
});
