import { z } from "zod";
import { cleanText } from "./cleanText";

/** Import-free of the database, so the modal (client) and the service (server) share one definition. */
export const REASON_REQUIRED = "Powód odrzucenia jest wymagany";
export const REASON_TOO_LONG = "Powód odrzucenia może mieć najwyżej 500 znaków";
export const REASON_MAX = 500;

/** DEC-32: 1-500 characters after CRLF/NUL cleaning and trimming, required wherever it can be given. */
export const reasonSchema = z
  .string()
  .transform((value) => cleanText(value).trim())
  .pipe(z.string().min(1, REASON_REQUIRED).max(REASON_MAX, REASON_TOO_LONG));
