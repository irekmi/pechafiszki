import { expect, test } from "@playwright/test";

test.describe("SCR-22 — błąd", () => {
  test("an unknown address answers 404 and renders the not-found variant", async ({ page }) => {
    const response = await page.goto("/nie-ma-takiej-strony");
    expect(response?.status()).toBe(404);
    await expect(page.getByText("Błąd 404")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nie znaleziono strony" })).toBeVisible();
  });

  test("a signed-out visitor sees only Wróć do logowania", async ({ page }) => {
    await page.goto("/nie-ma-takiej-strony");
    await expect(page.getByRole("link", { name: "Wróć do logowania" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Wróć na start" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Przeglądaj fiszki" })).toHaveCount(0);
  });

  test("the shell carries the mockups' background and page width", async ({ page }) => {
    await page.goto("/");
    const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(background).toBe("rgb(255, 248, 232)");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
