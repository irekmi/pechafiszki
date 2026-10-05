import type { Mark } from "@/domain/types";
import type { SessionFilters } from "./sessionFilters";

export type StudyCard = {
  id: number;
  question: string;
  answer: string;
  codeExample: string | null;
  category: { id: number; name: string };
};

export type SessionQueueResult =
  | { status: "none" }
  | { status: "finished"; sessionId: number }
  | {
      status: "empty";
      kind: "no-results" | "all-hidden";
      filters: SessionFilters;
      returnDate: Date | null;
    }
  | {
      status: "ok";
      sessionId: number;
      card: StudyCard;
      isReinforcement: boolean;
      position: number;
      total: number;
      progressPercent: number;
      mark: Mark | null;
      knowCount: number;
      lastSeenAt: Date | null;
      filters: SessionFilters;
    };
