"use client";

import { useEffect } from "react";
import { cn } from "./cn";

/** `.toast` — the mockups' transient confirmation, hidden again after 2600 ms. */
export function Toast({
  message,
  onHide,
  duration = 2600,
  className,
}: {
  message: string | null;
  onHide: () => void;
  duration?: number;
  className?: string;
}) {
  useEffect(() => {
    if (message === null) return;
    const timer = setTimeout(onHide, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onHide]);

  if (message === null) return null;
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn(
        "fixed left-1/2 bottom-7 -translate-x-1/2 z-70 px-5.5 py-3.25 rounded-pill",
        "bg-brand text-on-brand border-2 border-gold text-14 font-semibold shadow-hard-4",
        className,
      )}
    >
      {message}
    </p>
  );
}
