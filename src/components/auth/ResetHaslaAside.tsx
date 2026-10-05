import { AuthAsideText, AuthAsideTitle } from "./AuthShell";

/** SCR-03's aside panel — element 1. Unlike SCR-01/SCR-02 there is no decorative sample card. */
export function ResetHaslaAside() {
  return (
    <>
      <AuthAsideTitle>Odzyskaj dostęp do swoich powtórek.</AuthAsideTitle>
      <AuthAsideText>
        Wyślemy Ci jednorazowy link do ustawienia nowego hasła. Twoje oceny fiszek i statystyki
        zostają nietknięte.
      </AuthAsideText>
    </>
  );
}
