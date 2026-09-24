"use client";

import { useState, type ReactNode } from "react";
import { cn } from "./cn";

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
  className,
}: FlashcardProps) {
  const [revealed, setRevealed] = useState(defaultRevealed || variant !== "flip");
  const preview = variant === "preview";
  const flippable = variant === "flip";

  return (
    <article
      onClick={flippable ? () => setRevealed((value) => !value) : undefined}
      className={cn(
        "bg-surface border-ink rounded-lg grid gap-5 content-start",
        preview
          ? "border p-6 min-h-0 shadow-none bg-surface-2"
          : "border-2 px-5 py-6 min-h-60 md:px-10 md:py-9",
        variant === "flip" && "shadow-hard-6 cursor-pointer md:min-h-75",
        variant === "static" && "shadow-hard cursor-default md:min-h-75",
        className,
      )}
    >
      {badges ? <div className="flex justify-between gap-3 items-center">{badges}</div> : null}
      <h2
        className={cn(
          "font-display font-semibold leading-card",
          preview ? "text-20" : "text-21 md:text-27",
        )}
      >
        {question}
      </h2>
      {flippable ? (
        <p className="flex items-center gap-2 text-13 text-ink-3">
          {revealed ? HINT_HIDE : HINT_SHOW}
        </p>
      ) : null}
      {revealed && (answer || example) ? (
        <div className="grid gap-4.5">
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
