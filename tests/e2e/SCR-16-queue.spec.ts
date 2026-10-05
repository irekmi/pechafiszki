import { expect, test, type Browser, type Page } from "@playwright/test";

/**
 * SCR-16 — the approval queue (AC-14.1, 14.3, 14.4, 14.5, 14.6, 14.7, 14.9). Real registration, real
 * database (`tests/e2e/setup/withDb.ts`), the seeded administrator. The database is shared with the
 * other specs, which also leave cards in the queue: every assertion is about a card found by its own
 * unique question, never about counts. The full submit → approve → library flow closes in ST-15.
 */

const PASSWORD = "correct horse battery staple";
const ADMIN = { email: "admin@example.test", password: "correct horse battery staple e2e" };
const stamp = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const QUEUE = "/administracja/oczekujace";

async function register(page: Page): Promise<void> {
  const id = stamp();
  await page.goto("/rejestracja");
  await page.waitForLoadState("networkidle");
  await page.fill("#email", `queue-${id}@example.test`);
  await page.fill("#nickname", `que_${id.slice(-9)}`);
  await page.fill("#password", PASSWORD);
  await page.fill("#password_repeat", PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => url.pathname === "/");
}

async function submitCard(page: Page, question: string): Promise<void> {
  await page.goto("/dodaj");
  await expect(async () => {
    await page.fill("#question", "x");
    await expect(page.locator("article")).toContainText("x");
  }).toPass();
  await page.selectOption("#category", { label: "PHP" });
  await page.fill("#question", question);
  await page.fill("#answer", "Odpowiedź do oceny.");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/moje-fiszki/);
}

async function adminPage(browser: Browser): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto("/logowanie");
  await page.waitForLoadState("networkidle");
  await page.fill("#email", ADMIN.email);
  await page.fill("#password", ADMIN.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => url.pathname === "/");
  return page;
}

/** A row is the box around the link carrying the question. */
const rowOf = (page: Page, question: string) => page.getByRole("link", { name: question }).locator("xpath=..");

async function openQueue(page: Page, question: string): Promise<void> {
  await page.goto(`${QUEUE}?sort=newest`);
  await expect(rowOf(page, question)).toBeVisible();
  // The row's buttons only answer once the board has hydrated.
  await page.waitForFunction(() => document.querySelector("main button")?.hasAttribute("disabled") === false);
}

test.describe("SCR-16 — access (AC-14.7, AC-14.8)", () => {
  test("a User gets SCR-22's 403 variant with status 403; a Guest is sent to SCR-01", async ({ page }) => {
    await page.goto(QUEUE);
    await expect(page).toHaveURL(new RegExp(`/logowanie\\?powrot=${encodeURIComponent(QUEUE)}`));
    await register(page);
    const response = await page.goto(QUEUE);
    expect(response?.status()).toBe(403);
    await expect(page.getByText("Błąd 403")).toBeVisible();
    await expect(page.getByRole("link", { name: "Administracja" })).toHaveCount(0);
  });
});

test.describe("SCR-16 — deciding a submission", () => {
  test("approve, then reject with a reason; the author sees both (AC-14.1, 14.3, 14.4, 14.6, 14.9)", async ({
    page,
    browser,
  }) => {
    const approved = `Zatwierdzana ${stamp()}?`;
    const rejected = `Odrzucana ${stamp()}?`;
    await register(page);
    await submitCard(page, approved);
    await submitCard(page, rejected);

    const admin = await adminPage(browser);
    await openQueue(admin, approved);
    await expect(admin.getByRole("link", { name: "Wróć do nauki" })).toHaveAttribute("href", "/");
    await expect(admin.getByText("Administrator", { exact: true })).toBeVisible();
    await expect(admin.getByRole("link", { name: "Fiszki", exact: true })).toHaveCount(0);

    await rowOf(admin, approved).getByRole("button", { name: "Zatwierdź" }).click();
    await expect(admin.getByRole("status")).toHaveText("Fiszka zatwierdzona");
    await expect(rowOf(admin, approved)).toHaveCount(0);

    await rowOf(admin, rejected).getByRole("button", { name: "Odrzuć" }).click();
    const dialog = admin.getByRole("dialog", { name: "Odrzuć fiszkę" });
    await dialog.getByRole("button", { name: "Odrzuć fiszkę" }).click();
    await expect(dialog.getByText("Powód odrzucenia jest wymagany")).toBeVisible();
    await dialog.getByLabel("Powód odrzucenia").fill("Odpowiedź jest zbyt ogólna.");
    await dialog.getByRole("button", { name: "Odrzuć fiszkę" }).click();
    await expect(admin.getByRole("status")).toHaveText("Fiszka odrzucona");
    await expect(rowOf(admin, rejected)).toHaveCount(0);

    await admin.goto(`${QUEUE}?tab=approved&sort=newest`);
    await expect(rowOf(admin, approved)).toBeVisible();
    await expect(admin.getByRole("button", { name: "Zatwierdź" })).toHaveCount(0);
    await expect(admin.getByRole("button", { name: "Odrzuć" })).toHaveCount(0);
    await admin.goto(`${QUEUE}?tab=rejected&sort=newest`);
    await expect(rowOf(admin, rejected)).toBeVisible();
    await expect(admin.getByRole("button", { name: "Zatwierdź" })).toHaveCount(0);

    await page.goto("/moje-fiszki");
    await expect(page.getByText("Powód odrzucenia: Odpowiedź jest zbyt ogólna.")).toBeVisible();
    await page.goto("/moje-fiszki?status=approved");
    await expect(page.getByText(approved)).toBeVisible();
    await admin.close();
  });

  test("a second administrator is told the card was already reviewed (AC-14.5)", async ({ page, browser }) => {
    const question = `Wyścig ${stamp()}?`;
    await register(page);
    await submitCard(page, question);
    const [first, second] = [await adminPage(browser), await adminPage(browser)];
    await openQueue(first, question);
    await openQueue(second, question);

    await rowOf(first, question).getByRole("button", { name: "Zatwierdź" }).click();
    await expect(first.getByRole("status")).toHaveText("Fiszka zatwierdzona");
    await rowOf(second, question).getByRole("button", { name: "Zatwierdź" }).click();
    await expect(second.getByRole("heading", { name: "Ta fiszka została już oceniona" })).toBeVisible();
    await second.getByRole("button", { name: "Wróć do kolejki" }).click();
    await expect(rowOf(second, question)).toHaveCount(0);
    await first.close();
    await second.close();
  });
});
