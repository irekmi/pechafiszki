import { expect, test } from "@playwright/test";

/**
 * NFR-03's first flow: rejestracja → logowanie → start (SCR-02 → SCR-01 → SCR-05, over API-01,
 * API-02), test scenario 1 of the stage file. The account is created once, through the real
 * registration form and a real database (`tests/e2e/setup/withDb.ts`).
 *
 * SCR-14's own **Wyloguj się** control — the one screen that calls API-38 from the interface — is
 * built in a later stage. Sessions here are stateless JWTs (`DEC-45`), so clearing the cookie is
 * exactly API-38's own effect; it stands in for that not-yet-built button rather than skipping the
 * "sign out" step of the flow.
 */
test.describe("NFR-03 flow 1 — rejestracja → logowanie → start", () => {
  test("register, sign out, sign in, arrive at SCR-05 greeted by the new nickname (AC-07.1)", async ({
    page,
  }) => {
    const stamp = Date.now();
    const email = `flow1-${stamp}@example.test`;
    const nickname = `flow1_${stamp % 100000}`;
    const password = "correct horse battery staple";

    await page.goto("/rejestracja");
    await page.waitForLoadState("networkidle");
    await page.fill("#email", email);
    await page.fill("#nickname", nickname);
    await page.fill("#password", password);
    await page.fill("#password_repeat", password);
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => url.pathname === "/");
    await expect(page.getByRole("heading", { name: `Cześć, ${nickname}` })).toBeVisible();
    await expect(page.locator('a[href="/fiszki?mark=know"]')).toContainText("0% puli");

    // SQ-01.1: the old address is kept as a permanent redirect to SCR-05 at `/`.
    await page.goto("/start");
    await expect(page).toHaveURL("/");

    await page.context().clearCookies();
    await page.goto("/");
    await expect(page).toHaveURL("/logowanie");

    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => url.pathname === "/");
    await expect(page.getByRole("heading", { name: `Cześć, ${nickname}` })).toBeVisible();
    await expect(page.getByRole("link", { name: "Administracja" })).toHaveCount(0);
  });
});
