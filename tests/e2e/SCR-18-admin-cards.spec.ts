import { expect, test, type Page } from "@playwright/test";
import { adminPage, approve, register, reject, stamp, submitCard } from "./setup/review";

/**
 * SCR-18 — the administration table of every flashcard (AC-17.1 - 17.9). Real registration, real
 * administrator (`review.ts`), the shared database: every test creates its own cards under a unique
 * token and finds them by searching for it, so nothing depends on the global queue or on a count
 * (ISS-24). The paging test only reads the seeded pool, which is always larger than 200.
 */

const TABLE = "/administracja/fiszki";
const NO_MATCH = "Żadna fiszka nie spełnia Twoich filtrów";

const rowOf = (page: Page, question: string) => page.getByRole("row").filter({ hasText: question });

/** Opens SCR-18 already filtered to the test's own token, once the filter bar has hydrated. */
async function openFor(admin: Page, token: string): Promise<void> {
  await admin.goto(`${TABLE}?query=${encodeURIComponent(token)}`);
  await expect(admin.getByRole("heading", { level: 1, name: "Wszystkie fiszki" })).toBeVisible();
  await admin.waitForFunction(() =>
    Object.keys(document.querySelector("#status") ?? {}).some((key) => key.startsWith("__reactProps")),
  );
}

test.describe("SCR-18 — find, link and clear (AC-17.1, 17.2, 17.5, 17.7, 17.9)", () => {
  test("three statuses, folded search, row links, the rejection reason, filters and Wyczyść filtry", async ({
    page,
    browser,
  }) => {
    const id = stamp();
    const token = `zażółć${id}`;
    const [approved, pending, rejected] = [`${token} zatwierdzona?`, `${token} oczekująca?`, `${token} odrzucona?`];
    await register(page);
    for (const question of [approved, pending, rejected]) await submitCard(page, question);
    const admin = await adminPage(browser);
    await approve(admin, approved);
    await reject(admin, rejected, "Duplikat istniejącej fiszki.");

    await openFor(admin, token);
    await expect(admin.getByText("Pokazano 3 z 3 fiszek")).toBeVisible();
    await expect(rowOf(admin, approved)).toContainText("Zatwierdzona");
    await expect(rowOf(admin, pending)).toContainText("Oczekuje");
    await expect(rowOf(admin, rejected)).toContainText("Odrzucona");
    await expect(rowOf(admin, rejected)).toContainText("Powód odrzucenia: Duplikat istniejącej fiszki.");
    await expect(rowOf(admin, approved)).toContainText("Odpowiedź do oceny.");
    await expect(admin.getByText(/^\d+ (fiszka|fiszki|fiszek): \d+ zatwierdzon\S+, \d+ oczekując\S+, \d+ odrzucon\S+$/)).toBeVisible();

    await expect(admin.getByRole("link", { name: approved })).toHaveAttribute("href", /^\/fiszki\/\d+$/);
    await expect(admin.getByRole("link", { name: pending })).toHaveAttribute("href", /^\/administracja\/ocena\/\d+$/);
    await expect(admin.getByRole("link", { name: rejected })).toHaveAttribute("href", /^\/edytuj\/\d+$/);
    await expect(rowOf(admin, pending).getByRole("link", { name: "Edytuj" })).toHaveAttribute("href", /^\/edytuj\/\d+$/);
    await expect(admin.getByRole("link", { name: "Dodaj fiszkę" })).toHaveAttribute("href", "/dodaj");

    // Search folds case and diacritics, and reaches the answer as well as the question.
    for (const phrase of [token.toUpperCase(), `zazolc${id}`]) {
      await admin.goto(`${TABLE}?query=${encodeURIComponent(phrase)}`);
      await expect(admin.getByText("Pokazano 3 z 3 fiszek")).toBeVisible();
    }
    await admin.goto(`${TABLE}?query=${encodeURIComponent(`zazolc${id} ODPOWIEDZ DO OCENY`)}`);
    await expect(admin.getByText(NO_MATCH)).toBeVisible();

    await openFor(admin, token);
    await admin.selectOption("#status", "pending");
    await expect(admin).toHaveURL(new RegExp(`\\?query=[^&]+&status=pending$`));
    await expect(rowOf(admin, pending)).toHaveCount(1);
    await expect(rowOf(admin, approved)).toHaveCount(0);
    await expect(admin.getByText("Pokazano 1 z 1 fiszki")).toBeVisible();

    await admin.selectOption("#status", "");
    await admin.selectOption("#category", { label: "React" });
    await expect(admin.getByText(NO_MATCH)).toBeVisible();
    await admin.locator("section").getByRole("button", { name: "Wyczyść filtry" }).click();
    await expect(admin).toHaveURL(new RegExp(`${TABLE}$`));
    await expect(admin.getByText(/^Pokazano 20 z \d+ fiszek$/)).toBeVisible();
    await admin.selectOption("#status", "approved");
    await expect(admin).toHaveURL(/\?status=approved$/);
    await admin.getByRole("search").getByRole("button", { name: "Wyczyść filtry" }).click();
    await expect(admin).toHaveURL(new RegExp(`${TABLE}$`));
    await expect(admin.locator("#status")).toHaveValue("");

    await openFor(admin, token);
    await admin.selectOption("#sort", "author");
    await expect(admin).toHaveURL(/sort=author/);
    await expect(admin.getByText("Pokazano 3 z 3 fiszek")).toBeVisible();
    await admin.context().close();
  });
});

