import { expect, test, type Page } from "@playwright/test";
import { adminPage, approve, register, reject, stamp, submitCard } from "./setup/review";

/**
 * SCR-12, SCR-09 and SCR-11 — edit and delete a flashcard (AC-16.1 - 16.9). Real registration, real
 * administrator (`review.ts`), the shared database: every assertion is about a card found by its own
 * unique question, never about a count. The refusals are asserted on the HTTP status and the rendered
 * page, side by side with a card that does not exist.
 */

const NOT_FOUND = "Błąd 404";
const RESUBMITTED = "Zapisano i wysłano do zatwierdzenia";

/** The address of a card's edit form, read from its row on SCR-11 (pending and rejected rows link there). */
async function editHref(page: Page, question: string): Promise<string> {
  await page.goto("/moje-fiszki");
  const href = await page.getByRole("link", { name: new RegExp(question.slice(0, 20)) }).first().getAttribute("href");
  expect(href).toMatch(/^\/edytuj\/\d+$/);
  return href ?? "";
}

/** Opens a form address and waits for React to hydrate the category select, so typing is not lost. */
async function openForm(page: Page, href: string): Promise<void> {
  await page.goto(href);
  await expect(page.getByRole("heading", { level: 1, name: "Edytuj fiszkę" })).toBeVisible();
  await page.waitForFunction(() =>
    Object.keys(document.querySelector("#category") ?? {}).some((key) => key.startsWith("__reactProps")),
  );
}

test.describe("SCR-12 — correct and resubmit, then approve from the form", () => {
  test("a rejected card is corrected, returns to the queue, and the administrator approves it from SCR-12 (AC-16.1, 16.2, 16.4, 16.5)", async ({
    page,
    browser,
  }) => {
    const question = `Poprawka ${stamp()}?`;
    await register(page);
    await submitCard(page, question);
    const admin = await adminPage(browser);
    await reject(admin, question, "Odpowiedź jest zbyt ogólna.");

    const href = await editHref(page, question);
    await openForm(page, href);
    await expect(page.locator("span.badge, span").filter({ hasText: /^Odrzucona$/ }).first()).toBeVisible();
    await expect(page.getByText("Powód odrzucenia:")).toBeVisible();
    await expect(page.getByText("Odpowiedź jest zbyt ogólna.")).toBeVisible();
    await expect(page.getByText("Decyzję podjął")).toBeVisible();
    await expect(page.getByText("Zapis jako administrator")).toHaveCount(0);
    expect(await page.content()).not.toContain("Zapisz i zatwierdź");

    const fixed = `${question} (poprawione)`;
    await page.fill("#question", fixed);
    await expect(page.locator("article")).toContainText(fixed);
    await page.getByRole("button", { name: "Zapisz i wyślij do zatwierdzenia" }).click();
    await expect(page).toHaveURL(/\/moje-fiszki\?zmiana=zapisana$/);
    await expect(page.getByRole("status")).toHaveText(RESUBMITTED);
    const row = page.getByRole("link", { name: new RegExp(fixed.slice(0, 20)) });
    await expect(row).toContainText("Oczekuje");
    await expect(row).not.toContainText("Powód odrzucenia");

    await admin.goto("/administracja/oczekujace?sort=newest");
    await expect(admin.getByRole("link", { name: fixed })).toBeVisible();

    await openForm(admin, href);
    await expect(admin.getByText("Zapis jako administrator")).toBeVisible();
    await expect(admin.getByText("Odrzucona", { exact: true })).toBeVisible();
    await admin.fill("#answer", "Poprawiona odpowiedź administratora.");
    await admin.getByRole("button", { name: "Zapisz i zatwierdź" }).click();
    await expect(admin).toHaveURL(/\/administracja\/oczekujace$/);

    await page.goto(`/fiszki?query=${encodeURIComponent(fixed)}`);
    await expect(page.getByRole("link", { name: fixed })).toBeVisible();
    await admin.context().close();
  });

  test("Zapisz zmiany keeps the status and shows the toast (AC-16.5)", async ({ page, browser }) => {
    const question = `Zmiany admina ${stamp()}?`;
    await register(page);
    await submitCard(page, question);
    const href = await editHref(page, question);
    const admin = await adminPage(browser);
    await openForm(admin, href);
    await admin.fill("#answer", "Tekst po zmianie.");
    await admin.getByRole("button", { name: "Zapisz zmiany" }).click();
    await expect(admin.getByText("Zmiany zapisane")).toBeVisible();
    await expect(admin).toHaveURL(new RegExp(`${href}$`));
    await expect(admin.getByText("Oczekuje", { exact: true }).first()).toBeVisible();
    await admin.reload();
    await expect(admin.locator("#answer")).toHaveValue("Tekst po zmianie.");
    await admin.context().close();
  });
});

