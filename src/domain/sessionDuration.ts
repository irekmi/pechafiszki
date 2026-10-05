/** Length of a finished session in whole minutes, rounded to the nearest one (DEC-18). */
export function sessionDurationMinutes(startedAt: Date, endedAt: Date): number {
  return Math.round((endedAt.getTime() - startedAt.getTime()) / 60_000);
}
