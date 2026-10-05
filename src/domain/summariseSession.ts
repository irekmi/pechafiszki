import type { Mark } from "./types";

/** One Review Event of the session being summed up, oldest first. */
export interface SessionEvent {
  flashcardId: number;
  mark: Mark;
  wasReinforcement: boolean;
}

export interface SessionCounts {
  reviewed: number;
  know: number;
  knowReinforcements: number;
  repeat: number;
  unknown: number;
}

/**
 * The four counters of SCR-07 (DEC-19), from one session's Review Events. A card marked twice is
 * two events (DEC-14) but one card here: it lands in the bucket of its **last** marking, so
 * `reviewed` is always `know + repeat + unknown`. `knowReinforcements` is the part of `know` that
 * sat in a reinforcement slot of the queue ("w tym N powtórki").
 */
export function summariseSession(events: readonly SessionEvent[]): SessionCounts {
  const last = new Map<number, SessionEvent>();
  for (const event of events) last.set(event.flashcardId, event);

  const finals = [...last.values()];
  const know = finals.filter((event) => event.mark === "KNOW");
  return {
    reviewed: finals.length,
    know: know.length,
    knowReinforcements: know.filter((event) => event.wasReinforcement).length,
    repeat: finals.filter((event) => event.mark === "REPEAT").length,
    unknown: finals.filter((event) => event.mark === "UNKNOWN").length,
  };
}

/** The cards whose last marking in the session was **Nie umiem**, in the order they were marked. */
export function unknownCardIds(events: readonly SessionEvent[]): number[] {
  const last = new Map<number, Mark>();
  for (const event of events) {
    last.delete(event.flashcardId);
    last.set(event.flashcardId, event.mark);
  }
  return [...last].filter(([, mark]) => mark === "UNKNOWN").map(([id]) => id);
}
