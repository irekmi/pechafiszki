"use client";

import { useRouter } from "next/navigation";
import { useRef, type ReactNode, type TouchEvent } from "react";
import { Code } from "@/components/ui/Code";
import { Flashcard } from "@/components/ui/Flashcard";
import { useStudy } from "./StudyShell";

const SWIPE_DISTANCE = 50;

type StudyCardProps = {
  question: string;
  answer: string;
  codeExample: string | null;
  badges: ReactNode;
  previousHref: string | null;
  nextHref: string;
};

/**
 * The flippable card of SCR-06. The question, answer and code example arrive as plain strings and
 * render as text (DEV-02, DEV-03). A horizontal swipe does what **Poprzednia** / **Następna** do.
 */
export function StudyCard({ question, answer, codeExample, badges, previousHref, nextHref }: StudyCardProps) {
  const { revealed, toggle } = useStudy();
  const router = useRouter();
  const origin = useRef<{ x: number; y: number } | null>(null);

  function begin(event: TouchEvent) {
    const touch = event.touches[0];
    origin.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  }

  function end(event: TouchEvent) {
    const touch = event.changedTouches[0];
    const start = origin.current;
    origin.current = null;
    if (!touch || !start) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const target = dx < 0 ? nextHref : previousHref;
    if (target) router.push(target);
  }

  return (
    <div onTouchStart={begin} onTouchEnd={end}>
      <Flashcard
        heading="h1"
        question={question}
        answer={answer}
        example={codeExample ? <Code>{codeExample}</Code> : undefined}
        badges={badges}
        revealed={revealed}
        onToggle={toggle}
      />
    </div>
  );
}
