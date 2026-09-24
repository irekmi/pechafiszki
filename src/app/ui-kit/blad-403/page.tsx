import { notFound } from "next/navigation";
import { ErrorScreen } from "@/components/error/ErrorScreen";

/** Scratch route for AC-01.4 / test scenario 1 — SCR-22's 403 variant, signed-in button set. */
export default function Blad403Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <ErrorScreen variant="403" signedIn />;
}
