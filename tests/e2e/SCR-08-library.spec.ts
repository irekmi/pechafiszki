import { expect, test, type Page } from "@playwright/test";

/**
 * SCR-08 — the flashcard library on the seeded pool of 220 (AC-11.2, 11.3, 11.4, 11.5, 11.7,
 * 11.8, 11.9). Real registration, real database (`tests/e2e/setup/withDb.ts`).
 */

async function register(page: Page): Promise<void> {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const password = "correct horse battery staple";
  await page.goto("/rejestracja");
  await page.waitForLoadState("networkidle");
  await page.fill("#email", `library-${stamp}@example.test`);
  await page.fill("#nickname", `lib_${stamp.slice(-9)}`);
  await page.fill("#password", password);
  await page.fill("#password_repeat", password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => url.pathname === "/");
  await page.waitForLoadState("networkidle");
}

const rows = (page: Page) => page.locator('main a[href^="/fiszki/"]');
const shownText = (page: Page) => page.getByText(/^Pokazano \d+ z \d+ fisz(ki|ek)$/);

test.describe("SCR-08 — flashcard library", () => {
  test("first page, Pokaż więcej and the counters (AC-11.2, AC-11.3)", async ({ page }) => {
    await register(page);
    await page.goto("/fiszki");
    await expect(page.getByRole("heading", { level: 1, name: "Fiszki" })).toBeVisible();
    await expect(page.getByText("220 fiszek spełniają wybrane filtry")).toBeVisible();
    await expect(rows(page)).toHaveCount(20);
    await expect(shownText(page)).toHaveText("Pokazano 20 z 220 fiszek");

    await page.getByRole("link", { name: "Pokaż więcej" }).click();
    await expect(page).toHaveURL(/limit=40/);
    await expect(rows(page)).toHaveCount(40);
    await expect(shownText(page)).toHaveText("Pokazano 40 z 220 fiszek");

    await page.selectOption("#category", { label: "Security" });
    await expect(page).toHaveURL(/category=\d+/);
    await expect(page).not.toHaveURL(/limit=/);
    await expect(page.getByText("12 fiszek spełniają wybrane filtry")).toBeVisible();
    await expect(shownText(page)).toHaveText("Pokazano 12 z 12 fiszek");
    await expect(page.getByRole("link", { name: "Pokaż więcej" })).toHaveCount(0);
  });

  test("search ignores diacritics; the filters survive a round trip (AC-11.4, AC-11.5)", async ({ page }) => {
    await register(page);
    await page.goto("/fiszki");
    await page.fill("#query", "wyjatki");
    await page.press("#query", "Enter");
    await expect(page).toHaveURL(/query=wyjatki/);
    await expect(page.getByText("220 fiszek spełniają wybrane filtry")).toHaveCount(0);
    const total = Number((await shownText(page).innerText()).match(/z (\d+)/)?.[1]);
    expect(total).toBeGreaterThanOrEqual(1);
    await expect(rows(page)).toHaveCount(Math.min(total, 20));

    const url = page.url();
    await rows(page).first().click();
    await page.waitForURL(/\/fiszki\/\d+\?query=wyjatki/);
    await page.goBack();
    await expect(page).toHaveURL(url);
    await expect(page.locator("#query")).toHaveValue("wyjatki");

    await page.getByRole("button", { name: "Wyczyść filtry" }).click();
    await expect(page).toHaveURL(/\/fiszki$/);
    await expect(page.locator("#query")).toHaveValue("");
    await expect(page.getByText("220 fiszek spełniają wybrane filtry")).toBeVisible();
  });

  test("nothing matches; a hand-made URL never errors (AC-11.9)", async ({ page }) => {
    await register(page);
    await page.goto("/fiszki?query=zzzznieistnieje");
    await expect(page.getByText("Żadna fiszka nie spełnia Twoich filtrów")).toBeVisible();
    await page.getByRole("button", { name: "Wyczyść filtry" }).last().click();
    await expect(rows(page)).toHaveCount(20);

    await page.goto("/fiszki?limit=100000&mark=nonsense&sort=random&category=abc");
    await expect(rows(page)).toHaveCount(200);
    await expect(shownText(page)).toHaveText("Pokazano 200 z 220 fiszek");
  });

  test("a counter tile opens the library on that marking; Ucz się z tych fiszek starts a session (AC-11.7, AC-11.8)", async ({
    page,
  }) => {
    await register(page);
    await page.getByRole("link", { name: /Nie zaczęte/ }).click();
    await expect(page).toHaveURL(/\/fiszki\?mark=new/);
    await expect(page.getByText("220 fiszek spełniają wybrane filtry")).toBeVisible();

    await page.selectOption("#mark", "");
    await page.selectOption("#category", { label: "Security" });
    await expect(page.getByText("12 fiszek spełniają wybrane filtry")).toBeVisible();
    await page.getByRole("button", { name: "Ucz się z tych fiszek" }).click();
    await page.waitForURL("**/nauka");
    await expect(page.getByText("Kategoria: Security")).toBeVisible();
    await expect(page.getByText("w sesji")).toContainText("z 12 w sesji");
  });
});
