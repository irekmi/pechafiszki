import { Badge } from "@/components/ui/Badge";
import { Hint, QUESTION_CLASS } from "@/components/ui/Typography";
import { AuthAsideText, AuthAsideTitle, AuthSample } from "./AuthShell";

/**
 * SCR-02's aside panel and its decorative sample card — elements 1 and 2. `DEV-01` requires the
 * sample to name a real seeded category and a real pool size, not the mockup's own "SQL i bazy
 * danych" / "312 fiszek w 8 kategoriach": this is a literal, static replacement (the element is
 * `Layout and elements` row 2's own "static card"), not a live query on a public Guest page.
 * "Doctrine/SQL" and "Co to jest ORM?" are the seeded category and question nearest the mockup's
 * own sample in spirit; 220 cards in 9 categories are the seed's own, fixed numbers (`CLAUDE.md`
 * §12, `prisma/seedData.ts`).
 */
export function SignUpAside() {
  return (
    <>
      <AuthAsideTitle>Jedno konto, wspólna pula pytań.</AuthAsideTitle>
      <AuthAsideText>
        Po rejestracji od razu uczysz się z zatwierdzonych fiszek i możesz zgłaszać własne. Każda
        zgłoszona fiszka trafia do puli po sprawdzeniu przez administratora.
      </AuthAsideText>
      <AuthSample>
        <Badge tone="category">Doctrine/SQL</Badge>
        <p className={QUESTION_CLASS}>Co to jest ORM?</p>
        <Hint>220 fiszek w 9 kategoriach</Hint>
      </AuthSample>
    </>
  );
}
