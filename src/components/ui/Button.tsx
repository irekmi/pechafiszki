import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

/** `.btn` and its variants from the mockups' styles.css. */
export type ButtonVariant = "default" | "primary" | "ghost" | "danger" | "danger-solid";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 border-2 border-ink rounded-pill cursor-pointer " +
  "no-underline transition duration-100 hover:text-ink active:translate-y-press active:shadow-none " +
  "focus-visible:outline-3 focus-visible:outline-gold focus-visible:outline-offset-2";

const VARIANT: Record<ButtonVariant, string> = {
  default: "bg-surface text-ink hover:bg-surface-2",
  primary: "bg-cta text-white hover:bg-cta-ink hover:text-white font-display font-bold",
  ghost: "bg-transparent border-transparent text-ink-2 hover:bg-surface-2",
  danger: "bg-surface text-cta-ink hover:bg-unknown-soft hover:text-cta-ink",
  "danger-solid": "bg-cta text-white hover:bg-cta-ink hover:text-white",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "min-h-8 px-3 py-1.5 text-13",
  md: "min-h-10.5 px-4.5 py-2.5",
  lg: "min-h-13 px-7 py-3.5 text-17",
};

/** `.btn` is 14 px, `.btn--primary` 15 px; `.btn--lg` and `.btn--sm` are declared after both. */
function textSizeFor(variant: ButtonVariant, size: ButtonSize): string {
  if (size !== "md") return "";
  return variant === "primary" ? "text-15" : "text-14";
}

function shadowFor(variant: ButtonVariant, size: ButtonSize): string {
  if (size === "sm") return "shadow-hard-2";
  if (variant === "ghost") return "shadow-none";
  return variant === "primary" ? "shadow-hard-4" : "shadow-hard";
}

export type ButtonLook = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
};

/** The class string every button-shaped element in the application is built from. */
export function buttonClass({ variant = "default", size = "md", block }: ButtonLook = {}): string {
  return cn(
    BASE,
    variant === "primary" ? "" : "font-sans font-semibold",
    "leading-none",
    VARIANT[variant],
    SIZE[size],
    textSizeFor(variant, size),
    shadowFor(variant, size),
    block && "w-full",
    "disabled:opacity-45 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0",
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonLook & { children: ReactNode };

export function Button({ variant, size, block, className, type, ...rest }: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={cn(buttonClass({ variant, size, block }), className)}
      {...rest}
    />
  );
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> &
  ButtonLook & { href: string; scroll?: boolean; children: ReactNode };

export function ButtonLink({ variant, size, block, className, href, ...rest }: ButtonLinkProps) {
  return (
    <Link href={href} className={cn(buttonClass({ variant, size, block }), className)} {...rest} />
  );
}
