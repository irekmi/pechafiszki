import { expect, test, type Page } from "@playwright/test";

/**
 * SCR-10 → SCR-11 — submit a flashcard and find it among "Moje fiszki" (AC-13.1, 13.2, 13.5, 13.6,
 * 13.8, 13.9). Real registration, real database (`tests/e2e/setup/withDb.ts`). The final step of
 * NFR-03's third flow — the administrator approving it — closes in ST-15 and is not driven here.
 */

async function register(page: Page): Promise<void> {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const password = "correct horse battery staple";
  await page.goto("/rejestracja");
  await page.waitForLoadState("networkidle");
  await page.fill("#email", `submit-${stamp}@example.test`);
  await page.fill("#nickname", `sub_${stamp.slice(-9)}`);
  await page.fill("#password", password);
  await page.fill("#password_repeat", password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => url.pathname === "/");
  await page.waitForLoadState("networkidle");
}

const preview = (page: Page) => page.locator("article");

/**
 * Opens SCR-10 and waits until the form is hydrated: typing before that would be overwritten by
 * React's first render. (`networkidle` never settles here — the top bar prefetches two screens that
 * later stages build.)
 */
async function openForm(page: Page): Promise<void> {
  await page.goto("/dodaj");
  await expect(async () => {
    await page.fill("#question", "x");
    await expect(preview(page)).toContainText("x");
  }).toPass();
  await page.fill("#question", "");
}
const tab = (page: Page, name: RegExp) => page.getByRole("tab", { name });

test.describe("SCR-10 / SCR-11 — submit a flashcard", () => {
  test("the preview follows the form; a refusal keeps what was typed (AC-13.5, AC-13.6)", async ({ page }) => {
    await register(page);
    await openForm(page);
    await expect(page.getByRole("heading", { level: 1, name: "Dodaj fiszkę" })).toBeVisible();
    await expect(preview(page)).toContainText("Odpowiedź pojawi się tutaj, gdy wypełnisz pole „Odpowiedź”.");

    await page.selectOption("#category", { label: "PHP" });
    await page.fill("#question", "Czym jest late static binding?");
    await expect(preview(page)).toContainText("PHP");
    await expect(preview(page)).toContainText("Czym jest late static binding?");

    await page.click('button[type="submit"]');
    await expect(page.getByText("Odpowiedź jest wymagana")).toBeVisible();
    await expect(page).toHaveURL(/\/dodaj$/);
    await expect(page.locator("#question")).toHaveValue("Czym jest late static binding?");
    await expect(page.locator("#category")).toHaveValue(/\d+/);

    await page.selectOption("#category", { label: "Wybierz kategorię" });
    await page.fill("#answer", "static:: rozwiązuje klasę w czasie wykonania.");
    await expect(preview(page)).toContainText("static:: rozwiązuje klasę w czasie wykonania.");
    await page.click('button[type="submit"]');
    await expect(page.getByText("Wybierz kategorię", { exact: true }).last()).toBeVisible();
    await expect(page.locator("#answer")).toHaveValue("static:: rozwiązuje klasę w czasie wykonania.");
  });

  test("a submitted card is Oczekuje on SCR-11 and absent from SCR-08; tabs live in the URL (AC-13.1, 13.2, 13.9)", async ({
    page,
  }) => {
    await register(page);
    await openForm(page);
    await page.selectOption("#category", { label: "Testy" });
    await page.fill("#question", "Czym różni się mock od stuba w PHPUnit?");
    await page.fill("#answer", "Mock weryfikuje wywołania, stub tylko zwraca wartości.");
    await page.fill("#code_example", "$stub = $this->createStub(Repo::class);");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/moje-fiszki\?zmiana=wyslana$/);
    await expect(page.getByRole("status")).toHaveText("Fiszka wysłana do zatwierdzenia");
    await expect(page.getByText("1 zgłoszenie · 1 oczekuje na decyzję administratora")).toBeVisible();
    const row = page.locator('main a[href^="/fiszki/"]');
    await expect(row).toHaveCount(1);
    await expect(row).toContainText("Czym różni się mock od stuba w PHPUnit?");
    await expect(row).toContainText("Testy");
    await expect(row).toContainText("Oczekuje");

    await tab(page, /Zatwierdzone/).click();
    await expect(page).toHaveURL(/status=approved/);
    await expect(row).toHaveCount(0);
    await expect(tab(page, /Wszystkie \(1\)/)).toBeVisible();
    await expect(tab(page, /Oczekujące \(1\)/)).toBeVisible();
    await tab(page, /Oczekujące/).click();
    await expect(page).toHaveURL(/status=pending/);
    await expect(row).toHaveCount(1);
    await expect(page.getByText("Fiszka wysłana do zatwierdzenia")).toHaveCount(0);

    await page.goto("/fiszki?query=stuba");
    await expect(page.getByText("Żadna fiszka nie spełnia Twoich filtrów")).toBeVisible();
    await page.goto("/fiszki");
    await expect(page.getByText("220 fiszek spełniają wybrane filtry")).toBeVisible();
  });

  test("another person sees none of it and starts from the empty state (AC-13.8)", async ({ browser, page }) => {
    await register(page);
    await openForm(page);
    await page.selectOption("#category", { label: "Security" });
    await page.fill("#question", "Czym jest CSRF i jak się przed nim bronić?");
    await page.fill("#answer", "Atak wymuszający akcję w imieniu zalogowanego użytkownika.");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/moje-fiszki/);
    const href = await page.locator('main a[href^="/fiszki/"]').first().getAttribute("href");

    const other = await browser.newPage();
    await register(other);
    await other.goto("/moje-fiszki");
    await expect(other.getByRole("heading", { level: 2, name: "Nie dodałeś jeszcze żadnej fiszki" })).toBeVisible();
    await expect(other.getByText("0 zgłoszeń")).toBeVisible();
    await expect(other.getByRole("link", { name: "Zobacz istniejące fiszki" })).toBeVisible();
    const refused = await other.goto(href ?? "/fiszki/0");
    expect(refused?.status()).toBe(404);
    await other.close();
  });
});
