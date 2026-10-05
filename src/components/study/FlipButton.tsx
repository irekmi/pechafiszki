"use client";

import { Button } from "@/components/ui/Button";
import { useStudy } from "./StudyShell";

/** **Pokaż / ukryj** — flips the card, exactly as tapping it does. */
export function FlipButton() {
  const { toggle } = useStudy();
  return (
    <Button variant="primary" onClick={toggle}>
      Pokaż / ukryj
    </Button>
  );
}
