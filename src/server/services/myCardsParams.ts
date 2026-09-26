import { z } from "zod";

/** SCR-11's address, and the fixed code of the notice SCR-10 sends the person there with. */
export const MY_CARDS_PATH = "/moje-fiszki";
export const SUBMITTED_NOTICE = "wyslana";

export const MY_CARDS_STATUSES = ["pending", "approved", "rejected"] as const;
export type MyCardsStatus = (typeof MY_CARDS_STATUSES)[number];

const status = z.enum(MY_CARDS_STATUSES).optional().catch(undefined);

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** API-15's `status` parameter; anything but the three tab values is "all" (no filter), never an error. */
export function parseMyCardsStatus(raw: RawParams): MyCardsStatus | undefined {
  return status.parse(first(raw.status));
}

/** The notice code on the address, or `undefined` when it is not a known one. */
export function parseMyCardsNotice(raw: RawParams): typeof SUBMITTED_NOTICE | undefined {
  return first(raw.zmiana) === SUBMITTED_NOTICE ? SUBMITTED_NOTICE : undefined;
}
