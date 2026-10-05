"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button, type ButtonVariant, type ButtonSize } from "@/components/ui/Button";
import { applySessionFiltersAction } from "@/server/actions/applySessionFilters";
import { useStudy } from "./StudyShell";

/**
 * **Zacznij od nowa** (DEC-15): clears the search and every chip and rebuilds the queue over the
 * whole pool, inside the same session. Used on the navigation card and in the "Brak wyników" state.
 */
export function ResetFiltersButton({ variant, size }: { variant?: ButtonVariant; size?: ButtonSize }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { notify } = useStudy();

  function reset() {
    startTransition(async () => {
      await applySessionFiltersAction({});
      notify("Wyczyszczono wyszukiwanie i filtry");
      router.refresh();
    });
  }

  return (
    <Button variant={variant} size={size} disabled={pending} onClick={reset}>
      Zacznij od nowa
    </Button>
  );
}
