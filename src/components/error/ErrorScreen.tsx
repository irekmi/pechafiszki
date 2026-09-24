import { ButtonLink } from "@/components/ui/Button";
import { EmptyActions } from "@/components/ui/EmptyState";
import { Muted, PageTitle } from "@/components/ui/Typography";

/** SCR-22 — the single destination of every refusal. Variants per DEC-57. */
export type ErrorVariant = "404" | "403";

const COPY: Record<ErrorVariant, { code: string; heading: string; message: string }> = {
  "404": {
    code: "Błąd 404",
    heading: "Nie znaleziono strony",
    message:
      "Ta strona nie istnieje lub została usunięta. Fiszka albo konto, do którego prowadził link, mogły zostać usunięte.",
  },
  "403": {
    code: "Błąd 403",
    heading: "Brak dostępu",
    message:
      "Nie masz uprawnień, aby otworzyć tę stronę. Obszar administracji jest dostępny tylko dla administratorów.",
  },
};

/** `signedIn` decides the button set: a guest never sees the two signed-in actions. */
export function ErrorScreen({ variant, signedIn }: { variant: ErrorVariant; signedIn: boolean }) {
  const copy = COPY[variant];
  return (
    <main className="min-h-screen grid place-items-center px-6 py-12 text-center">
      <div className="grid gap-4 justify-items-center max-w-145">
        <p className="font-display font-bold text-72 leading-none text-cta tracking-brand text-shadow-hard">
          {copy.code}
        </p>
        <PageTitle>{copy.heading}</PageTitle>
        <Muted>{copy.message}</Muted>
        <EmptyActions className="w-full">
          {signedIn ? (
            <>
              <ButtonLink href="/start" variant="primary" size="lg">
                Wróć na start
              </ButtonLink>
              <ButtonLink href="/fiszki" size="lg">
                Przeglądaj fiszki
              </ButtonLink>
            </>
          ) : (
            <ButtonLink href="/logowanie" size="lg">
              Wróć do logowania
            </ButtonLink>
          )}
        </EmptyActions>
      </div>
    </main>
  );
}
