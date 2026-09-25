import { expect, test, type Page } from "@playwright/test";

/**
 * SCR-09 — one flashcard in full, outside a session (AC-12.1, 12.3, 12.4, 12.6, 12.7, 12.9, 12.11
 * and the 404 of a missing id). Real registration, real database (`tests/e2e/setup/withDb.ts`).
 * Another person's pending card cannot be created through the interface until SCR-10 exists; that
 * refusal is asserted against the real database in `tests/integration/SCR-09-detail.test.ts`.
 */

async function register(page: Page): Promise<void> {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const password = "correct horse battery staple";
  await page.goto("/rejestracja");
  await page.waitForLoadState("networkidle");
  await page.fill("#email", `detail-${stamp}@example.test`);
  await page.fill("#nickname", `det_${stamp.slice(-9)}`);
  await page.fill("#password", password);
  await page.fill("#password_repeat", password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/start");
  await page.waitForLoadState("networkidle");
}

const rows = (page: Page) => page.locator('main a[href^="/fiszki/"]');
const datalistValue = (page: Page, key: string) => page.getByText(key, { exact: true }).locator("xpath=following-sibling::span");

test.describe("SCR-09 — flashcard detail", () => {
  test("a seeded card opens with question, answer and code, and no administrator actions (AC-12.1, AC-12.3)", async ({
    page,
  }) => {
    await register(page);
    await page.goto("/fiszki");
    await rows(page).first().click();
    await page.waitForURL(/\/fiszki\/\d+$/);
    await expect(page.getByRole("heading", { level: 1, name: "Szczegóły fiszki" })).toBeVisible();
    await expect(page.locator("article h2")).not.toBeEmpty();
    await expect(page.getByText("Odpowiedź", { exact: true })).toBeVisible();
    await expect(page.locator("article")).toContainText("Zatwierdzona");
    await expect(page.getByRole("link", { name: "Edytuj" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Usuń" })).toHaveCount(0);
    await expect(page.getByText("Usuń fiszkę")).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText("Usuń");
  });

  test("an unmarked card, then a marking without a session (AC-12.9, AC-12.4, AC-12.6, AC-12.11)", async ({ page }) => {
    await register(page);
    await page.goto("/fiszki");
    await rows(page).first().click();
    await page.waitForURL(/\/fiszki\/\d+$/);
    await expect(datalistValue(page, "Aktualna ocena")).toHaveText("Nie zaczęte");
    await expect(page.locator('button[aria-pressed="true"]')).toHaveCount(0);
    await expect(datalistValue(page, "Ukryta do")).toHaveText("nie dotyczy");

    await page.getByRole("button", { name: "Do powtórki" }).click();
    await expect(page.getByText("Zapisano ocenę")).toBeVisible();
    await expect(datalistValue(page, "Aktualna ocena")).toHaveText("Do powtórki");
    await expect(page.getByRole("button", { name: /Do powtórki/ })).toHaveAttribute("aria-pressed", "true");

    for (let time = 1; time <= 5; time += 1) {
      await page.getByRole("button", { name: "Umiem", exact: true }).click();
      await expect(datalistValue(page, "Oceniona „Umiem”")).toHaveText(time === 1 ? "1 raz" : `${time} razy`);
    }
    await expect(datalistValue(page, "Ukryta do")).not.toHaveText("nie dotyczy");
    await page.getByRole("button", { name: "Nie umiem" }).click();
    await expect(datalistValue(page, "Ukryta do")).toHaveText("nie dotyczy");
    await expect(datalistValue(page, "Aktualna ocena")).toHaveText("Nie umiem");

    await page.goto("/start");
    await expect(page.getByRole("link", { name: /Nie umiem/ })).toContainText("1");
    await page.goto("/nauka");
    await expect(page).toHaveURL(/\/start$/);
  });

  test("Wróć do listy keeps the filters; Ucz się z tej kategorii starts a session (AC-12.7)", async ({ page }) => {
    await register(page);
    await page.goto("/fiszki?category=1&sort=oldest&limit=40");
    const list = page.url();
    await rows(page).first().click();
    await page.waitForURL(/\/fiszki\/\d+\?/);
    await page.getByRole("link", { name: "Wróć do listy" }).click();
    await expect(page).toHaveURL(list);

    await rows(page).first().click();
    await page.waitForURL(/\/fiszki\/\d+\?/);
    await page.getByRole("button", { name: "Ucz się z tej kategorii" }).click();
    await page.waitForURL("**/nauka");
    await expect(page.getByText("w sesji")).toBeVisible();
  });

  test("a missing or malformed id is the 404 page; a Guest goes to sign-in (AC-12.2)", async ({ page, browser }) => {
    await register(page);
    for (const id of ["999999", "abc"]) {
      const response = await page.goto(`/fiszki/${id}`);
      expect(response?.status()).toBe(404);
      await expect(page.getByText("Błąd 404")).toBeVisible();
    }
    const guest = await browser.newPage();
    await guest.goto("/fiszki/1");
    await expect(guest).toHaveURL(/\/logowanie\?powrot=/);
    await guest.close();
  });
});
