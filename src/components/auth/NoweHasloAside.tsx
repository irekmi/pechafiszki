import { AuthAsideText, AuthAsideTitle } from "./AuthShell";

/** SCR-04's aside panel — element 1. */
export function NoweHasloAside() {
  return (
    <>
      <AuthAsideTitle>Ostatni krok.</AuthAsideTitle>
      <AuthAsideText>
        Ustaw nowe hasło, a potem zaloguj się i wróć do nauki. Link z wiadomości działa tylko raz.
      </AuthAsideText>
    </>
  );
}
