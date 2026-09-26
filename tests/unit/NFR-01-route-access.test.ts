import { describe, expect, it } from "vitest";
import {
  SIGNED_IN_HOME,
  SIGN_IN_PATH,
  isAdminPath,
  isProtectedPath,
  safeReturnPath,
  signInUrlFor,
} from "@/server/routeAccess";

describe("NFR-01 — the protected path table", () => {
  it("protects every signed-in address of spec/permissions.md", () => {
    for (const path of [
      "/",
      "/nauka",
      "/podsumowanie",
      "/fiszki",
      "/fiszki/12",
      "/dodaj",
      "/moje-fiszki",
      "/edytuj/7",
      "/statystyki",
      "/profil",
      "/profil/usun-konto",
      "/administracja",
      "/administracja/oczekujace",
    ]) {
      expect(isProtectedPath(path), path).toBe(true);
    }
  });

  it("leaves the four public screens open", () => {
    for (const path of ["/logowanie", "/rejestracja", "/reset-hasla", "/nowe-haslo"]) {
      expect(isProtectedPath(path), path).toBe(false);
    }
  });

  it("does not mistake a prefix for a segment", () => {
    expect(isProtectedPath("/startowy")).toBe(false);
    expect(isAdminPath("/administracja-x")).toBe(false);
    expect(isAdminPath("/administracja/uzytkownicy/3")).toBe(true);
  });

  it("carries the requested address into the sign-in address (AC-03.3)", () => {
    expect(signInUrlFor("/fiszki", "?kategoria=PHP")).toBe(
      `${SIGN_IN_PATH}?powrot=${encodeURIComponent("/fiszki?kategoria=PHP")}`,
    );
    expect(signInUrlFor("/rejestracja")).toBe(SIGN_IN_PATH);
    // SQ-01.1: SCR-05 is `/`, and SCR-01 returns a signed-in person there by itself.
    expect(signInUrlFor("/")).toBe(SIGN_IN_PATH);
    expect(SIGNED_IN_HOME).toBe("/");
  });

  it("refuses to be turned into an open redirect", () => {
    for (const hostile of [
      "https://evil.example/pwn",
      "//evil.example/pwn",
      "/\\evil.example",
      "javascript:alert(1)",
      "",
      null,
      undefined,
    ]) {
      expect(safeReturnPath(hostile), String(hostile)).toBe(SIGNED_IN_HOME);
    }
  });

  it("keeps a genuine protected path, query and all", () => {
    expect(safeReturnPath("/")).toBe("/");
    expect(safeReturnPath("/fiszki?kategoria=PHP")).toBe("/fiszki?kategoria=PHP");
    expect(safeReturnPath("/administracja/oczekujace")).toBe("/administracja/oczekujace");
    // A public screen is not a place a forced sign-in should return to.
    expect(safeReturnPath("/logowanie")).toBe(SIGNED_IN_HOME);
  });
});
