import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * NFR-03 flow 2 — study session with markings → session summary (AC-09.1, 09.2, 09.3, 09.7, 09.8,
 * 09.10, 09.12). ST-08's `SCR-06-study.spec.ts` covers the study half; this one closes the flow.
 * Real registration, real database (`tests/e2e/setup/withDb.ts`).
 */

async function registerAndStart(page: Page): Promise<void> {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const password = "correct horse battery staple";
  await page.goto("/rejestracja");
  await page.waitForLoadState("networkidle");
  await page.fill("#email", `summary-${stamp}@example.test`);
  await page.fill("#nickname", `sum_${stamp.slice(-8)}`);
  await page.fill("#password", password);
  await page.fill("#password_repeat", password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => url.pathname === "/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Zacznij naukę" }).click();
  await page.waitForURL("**/nauka");
}

async function mark(page: Page, name: "Umiem" | "Do powtórki" | "Nie umiem", position: number): Promise<void> {
  await page.getByRole("button", { name, exact: true }).click();
  await expect(page.getByText("w sesji")).toContainText(`Fiszka ${position + 1} z`);
}

/** The value inside the tile carrying `label` (SCR-07 element 3). */
function tile(page: Page, label: string): Locator {
  return page.getByText(label, { exact: true }).first().locator("xpath=..");
}

test.describe("SCR-07 — session summary (flow 2)", () => {
  test("mark all three kinds, Zakończ sesję, read the summary, reload (AC-09.1, 09.3, 09.7)", async ({ page }) => {
    await registerAndStart(page);
    await mark(page, "Umiem", 1);
    await mark(page, "Do powtórki", 2);
    const unknownQuestion = await page.getByRole("heading", { level: 1 }).innerText();
    await mark(page, "Nie umiem", 3);

    await page.getByRole("button", { name: "Zakończ sesję" }).first().click();
    await page.waitForURL("**/podsumowanie/*");
    await expect(page.getByRole("heading", { level: 1, name: "Podsumowanie sesji" })).toBeVisible();
    await expect(page.getByText(/Wszystkie · \d+ (minuta|minuty|minut) · /)).toBeVisible();

    const read = async () => ({
      reviewed: await tile(page, "Przejrzane fiszki").innerText(),
      know: await tile(page, "Umiem").innerText(),
      repeat: await tile(page, "Do powtórki").innerText(),
      unknown: await tile(page, "Nie umiem").innerText(),
    });
    const first = await read();
    expect(first.reviewed).toContain("3");
    expect(first.reviewed).toContain("z 20 w kolejce");
    expect(first.know).toMatch(/1[\s\S]*w tym 0 powtórek/);
    expect(first.repeat).toMatch(/1[\s\S]*wrócą w następnej sesji/);
    expect(first.unknown).toMatch(/1[\s\S]*licznik wyzerowany/);

    await expect(page.getByRole("heading", { name: "Oceniłeś „Nie umiem”" })).toBeVisible();
    await expect(page.getByRole("link", { name: new RegExp(unknownQuestion.slice(0, 30)) })).toContainText(
      "Pierwszy raz w sesji",
    );
    await expect(page.getByText("Fiszki ukryte na tydzień")).toHaveCount(0);

    await page.reload();
    await page.reload();
    expect(await read()).toEqual(first);
    await expect(page.getByRole("button", { name: "Zakończ sesję" })).toHaveCount(0);
  });

  test("Wróć na start leaves the summary; the session is closed, so nauka leads back to start", async ({ page }) => {
    await registerAndStart(page);
    await page.getByRole("button", { name: "Zakończ sesję" }).first().click();
    await page.waitForURL("**/podsumowanie/*");
    await page.getByRole("link", { name: "Wróć na start" }).first().click();
    await page.waitForURL((url) => url.pathname === "/");
    await page.goto("/nauka");
    await page.waitForURL((url) => url.pathname === "/");
  });

  test("nothing marked shows the empty message and keeps both actions (AC-09.10)", async ({ page }) => {
    await registerAndStart(page);
    await page.getByRole("button", { name: "Zakończ sesję" }).first().click();
    await page.waitForURL("**/podsumowanie/*");
    await expect(page.getByRole("heading", { name: "Nie oceniłeś żadnej fiszki w tej sesji" })).toBeVisible();
    await expect(page.getByText("Przejrzane fiszki")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Ucz się dalej" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Wróć na start" }).first()).toBeVisible();
  });

  test("passing the last card opens the summary; Ucz się dalej keeps category and search (AC-09.2, 09.8)", async ({
    page,
  }) => {
    await registerAndStart(page);
    await page.getByRole("button", { name: /^API\/HTTP/ }).click();
    await expect(page.getByText("Kategoria: API/HTTP")).toBeVisible();
    await page.fill("#query", "idempotent");
    await page.press("#query", "Enter");
    await expect(page.getByText("w sesji")).toContainText("Fiszka 1 z 3 w sesji");

    await mark(page, "Umiem", 1);
    await mark(page, "Do powtórki", 2);
    await page.getByRole("button", { name: "Nie umiem", exact: true }).click();
    await page.waitForURL("**/podsumowanie/*");

    await expect(page.getByText(/API\/HTTP · \d+ (minuta|minuty|minut) · /)).toBeVisible();
    await expect(tile(page, "Przejrzane fiszki")).toContainText("z 3 w kolejce");
    await expect(tile(page, "Przejrzane fiszki")).toContainText("3");

    await page.getByRole("button", { name: "Ucz się dalej" }).last().click();
    await page.waitForURL("**/nauka");
    await expect(page.getByText("Kategoria: API/HTTP")).toBeVisible();
    await expect(page.locator("#query")).toHaveValue("idempotent");
  });

  test("another person's summary is the same 404 as a missing one (AC-09.9)", async ({ page, browser }) => {
    await registerAndStart(page);
    await page.getByRole("button", { name: "Zakończ sesję" }).first().click();
    await page.waitForURL("**/podsumowanie/*");
    const ownUrl = page.url();

    const otherContext = await browser.newContext();
    const other = await otherContext.newPage();
    await registerAndStart(other);
    const foreign = await other.goto(ownUrl);
    await expect(other.getByText("Błąd 404")).toBeVisible();
    const foreignText = await other.locator("body").innerText();
    const missing = await other.goto("/podsumowanie/999999");
    await expect(other.getByText("Błąd 404")).toBeVisible();
    const missingText = await other.locator("body").innerText();
    expect(foreign?.status()).toBe(404);
    expect(missing?.status()).toBe(404);
    expect(foreignText).toBe(missingText);
    await otherContext.close();
  });

  test("a Guest opening a summary is sent to sign-in", async ({ page }) => {
    await page.goto("/podsumowanie/1");
    await expect(page).toHaveURL(`/logowanie?powrot=${encodeURIComponent("/podsumowanie/1")}`);
  });
});
