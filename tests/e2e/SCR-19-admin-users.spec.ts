import { expect, test, type Browser, type Page } from "@playwright/test";
import { ADMIN, adminPage, approve, register, stamp, submitCard } from "./setup/review";

/**
 * SCR-19 and SCR-20 — the administration of accounts (AC-18.1 - 18.11). Real registration, the seeded
 * administrator of `withDb.ts`, the shared database: every test registers its own accounts and finds them by
 * their generated nickname, so nothing depends on a count or on another spec's data (ISS-24). The seeded
 * administrator is never demoted or deleted — only accounts a test made are promoted, demoted and removed.
 */

const USERS = "/administracja/uzytkownicy";
const NONE = "Nie ma użytkowników pasujących do wyszukiwania";
const rowOf = (page: Page, text: string) => page.getByRole("row").filter({ hasText: text });

/** Opens SCR-19 filtered to one account, once the filter bar has hydrated. */
async function openList(admin: Page, query: string): Promise<void> {
  await admin.goto(`${USERS}?query=${encodeURIComponent(query)}`);
  await expect(admin.getByRole("heading", { level: 1, name: "Użytkownicy" })).toBeVisible();
  await admin.waitForFunction(() =>
    Object.keys(document.querySelector("#role") ?? {}).some((key) => key.startsWith("__reactProps")),
  );
}

/** A fresh User, registered in its own context so the administrator's page keeps its session. */
async function newUser(browser: Browser): Promise<{ page: Page; nickname: string; email: string }> {
  const page = await (await browser.newContext()).newPage();
  return { page, ...(await register(page)) };
}

test.describe("SCR-19 — list, search, own row (AC-18.1, 18.9)", () => {
  test("own row carries To Ty and an inactive delete with its tooltip; search, role filter, sort and Wyczyść filtry", async ({ browser }) => {
    const user = await newUser(browser);
    const admin = await adminPage(browser);
    await openList(admin, "admin");
    const own = rowOf(admin, "admin@example.test");
    await expect(own.getByText("To Ty")).toBeVisible();
    const del = own.getByRole("button", { name: "Usuń użytkownika" });
    await expect(del).toBeDisabled();
    await expect(del).toHaveAttribute("title", "Użyj swojego profilu, aby usunąć własne konto");
    await expect(admin.getByText(/^\d+ (użytkownik|użytkownicy|użytkowników), w tym \d+ administrator/)).toBeVisible();

    // a fragment of the e-mail domain, and the nickname in capitals
    await openList(admin, "example.test");
    await expect(rowOf(admin, user.nickname)).toHaveCount(1);
    await expect(rowOf(admin, user.nickname)).toContainText(user.email);
    await expect(rowOf(admin, user.nickname).getByRole("button", { name: "Usuń użytkownika" })).toBeEnabled();
    await openList(admin, user.nickname.toUpperCase());
    await expect(admin.getByText("Pokazano 1 z 1 użytkownika")).toBeVisible();
    await expect(rowOf(admin, user.nickname).getByRole("link", { name: user.nickname })).toHaveAttribute("href", /^\/administracja\/uzytkownicy\/\d+$/);

    await admin.selectOption("#role", "admin");
    await expect(admin).toHaveURL(/role=admin/);
    await expect(admin.getByText(NONE)).toBeVisible();
    await admin.getByRole("button", { name: "Wyczyść filtry" }).last().click();
    await expect(admin).toHaveURL(new RegExp(`${USERS}$`));
    await admin.selectOption("#sort", "nickname");
    await expect(admin).toHaveURL(/sort=nickname$/);
    await admin.selectOption("#role", "admin");
    await expect(admin).toHaveURL(/sort=nickname&role=admin|role=admin&sort=nickname/);
    await expect(rowOf(admin, "admin@example.test")).toHaveCount(1);
    await admin.context().close();
    await user.page.context().close();
  });
});

test.describe("SCR-19 — Usuń użytkownika (AC-18.5, 18.6)", () => {
  test("the row leaves with the toast; a pending card goes, an approved one stays as Usunięty użytkownik", async ({ browser }) => {
    const token = stamp();
    const user = await newUser(browser);
    const [pending, approved] = [`Oczekująca ${token}?`, `Zatwierdzona ${token}?`];
    await submitCard(user.page, approved);
    await submitCard(user.page, pending);
    const admin = await adminPage(browser);
    await approve(admin, approved);

    await openList(admin, user.nickname);
    await rowOf(admin, user.nickname).getByRole("button", { name: "Usuń użytkownika" }).click();
    const dialog = admin.getByRole("dialog", { name: "Usunąć tego użytkownika na stałe?" });
    await expect(dialog).toContainText("Zgłoszone przez nią fiszki zostaną w puli z autorem „Usunięty użytkownik”.");
    await dialog.getByRole("button", { name: "Anuluj" }).click();
    await expect(rowOf(admin, user.nickname)).toHaveCount(1);
    await rowOf(admin, user.nickname).getByRole("button", { name: "Usuń użytkownika" }).click();
    await admin.getByRole("dialog").getByRole("button", { name: "Usuń użytkownika" }).click();
    await expect(admin.getByRole("status")).toHaveText("Użytkownik usunięty");
    await expect(rowOf(admin, user.nickname)).toHaveCount(0);
    await expect(admin.getByText(NONE)).toBeVisible();

    await admin.goto(`/administracja/fiszki?query=${token}`);
    await expect(rowOf(admin, approved)).toContainText("Usunięty użytkownik");
    await expect(rowOf(admin, pending)).toHaveCount(0);
    await admin.goto("/administracja/oczekujace");
    await expect(admin.getByRole("link", { name: pending })).toHaveCount(0);
    await admin.context().close();
    await user.page.context().close();
  });
});

