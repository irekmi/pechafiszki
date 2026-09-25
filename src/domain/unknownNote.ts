const ORDINALS: Record<number, string> = {
  2: "drugi",
  3: "trzeci",
  4: "czwarty",
  5: "piąty",
  6: "szósty",
  7: "siódmy",
  8: "ósmy",
  9: "dziewiąty",
  10: "dziesiąty",
};

/**
 * The note under a row of SCR-07's "Nie umiem" list — exactly one of three forms (DEC-20). A marking
 * that reset the **Umiem** counter says so; otherwise a card marked **Nie umiem** before says how
 * many times in total (`timesMarked` counts this marking too); otherwise it is the first time.
 */
export function unknownNote(resetFrom: number | null, timesMarked: number): string {
  if (resetFrom !== null) return `Licznik „Umiem” wyzerowany z ${resetFrom}`;
  if (timesMarked > 1) return `Oceniona „Nie umiem” po raz ${ORDINALS[timesMarked] ?? timesMarked}`;
  return "Pierwszy raz w sesji";
}
