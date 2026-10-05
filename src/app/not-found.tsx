import { ErrorScreen } from "@/components/error/ErrorScreen";
import { currentUser, hasStaleSessionCookie } from "@/server/permissions";

/**
 * SCR-22, the 404 variant. Next.js serves this with HTTP 404, and it is the same answer a resource
 * the caller may not see gets — the two must not be distinguishable (DEC-57, `refuseNotFound`).
 *
 * The button set follows the session, and a visitor whose cookie no longer resolves is offered a
 * sign-out so the stale token is cleared before SCR-01 (API-38).
 */
export default async function NotFound() {
  const user = await currentUser();
  return (
    <ErrorScreen
      variant="404"
      signedIn={user !== null}
      staleSession={user === null && (await hasStaleSessionCookie())}
    />
  );
}
