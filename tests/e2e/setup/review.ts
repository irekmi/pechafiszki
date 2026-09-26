import { expect, type Browser, type Page } from "@playwright/test";

/**
 * Steps shared by the flows that involve an administrator judging a submission (NFR-03 flow 3).
 * Real registration, real sign-in, the seeded administrator of `withDb.ts`; nothing is stubbed.
 */

export const PASSWORD = "correct horse battery staple";
export const ADMIN = { email: "admin@example.test", password: "correct horse battery staple e2e" };
export const stamp = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

export async function register(page: Page): Promise<void> {
  const id = stamp();
  await page.goto("/rejestracja");
  await page.waitForLoadState("networkidle");
  await page.fill("#email", `review-${id}@example.test`);
  await page.fill("#nickname", `rev_${id.slice(-9)}`);
  await page.fill("#password", PASSWORD);
  await page.fill("#password_repeat", PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => url.pathname === "/");
}

/** Submits through SCR-10, as the signed-in author, and waits for SCR-11. */
export async function submitCard(page: Page, question: string, category = "PHP"): Promise<void> {
  await page.goto("/dodaj");
  await expect(async () => {
    await page.fill("#question", "x");
    await expect(page.locator("article")).toContainText("x");
  }).toPass();
  await page.selectOption("#category", { label: category });
  await page.fill("#question", question);
  await page.fill("#answer", "Odpowiedź do oceny.");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/moje-fiszki/);
}

export async function adminPage(browser: Browser): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto("/logowanie");
  await page.waitForLoadState("networkidle");
  await page.fill("#email", ADMIN.email);
  await page.fill("#password", ADMIN.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => url.pathname === "/");
  return page;
}

/** Opens SCR-17 for the card with this question, through its row on SCR-16, once React has hydrated it. */
export async function openReview(admin: Page, question: string): Promise<void> {
  await admin.goto("/administracja/oczekujace?sort=newest");
  await admin.getByRole("link", { name: question }).click();
  await expect(admin.getByRole("heading", { level: 1, name: "Ocena fiszki" })).toBeVisible();
  await expect(admin.getByText(question).first()).toBeVisible();
  // React marks a hydrated node with a `__reactProps$…` key; a click before that is a native submit.
  await admin.waitForFunction(() =>
    Object.keys(document.querySelector("#category") ?? {}).some((key) => key.startsWith("__reactProps")),
  );
}

/** SCR-17's **Odrzuć** with a reason, for the card with this question; waits until the page has moved on. */
export async function reject(admin: Page, question: string, reason: string): Promise<void> {
  await openReview(admin, question);
  await admin.getByRole("button", { name: "Odrzuć", exact: true }).click();
  const dialog = admin.getByRole("dialog", { name: "Odrzuć fiszkę" });
  await dialog.getByLabel("Powód odrzucenia").fill(reason);
  const url = admin.url();
  await dialog.getByRole("button", { name: "Odrzuć fiszkę" }).click();
  await expect(admin).not.toHaveURL(url);
}

/** SCR-17's **Zatwierdź** for the card with this question; waits until the page has moved on. */
export async function approve(admin: Page, question: string): Promise<void> {
  await openReview(admin, question);
  const url = admin.url();
  await admin.getByRole("button", { name: "Zatwierdź" }).click();
  await expect(admin).not.toHaveURL(url);
}
