import { expect, test } from "@playwright/test";
import { adminPage, openReview, register, stamp, submitCard } from "./setup/review";

/**
 * SCR-17 and NFR-03 flow 3 — submit a flashcard → an administrator approves it → it appears in the
 * library (AC-15.1 - 15.12). The database is shared with the other specs, which leave their own cards
 * in the queue: every assertion is about a card found by its own unique question, and never about a
 * fixed count or a fixed "next" card.
 */

const REVIEW = /\/administracja\/ocena\/\d+$/;
const decisionCard = (page: import("@playwright/test").Page) => page.locator("section", { hasText: "Decyzja" });

test.describe("flow 3 — submit → approve → library", () => {
  test("a submission is approved on SCR-17 and the author finds it in the library and studies it (AC-15.1, 15.2, 15.12)", async ({
    page,
    browser,
  }) => {
    const question = `Przepływ 3 ${stamp()}?`;
    await register(page);
    await submitCard(page, question);
    await page.goto(`/fiszki?query=${encodeURIComponent(question)}`);
    await expect(page.getByRole("link", { name: question })).toHaveCount(0);

    const admin = await adminPage(browser);
    await openReview(admin, question);
    await expect(admin.getByText(/^Zgłoszenie \d+ z \d+$/)).toBeVisible();
    await expect(admin.getByText("Oczekuje", { exact: true })).toBeVisible();
    await expect(admin.getByText("Podgląd fiszki w sesji")).toBeVisible();
    const reviewUrl = admin.url();
    await admin.getByRole("button", { name: "Zatwierdź" }).click();
    await expect(admin).not.toHaveURL(reviewUrl);
    await admin.goto("/administracja/oczekujace?sort=newest");
    await expect(admin.getByRole("link", { name: question })).toHaveCount(0);

    await page.goto(`/fiszki?query=${encodeURIComponent(question)}`);
    await expect(page.getByRole("link", { name: question })).toBeVisible();
    await page.getByRole("button", { name: "Ucz się z tych fiszek" }).click();
    await expect(page.getByRole("heading", { level: 1, name: question })).toBeVisible();
    await admin.context().close();
  });

  test("changing the category before approving files the card under the new one (AC-15.3)", async ({ page, browser }) => {
    const question = `Zła kategoria ${stamp()}?`;
    await register(page);
    await submitCard(page, question, "PHP");
    const admin = await adminPage(browser);
    await openReview(admin, question);
    await expect(admin.locator("#category")).toHaveValue(/\d+/);
    await expect(admin.getByText("Kategorię można zmienić przed zatwierdzeniem.")).toBeVisible();
    await admin.selectOption("#category", { label: "Symfony" });
    const reviewUrl = admin.url();
    await admin.getByRole("button", { name: "Zatwierdź" }).click();
    await expect(admin).not.toHaveURL(reviewUrl);

    await page.goto(`/fiszki?query=${encodeURIComponent(question)}`);
    const row = page.getByRole("link", { name: question });
    await expect(row).toBeVisible();
    await expect(row).toContainText("Symfony");
    await expect(row).not.toContainText("PHP");
    await admin.context().close();
  });
});

test.describe("SCR-17 — rejecting, the queue and the refusals", () => {
  test("Odrzuć needs a reason and the author reads it on SCR-11 (AC-15.4)", async ({ page, browser }) => {
    const question = `Odrzut z oceny ${stamp()}?`;
    await register(page);
    await submitCard(page, question);
    const admin = await adminPage(browser);
    await openReview(admin, question);
    await admin.getByRole("button", { name: "Odrzuć", exact: true }).click();
    const dialog = admin.getByRole("dialog", { name: "Odrzuć fiszkę" });
    await expect(dialog.getByText(/Powód jest wymagany\. Autor zobaczy go w „Moich fiszkach”/)).toBeVisible();
    await dialog.getByRole("button", { name: "Odrzuć fiszkę" }).click();
    await expect(dialog.getByText("Powód odrzucenia jest wymagany")).toBeVisible();
    await dialog.getByLabel("Powód odrzucenia").fill("Brakuje przykładu kodu.");
    const reviewUrl = admin.url();
    await dialog.getByRole("button", { name: "Odrzuć fiszkę" }).click();
    await expect(admin).not.toHaveURL(reviewUrl);

    await page.goto("/moje-fiszki");
    await expect(page.getByText("Powód odrzucenia: Brakuje przykładu kodu.")).toBeVisible();
    await admin.context().close();
  });

  test("Poprzednie / Następne zgłoszenie move without deciding anything (AC-15.6)", async ({ page, browser }) => {
    const [first, second] = [`Kolejka A ${stamp()}?`, `Kolejka B ${stamp()}?`];
    await register(page);
    await submitCard(page, first);
    await submitCard(page, second);
    const admin = await adminPage(browser);
    await openReview(admin, first);
    const start = admin.url();
    await admin.getByRole("link", { name: "Następne zgłoszenie" }).click();
    await expect(admin).not.toHaveURL(start);
    await expect(admin).toHaveURL(REVIEW);
    await admin.getByRole("link", { name: "Poprzednie zgłoszenie" }).click();
    await expect(admin).toHaveURL(start);
    await expect(admin.getByText(first).first()).toBeVisible();

    await admin.goto("/administracja/oczekujace?sort=newest");
    await expect(admin.getByRole("link", { name: first })).toBeVisible();
    await expect(admin.getByRole("link", { name: second })).toBeVisible();
    await admin.context().close();
  });

  test("a near-duplicate of a seeded question lists it, and approving still works (AC-15.8)", async ({ page, browser }) => {
    const question = `Co robi declare(strict_types=1) w PHP? ${stamp()}`;
    await register(page);
    await submitCard(page, question, "PHP");
    const admin = await adminPage(browser);
    await openReview(admin, question);
    await expect(admin.getByText("Podobne pytania w puli")).toBeVisible();
    await expect(admin.getByRole("link", { name: "Co robi declare(strict_types=1)?" })).toBeVisible();
    const reviewUrl = admin.url();
    await admin.getByRole("button", { name: "Zatwierdź" }).click();
    await expect(admin).not.toHaveURL(reviewUrl);
    await admin.context().close();
  });

  test("a card decided in another session shows the already-reviewed message (AC-15.9)", async ({ page, browser }) => {
    const question = `Wyścig oceny ${stamp()}?`;
    await register(page);
    await submitCard(page, question);
    const [first, second] = [await adminPage(browser), await adminPage(browser)];
    await openReview(first, question);
    await openReview(second, question);
    const firstUrl = first.url();
    await first.getByRole("button", { name: "Zatwierdź" }).click();
    await expect(first).not.toHaveURL(firstUrl);

    await second.getByRole("button", { name: "Zatwierdź" }).click();
    await expect(second.getByRole("heading", { name: "Ta fiszka została już oceniona" })).toBeVisible();
    await expect(decisionCard(second).getByRole("button", { name: "Zatwierdź" })).toHaveCount(0);
    await second.getByRole("link", { name: "Wróć do kolejki" }).click();
    await expect(second).toHaveURL(/\/administracja\/oczekujace$/);
    await first.context().close();
    await second.context().close();
  });

  test("a User gets SCR-22's 403 variant, a Guest is sent to SCR-01 (AC-15.10)", async ({ page }) => {
    await page.goto("/administracja/ocena/1");
    await expect(page).toHaveURL(/\/logowanie\?powrot=/);
    await register(page);
    const response = await page.goto("/administracja/ocena/1");
    expect(response?.status()).toBe(403);
    await expect(page.getByText("Błąd 403")).toBeVisible();
  });
});
