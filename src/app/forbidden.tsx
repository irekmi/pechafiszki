import { ErrorScreen } from "@/components/error/ErrorScreen";

/**
 * SCR-22's 403 variant, served with HTTP 403 by `forbidden()`. Only `requireAdmin` reaches it, and
 * only for a caller who is signed in — which is why the signed-in button set is the right one.
 */
export default function Forbidden() {
  return <ErrorScreen variant="403" signedIn />;
}