test.describe("SCR-12 — the object rules (AC-16.3, AC-16.4)", () => {
  test("another person's card and one's own approved card answer like a card that does not exist", async ({
    page,
    browser,
  }) => {
    const question = `Cudza ${stamp()}?`;
    await register(page);
    await submitCard(page, question);
    const href = await editHref(page, question);

    const other = await (await browser.newContext()).newPage();
    await register(other);
    const missing = await other.goto("/edytuj/2147483000");
    await expect(other.getByText(NOT_FOUND)).toBeVisible();
    const missingText = await other.locator("body").innerText();
    const foreign = await other.goto(href);
    await expect(other.getByText(NOT_FOUND)).toBeVisible();
    expect(foreign?.status()).toBe(404);
    expect(missing?.status()).toBe(404);
    expect(await other.locator("body").innerText()).toBe(missingText);
    await other.context().close();

    const admin = await adminPage(browser);
    await approve(admin, question);
    const own = await page.goto(href);
    expect(own?.status()).toBe(404);
    await expect(page.getByText(NOT_FOUND)).toBeVisible();
    await admin.context().close();
  });
});

test.describe("SCR-12 — the race with an approval (AC-16.6, DEC-58)", () => {
  test("a save after the card was approved is refused and the form goes read-only", async ({ page, browser }) => {
    const question = `Wyścig zapisu ${stamp()}?`;
    await register(page);
    await submitCard(page, question);
    const href = await editHref(page, question);
    await openForm(page, href);

    const admin = await adminPage(browser);
    await approve(admin, question);

    await page.fill("#question", "Podmienione pytanie?");
    await page.getByRole("button", { name: "Zapisz i wyślij do zatwierdzenia" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Ta fiszka została już zatwierdzona" })).toBeVisible();
    await expect(page.locator("#question")).toBeDisabled();
    await expect(page.getByRole("button", { name: "Zapisz i wyślij do zatwierdzenia" })).toHaveCount(0);

    await page.goto(`/fiszki?query=${encodeURIComponent(question)}`);
    await expect(page.getByRole("link", { name: question })).toBeVisible();
    await admin.context().close();
  });
});

test.describe("delete (AC-16.7, AC-16.8, AC-16.9)", () => {
  test("the author deletes their pending card from SCR-12; it is gone from SCR-11 and the queue", async ({ page, browser }) => {
    const question = `Do usunięcia ${stamp()}?`;
    await register(page);
    await submitCard(page, question);
    const href = await editHref(page, question);
    await openForm(page, href);
    await page.getByRole("button", { name: "Usuń fiszkę" }).click();
    const dialog = page.getByRole("dialog", { name: "Usunąć tę fiszkę na stałe?" });
    await expect(dialog).toContainText("Fiszka zniknie z Twoich zgłoszeń i z kolejki administratora.");
    await dialog.getByRole("button", { name: "Anuluj" }).click();
    await expect(dialog).toHaveCount(0);
    await page.getByRole("button", { name: "Usuń fiszkę" }).click();
    await dialog.getByRole("button", { name: "Usuń fiszkę" }).click();
    await expect(page).toHaveURL(/\/moje-fiszki$/);
    await expect(page.getByRole("link", { name: new RegExp(question.slice(0, 20)) })).toHaveCount(0);
    expect((await page.goto(href))?.status()).toBe(404);

    const admin = await adminPage(browser);
    await admin.goto("/administracja/oczekujace?sort=newest");
    await expect(admin.getByRole("link", { name: question })).toHaveCount(0);
    await admin.context().close();
  });

  test("an administrator deletes an approved card from SCR-09, with its progress; a User sees no such buttons", async ({
    page,
    browser,
  }) => {
    const question = `Usuwana zatwierdzona ${stamp()}?`;
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
    await expect(page.getByRole("link", { name: "Edytuj" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Usuń" })).toHaveCount(0);
    expect(await page.content()).not.toContain("Usuń");

    await admin.goto(detail);
    await expect(admin.getByRole("link", { name: "Edytuj" })).toHaveAttribute("href", /^\/edytuj\/\d+$/);
    await admin.getByRole("button", { name: "Usuń", exact: true }).click();
    const dialog = admin.getByRole("dialog", { name: "Usunąć tę fiszkę na stałe?" });
    await expect(dialog).toContainText("Uczący się stracą swój postęp na tej fiszce.");
    await dialog.getByRole("button", { name: "Usuń fiszkę" }).click();
    await expect(admin).toHaveURL(/\/administracja\/fiszki$/);

    await page.goto(`/fiszki?query=${encodeURIComponent(question)}`);
    await expect(page.getByRole("link", { name: question })).toHaveCount(0);
    expect((await page.goto(detail))?.status()).toBe(404);
    await admin.context().close();
  });
});
