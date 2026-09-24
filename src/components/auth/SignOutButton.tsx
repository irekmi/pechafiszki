import type { ReactNode } from "react";
import { signOutAction } from "@/server/actions/signOut";
import { buttonClass, type ButtonLook } from "@/components/ui/Button";

/**
 * API-38 as a button. The form is `display: contents`, so the button remains the flex item its
 * surroundings expect and the shape is the one `buttonClass` draws everywhere else.
 */
export function SignOutButton({
  children,
  ...look
}: ButtonLook & { children: ReactNode }) {
  return (
    <form action={signOutAction} className="contents">
      <button type="submit" className={buttonClass(look)}>
        {children}
      </button>
    </form>
  );
}
