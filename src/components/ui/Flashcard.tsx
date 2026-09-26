"use client";

import { useState, type ReactNode } from "react";
import { cn } from "./cn";
import { QUESTION_CLASS } from "./Typography";

/** `.flashcard__label` */
const LABEL = "font-display font-bold text-12 leading-none tracking-label uppercase text-ink-2";

const HINT_SHOW = "Kliknij fiszkę, aby zobaczyć odpowiedź i przykład";
const HINT_HIDE = "Kliknij fiszkę, aby ukryć odpowiedź";

type FlashcardProps = {
  question: ReactNode;
  answer?: ReactNode;
  example?: ReactNode;
  badges?: ReactNode;
  /** `.flashcard--static` — no flip, used where the answer is always shown. */
  variant?: "flip" | "static" | "preview";
  defaultRevealed?: boolean;
  /** Controlled flip: SCR-06's **Pokaż / ukryj** lives outside the card and shares this state. */
  revealed?: boolean;
  onToggle?: () => void;
  /** SCR-06 draws the question as its page's `h1`; elsewhere it is an `h2`. */
  heading?: "h1" | "h2";
  className?: string;
};

/** `.flashcard` — the card of SCR-06 and SCR-09, with the mockups' click-to-flip behaviour. */
export function Flashcard({
  question,
  answer,
  example,
  badges,
  variant = "flip",
  defaultRevealed = false,
  revealed: controlledRevealed,
  onToggle,
  heading: Heading = "h2",
  className,
}: FlashcardProps) {
  const [ownRevealed, setOwnRevealed] = useState(defaultRevealed || variant !== "flip");
  const revealed = controlledRevealed ?? ownRevealed;
  const toggle = onToggle ?? (() => setOwnRevealed((value) => !value));
  const preview = variant === "preview";
  const flippable = variant === "flip";

  return (
    <article
      onClick={flippable ? toggle : undefined}
      className={cn(
        "bg-surface border-ink rounded-lg grid gap-5 content-start",
        preview
          ? "border px-5 py-6 md:p-6 min-h-0 shadow-none bg-surface-2"
          : "border-2 px-5 py-6 min-h-60 md:px-10 md:py-9",
        variant === "flip" && "shadow-hard-6 cursor-pointer md:min-h-75",
        variant === "static" && "shadow-hard cursor-default md:min-h-75",
        className,
      )}
    >
      {badges ? <div className="flex justify-between gap-3 items-center">{badges}</div> : null}
      <Heading className={cn(QUESTION_CLASS, Heading === "h1" && "text-brand", preview && "text-20 md:text-20")}>{question}</Heading>
      {flippable ? (
        <p className="flex items-center gap-2 text-13 text-ink-3">
          {revealed ? HINT_HIDE : HINT_SHOW}
        </p>
      ) : null}
      {revealed && (answer || example) ? (
        <div className={preview ? "contents" : "grid gap-4.5"}>
          <div className="h-0.5 flashcard-divider" />
          {answer ? (
            <>
              <p className={LABEL}>Odpowiedź</p>
              <p className="text-16 leading-answer text-ink">{answer}</p>
            </>
          ) : null}
          {example ? (
            <>
              <p className={LABEL}>Przykład kodu</p>
              {example}
            </>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