test.describe("SCR-20 — detail, role and deletion (AC-18.3, 18.4, 18.7, 18.8, 18.10)", () => {
  test("empty states, submissions by status, promotion, the new administrator's access, demotion, deletion", async ({ browser }) => {
    const user = await newUser(browser);
    const admin = await adminPage(browser);
    await openList(admin, user.nickname);
    await rowOf(admin, user.nickname).getByRole("link", { name: user.nickname }).click();
    await expect(admin.getByRole("heading", { level: 1, name: user.nickname })).toBeVisible();
    await expect(admin.getByText(`${user.email} · konto utworzone`)).toBeVisible();
    await expect(admin.getByText("Ten użytkownik nie dodał żadnej fiszki")).toBeVisible();
    await expect(admin.getByText("Ostatnia sesja")).toBeVisible();
    await expect(admin.getByText("Brak", { exact: true })).toBeVisible();
    await expect(admin.getByRole("navigation", { name: "Ścieżka" }).getByRole("link", { name: "Użytkownicy" })).toHaveAttribute("href", USERS);

    const question = `Zgłoszona ${stamp()}?`;
    await submitCard(user.page, question);
    await admin.reload();
    await expect(admin.getByText("Pokazano 1 z 1 zgłoszenia")).toBeVisible();
    await expect(admin.getByRole("link", { name: question })).toHaveAttribute("href", /^\/administracja\/ocena\/\d+$/);
    await expect(admin.getByText("Oczekuje", { exact: true })).toBeVisible();
    // aggregates only: three totals and no per-card marking anywhere on the page
    expect(await admin.locator("main").innerText()).not.toMatch(/hiddenUntil|knowCount/);

    await admin.waitForFunction(() => Object.keys(document.querySelector("#role") ?? {}).some((key) => key.startsWith("__reactProps")));
    await admin.selectOption("#role", "ADMIN");
    await admin.getByRole("button", { name: "Zmień rolę" }).click();
    await expect(admin.getByRole("dialog", { name: "Zmienić rolę tego użytkownika?" })).toContainText("Administrator zatwierdza i odrzuca fiszki");
    await admin.getByRole("dialog").getByRole("button", { name: "Zmień rolę" }).click();
    await expect(admin.getByRole("status")).toHaveText("Rola zmieniona");
    await expect(admin.getByText("Administrator", { exact: true }).first()).toBeVisible();

    // AC-18.4: the session the promoted person already has open, opened before the promotion, is enough
    expect((await user.page.goto("/administracja/oczekujace"))?.status()).toBe(200);
    await expect(user.page.getByRole("link", { name: question })).toBeVisible();

    await admin.selectOption("#role", "USER");
    await admin.getByRole("button", { name: "Zmień rolę" }).click();
    await admin.getByRole("dialog").getByRole("button", { name: "Zmień rolę" }).click();
    await expect(admin.getByRole("status")).toHaveText("Rola zmieniona");
    // AC-18.11: and the demotion takes the access away from that same open session
    // (the earlier toast may still be on screen, so the request is retried rather than raced)
    await expect.poll(async () => (await user.page.goto("/administracja/oczekujace"))?.status()).toBe(403);

    await admin.getByRole("button", { name: "Usuń użytkownika" }).first().click();
    await admin.getByRole("dialog").getByRole("button", { name: "Usuń użytkownika" }).click();
    await admin.waitForURL((url) => url.pathname === USERS);
    // a deleted account's open session is a Guest on its next request (NFR-01)
    await user.page.goto("/dodaj");
    await expect(user.page).toHaveURL(/\/logowanie\?powrot=/);
    expect((await admin.goto(`${USERS}/999999`))?.status()).toBe(404);
    await admin.context().close();
    await user.page.context().close();
  });

  test("own account: both buttons inactive with the note; the seeded administrator stays untouched", async ({ browser }) => {
    const admin = await adminPage(browser);
    await openList(admin, "admin@example.test");
    await rowOf(admin, "admin@example.test").getByRole("link", { name: "admin", exact: true }).click();
    await expect(admin.getByRole("heading", { level: 1, name: "admin" })).toBeVisible();
    await expect(admin.getByRole("button", { name: "Usuń użytkownika" })).toBeDisabled();
    await expect(admin.getByRole("button", { name: "Zmień rolę" })).toBeDisabled();
    await expect(admin.locator("#role")).toBeDisabled();
    await expect(admin.getByText("Nie możesz zmienić własnej roli ani usunąć własnego konta w tym miejscu")).toBeVisible();
    await admin.context().close();
  });
});

test.describe("SCR-19 / SCR-20 — refusal (AC-18.11)", () => {
  test("a User gets SCR-22's 403 variant on both addresses, a Guest is sent to SCR-01", async ({ browser }) => {
    const guest = await (await browser.newContext()).newPage();
    for (const path of [USERS, `${USERS}/1`]) {
      await guest.goto(path);
      await expect(guest).toHaveURL(/\/logowanie\?powrot=/);
    }
    await guest.context().close();
    const user = await newUser(browser);
    for (const path of [USERS, `${USERS}/1`, `${USERS}/999999`]) {
      expect((await user.page.goto(path))?.status()).toBe(403);
      await expect(user.page.getByText("Błąd 403")).toBeVisible();
    }
    await expect(user.page.getByText(ADMIN.email)).toHaveCount(0);
    await user.page.context().close();
  });
});