test.describe("SCR-18 — Usuń (AC-17.3)", () => {
  test("the row leaves with its filters kept and the toast; the card is gone for learners", async ({ page, browser }) => {
    const question = `Do usunięcia ${stamp()}?`;
    await register(page);
    await submitCard(page, question);
    const admin = await adminPage(browser);
    await approve(admin, question);
    await page.goto(`/fiszki?query=${encodeURIComponent(question)}`);
    await page.getByRole("link", { name: question }).click();
    await page.waitForURL(/\/fiszki\/\d+/);
    const detail = new URL(page.url()).pathname;
    await page.getByRole("button", { name: "Umiem", exact: true }).click();
    await expect(page.getByText("Zapisano ocenę")).toBeVisible();

    await openFor(admin, question);
    await expect(admin.getByText("Pokazano 1 z 1 fiszki")).toBeVisible();
    await rowOf(admin, question).getByRole("button", { name: "Usuń" }).click();
    const dialog = admin.getByRole("dialog", { name: "Usunąć tę fiszkę na stałe?" });
    await expect(dialog).toContainText("Uczący się stracą swój postęp na tej fiszce. Tej operacji nie można cofnąć.");
    await dialog.getByRole("button", { name: "Anuluj" }).click();
    await expect(rowOf(admin, question)).toHaveCount(1);

    await rowOf(admin, question).getByRole("button", { name: "Usuń" }).click();
    await admin.getByRole("dialog").getByRole("button", { name: "Usuń fiszkę" }).click();
    await expect(admin.getByRole("status")).toHaveText("Fiszka usunięta");
    await expect(rowOf(admin, question)).toHaveCount(0);
    await expect(admin.getByText(NO_MATCH)).toBeVisible();
    expect(new URL(admin.url()).searchParams.get("query")).toBe(question);
    await expect(admin.getByText(/^\d+ (fiszka|fiszki|fiszek): /)).toBeVisible();

    await page.goto(`/fiszki?query=${encodeURIComponent(question)}`);
    await expect(page.getByRole("link", { name: question })).toHaveCount(0);
    expect((await page.goto(detail))?.status()).toBe(404);
    await admin.context().close();
  });
});

test.describe("SCR-18 — paging, refusal and escaping (AC-17.4, 17.8)", () => {
  test("20 rows, Pokaż więcej adds 20 and changes the URL, limit above 200 is capped", async ({ browser }) => {
    const admin = await adminPage(browser);
    await admin.goto(TABLE);
    await expect(admin.getByText(/^Pokazano 20 z \d+ fiszek$/)).toBeVisible();
    await expect(admin.getByRole("row")).toHaveCount(21);
    await admin.getByRole("link", { name: "Pokaż więcej" }).click();
    await expect(admin).toHaveURL(/\?limit=40$/);
    await expect(admin.getByRole("row")).toHaveCount(41);
    await admin.goto(`${TABLE}?limit=99999`);
    await expect(admin.getByRole("row")).toHaveCount(201);
    await expect(admin.getByRole("link", { name: "Pokaż więcej" })).toHaveCount(0);
    await admin.goto(`${TABLE}?limit=25&sort=zzz&status=nope&category=abc`);
    await expect(admin.getByRole("row")).toHaveCount(21);
    await admin.context().close();
  });

  test("a User gets SCR-22's 403 variant, a Guest is sent to SCR-01", async ({ page, browser }) => {
    const guest = await (await browser.newContext()).newPage();
    await guest.goto(TABLE);
    await expect(guest).toHaveURL(/\/logowanie\?powrot=/);
    await guest.context().close();
    await register(page);
    const response = await page.goto(TABLE);
    expect(response?.status()).toBe(403);
    await expect(page.getByText("Błąd 403")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Wszystkie fiszki" })).toHaveCount(0);
  });

  test("markup in a question is shown as text and never runs (DEV-03)", async ({ page, browser }) => {
    const id = stamp();
    const question = `<img src="x" onerror="window.__xss=1"> ${id}?`;
    await register(page);
    await submitCard(page, question);
    const admin = await adminPage(browser);
    await openFor(admin, id);
    await expect(admin.getByRole("link", { name: question })).toBeVisible();
    await expect(admin.locator('main img[src="x"]')).toHaveCount(0);
    expect(await admin.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
    await admin.context().close();
  });
});
