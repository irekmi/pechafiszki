import { expect, test, type Page } from "@playwright/test";

/**
 * SCR-06 — the first half of NFR-03's second flow: start a session from SCR-05, flip a card, mark
 * it, and see the queue advance (AC-08.1 … AC-08.3, AC-08.7, AC-08.9, AC-08.12). The other half —
 * the session summary, SCR-07 — is built in ST-09, and that stage closes the flow's own spec.
 * Real registration, real database (`tests/e2e/setup/withDb.ts`).
 */

async function registerAndStart(page: Page): Promise<void> {
  const stamp = Date.now();
  const password = "correct horse battery staple";
  await page.goto("/rejestracja");
  await page.waitForLoadState("networkidle");
  await page.fill("#email", `study-${stamp}@example.test`);
  await page.fill("#nickname", `study_${stamp % 100000}`);
  await page.fill("#password", password);
  await page.fill("#password_repeat", password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => url.pathname === "/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Zacznij naukę" }).click();
  await page.waitForURL("**/nauka");
}

test.describe("SCR-06 — study session", () => {
  test("start, flip, mark, navigate back, reload (AC-08.1, 08.2, 08.3, 08.12)", async ({ page }) => {
    await registerAndStart(page);
    await expect(page.getByText("w sesji")).toContainText("Fiszka 1 z 20 w sesji");

    const question = await page.getByRole("heading", { level: 1 }).innerText();
    await expect(page.getByText("Kliknij fiszkę, aby zobaczyć odpowiedź i przykład")).toBeVisible();
    await page.getByRole("heading", { level: 1 }).click();
    await expect(page.getByText("Kliknij fiszkę, aby ukryć odpowiedź")).toBeVisible();
    await expect(page.getByText("Odpowiedź", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Pokaż / ukryj" }).click();
    await expect(page.getByText("Odpowiedź", { exact: true })).toHaveCount(0);

    await page.getByRole("button", { name: "Umiem", exact: true }).click();
    await expect(page.getByRole("status")).toHaveText("Zapisano ocenę");
    await expect(page.getByText("w sesji")).toContainText("Fiszka 2 z 20 w sesji");
    await expect(page.getByText("Kliknij fiszkę, aby zobaczyć odpowiedź i przykład")).toBeVisible();

    await page.reload();
    await expect(page.getByText("w sesji")).toContainText("Fiszka 2 z 20 w sesji");

    await page.getByRole("link", { name: "Poprzednia" }).click();
    await expect(page.getByText("w sesji")).toContainText("Fiszka 1 z 20 w sesji");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(question);
    await expect(page.getByText("1 razy z 5")).toBeVisible();
  });

  test("Przetasuj keeps the position; a chip rebuilds the queue in the same session (AC-08.7, 08.9)", async ({
    page,
  }) => {
    await registerAndStart(page);
    await page.getByRole("link", { name: "Następna" }).click();
    await expect(page.getByText("w sesji")).toContainText("Fiszka 2 z 20 w sesji");

    await page.getByRole("button", { name: "Przetasuj" }).click();
    await expect(page.getByRole("status")).toHaveText("Nowa kolejność fiszek");
    await expect(page.getByText("w sesji")).toContainText("Fiszka 2 z 20 w sesji");

    await page.getByRole("button", { name: /^Testy/ }).click();
    await expect(page.getByText("Kategoria: Testy")).toBeVisible();
    await expect(page.getByText("w sesji")).toContainText("Fiszka 1 z");

    await page.getByRole("button", { name: "Zacznij od nowa" }).first().click();
    await expect(page.getByRole("status")).toHaveText("Wyczyszczono wyszukiwanie i filtry");
    await expect(page.getByText("Kategoria: Wszystkie")).toBeVisible();
  });

  test("a phrase matching nothing shows Brak wyników (scenario 6)", async ({ page }) => {
    await registerAndStart(page);
    await page.fill("#query", "kubernetes-nie-istnieje");
    await page.press("#query", "Enter");
    await expect(page.getByRole("heading", { name: "Brak wyników" })).toBeVisible();
    await page.getByRole("button", { name: "Zacznij od nowa" }).click();
    await expect(page.getByText("w sesji")).toContainText("Fiszka 1 z 20 w sesji");
  });

  test("a Guest opening /nauka is sent to sign-in", async ({ page }) => {
    await page.goto("/nauka");
    await expect(page).toHaveURL(`/logowanie?powrot=${encodeURIComponent("/nauka")}`);
  });
});
