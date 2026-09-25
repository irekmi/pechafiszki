import { describe, expect, it } from "vitest";
import { HIDE_DAYS, addDays } from "@/domain/applyMark";
import { hiddenInSession, type HistoryEvent } from "@/domain/hiddenInSession";

// DEC-05, DEC-19 — the cards a session hid for a week, read from Review Events alone, and when the
// first comes back.

const SESSION = 7;
const start = new Date("2026-09-10T10:00:00.000Z");
let clock = 0;

function event(flashcardId: number, over: Partial<HistoryEvent> = {}): HistoryEvent {
  clock += 1000;
  return {
    flashcardId,
    sessionId: SESSION,
    mark: "KNOW",
    countedTowardsKnow: true,
    createdAt: new Date(start.getTime() + clock),
    ...over,
  };
}

const knows = (id: number, count: number, over: Partial<HistoryEvent> = {}) =>
  Array.from({ length: count }, () => event(id, over));

describe("DEC-05 — hiddenInSession", () => {
  it("counts the counted Umiem that is the fifth in a row, returning seven days after it", () => {
    const history = [...knows(1, 4, { sessionId: null }), event(1)];
    const result = hiddenInSession(history, SESSION);
    expect(result).toEqual({ count: 1, returnDate: addDays(history[4]!.createdAt, HIDE_DAYS) });
  });

  it("does not count the fourth Umiem, nor a sixth one on an already hidden card", () => {
    expect(hiddenInSession([...knows(1, 3, { sessionId: null }), event(1)], SESSION).count).toBe(0);
    expect(hiddenInSession([...knows(1, 5, { sessionId: null }), event(1)], SESSION).count).toBe(0);
  });

  it("does not count a hide made by an earlier session or by a marking outside any session", () => {
    expect(hiddenInSession(knows(1, 5, { sessionId: 3 }), SESSION).count).toBe(0);
    expect(hiddenInSession(knows(2, 5, { sessionId: null }), SESSION).count).toBe(0);
  });

  it("a Do powtórki or Nie umiem in the middle restarts the streak", () => {
    const history = [...knows(1, 3, { sessionId: null }), event(1, { mark: "REPEAT", countedTowardsKnow: false }), ...knows(1, 2)];
    expect(hiddenInSession(history, SESSION).count).toBe(0);
  });

  it("an uncounted Umiem does not raise the streak", () => {
    const history = [...knows(1, 4, { sessionId: null }), event(1, { countedTowardsKnow: false })];
    expect(hiddenInSession(history, SESSION).count).toBe(0);
  });

  it("a card marked Do powtórki after its fifth Umiem in the same session is no longer hidden", () => {
    const history = [...knows(1, 5), event(1, { mark: "REPEAT", countedTowardsKnow: false })];
    expect(hiddenInSession(history, SESSION)).toEqual({ count: 0, returnDate: null });
  });

  it("the streak starts over once the week of hiding has ended (last day and first day after)", () => {
    const hid = knows(1, 5, { sessionId: null });
    const due = addDays(hid[4]!.createdAt, HIDE_DAYS);
    const dayBefore = event(1, { createdAt: new Date(due.getTime() - 1), sessionId: null });
    const afterWeek = Array.from({ length: 4 }, (_, i) => event(1, { createdAt: new Date(due.getTime() + i) }));
    // still inside the week the counts keep climbing: the sixth is not a hide
    expect(hiddenInSession([...hid, dayBefore, event(1, { createdAt: new Date(due.getTime() - 1) })], SESSION).count).toBe(0);
    // from `due` on, four Umiem are only the fourth of a new streak
    expect(hiddenInSession([...hid, ...afterWeek], SESSION).count).toBe(0);
    // and a fifth one after expiry hides again
    const fifth = event(1, { createdAt: new Date(due.getTime() + 10) });
    expect(hiddenInSession([...hid, ...afterWeek, fifth], SESSION).count).toBe(1);
  });

  it("returns the earliest return date when several cards were hidden at different moments", () => {
    const history = [...knows(1, 4, { sessionId: null }), ...knows(2, 4, { sessionId: null }), event(2), event(1)];
    const result = hiddenInSession(history, SESSION);
    expect(result.count).toBe(2);
    expect(result.returnDate).toEqual(addDays(history[8]!.createdAt, HIDE_DAYS));
  });
});
