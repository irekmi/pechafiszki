"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "./cn";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  text?: ReactNode;
  wide?: boolean;
  actions: ReactNode;
  children?: ReactNode;
};

/**
 * `.modal-backdrop` + `.modal`, with the backdrop click and Escape the mockups imply. Portalled to `body`,
 * as in the mockup, so the dialog never inherits the type size or wrapping of the table cell it opens from.
 */
export function Modal({ open, onClose, title, text, wide, actions, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-60 bg-scrim grid place-items-center p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "w-full bg-surface border-2 border-ink rounded-lg shadow-hard-xl p-7",
          wide ? "max-w-170" : "max-w-130",
        )}
      >
        <h2 className="font-display font-bold text-22 leading-title mb-2.5">{title}</h2>
        {text ? <p className="text-ink-2 mb-5">{text}</p> : null}
        {children ? <div className="grid gap-4 mb-6">{children}</div> : null}
        <div className="flex gap-2.5 justify-end flex-wrap">{actions}</div>
      </div>
    </div>,
    document.body,
  );
}
