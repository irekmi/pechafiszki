/**
 * DEC-55 — the administration dashboard's decision turnaround: the mean of `decidedAt − submittedAt`
 * over a set of decisions, in whole days. `null` for an empty set (no decision that week) — the
 * caller's "—" state, not a `0`.
 */
export function averageDecisionDays(decisions: readonly { submittedAt: Date; decidedAt: Date }[]): number | null {
  if (decisions.length === 0) return null;
  const totalDays = decisions.reduce(
    (sum, { submittedAt, decidedAt }) => sum + (decidedAt.getTime() - submittedAt.getTime()) / 86_400_000,
    0,
  );
  return totalDays / decisions.length;
}

/** One decimal, comma as the mark (DEC-55, `pl-PL`) — "1,5 dnia"; "—" for `null`. */
export function formatDecisionDays(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(1).replace(".", ",")} dnia`;
}
