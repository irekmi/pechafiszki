import type { ReactNode } from "react";
import { cn } from "./cn";

/** `.notice` — the inline explanatory box. */
export type NoticeTone = "info" | "success" | "warning" | "danger";

const TONE: Record<NoticeTone, string> = {
  info: "bg-accent-soft text-brand",
  success: "bg-know-soft text-know-ink",
  warning: "bg-repeat-soft text-repeat-ink",
  danger: "bg-unknown-soft text-unknown-ink",
};

type NoticeProps = {
  tone?: NoticeTone;
  icon?: ReactNode;
  /** `role="alert"`, as the mockups mark a notice that appears in response to an action. */
  role?: "alert" | "status";
  className?: string;
  children: ReactNode;
};

export function Notice({ tone = "info", icon, role, className, children }: NoticeProps) {
  return (
    <div
      role={role}
      className={cn(
        "flex gap-3 items-start px-4.5 py-3.5 rounded-md text-14 border-2 border-current",
        TONE[tone],
        className,
      )}
    >
      {icon ? <span className="w-4.5 h-4.5 shrink-0 mt-px">{icon}</span> : null}
      <span>{children}</span>
    </div>
  );
}
