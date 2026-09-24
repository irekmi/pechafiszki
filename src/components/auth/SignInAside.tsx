import { Badge } from "@/components/ui/Badge";
import { Hint, QUESTION_CLASS } from "@/components/ui/Typography";
import { AuthAsideText, AuthAsideTitle, AuthSample } from "./AuthShell";

/**
 * SCR-01's aside panel and its decorative sample card — elements 1 and 2 of the screen. The card is
 * not real data: no query stands behind it.
 */
export function SignInAside() {
  return (
    <>
      <AuthAsideTitle>
        Powtarzaj pytania rekrutacyjne, aż odpowiedź przychodzi sama.
      </AuthAsideTitle>
      <AuthAsideText>
        Wspólna pula fiszek z pytaniami z rozmów o pracę dla programistów. Oceniasz każdą fiszkę, a
        te, które już umiesz, wracają do Ciebie rzadziej.
      </AuthAsideText>
      <AuthSample>
        <Badge tone="category">JavaScript</Badge>
        <p className={QUESTION_CLASS}>Czym jest domknięcie?</p>
        <Hint>Kliknij fiszkę, aby zobaczyć odpowiedź i przykład</Hint>
      </AuthSample>
    </>
  );
}
