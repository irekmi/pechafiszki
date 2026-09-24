"use client";

import { useState, type InputHTMLAttributes } from "react";
import { cn } from "./cn";
import { FIELD_CLASS } from "./Input";

/** `.input-wrap` with the mockups' `Pokaż` / `Ukryj` toggle. */
export function PasswordInput({
  className,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative flex">
      <input
        type={visible ? "text" : "password"}
        className={cn(FIELD_CLASS, "pr-21", className)}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 border-0 bg-transparent cursor-pointer
          font-sans font-semibold text-13 leading-none text-brand px-2.5 py-2 rounded-sm hover:bg-surface-2"
      >
        {visible ? "Ukryj" : "Pokaż"}
      </button>
    </div>
  );
}
