import { ErrorScreen } from "@/components/error/ErrorScreen";

/**
 * SCR-22, the 404 variant. Next.js serves this with HTTP 404.
 * The button set is the guest one until ST-03 supplies the session.
 */
export default function NotFound() {
  return <ErrorScreen variant="404" signedIn={false} />;
}
