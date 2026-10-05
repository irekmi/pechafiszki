import Link from "next/link";
import type { AnchorHTMLAttributes } from "react";
import { cn } from "./cn";

/** The mockups' bare `a` rule: brand ink, a 2 px underline in `--surface-3`, red on hover. */
export const LINK_CLASS =
  "text-brand underline decoration-2 decoration-surface-3 underline-offset-3 " +
  "hover:text-cta-ink hover:decoration-current";

type TextLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export function TextLink({ className, href, ...rest }: TextLinkProps) {
  return <Link href={href} className={cn(LINK_CLASS, className)} {...rest} />;
}
