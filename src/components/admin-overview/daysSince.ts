/** Whole days elapsed since `date`, never negative — SCR-15's "najstarsza od N dni". */
export function daysSince(date: Date, now: Date = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86_400_000));
}
