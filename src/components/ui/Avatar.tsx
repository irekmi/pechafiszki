import { cn } from "./cn";

const SIZE = { md: "w-8.5 h-8.5 text-13", sm: "w-6.5 h-6.5 text-11" } as const;

/** `.avatar` / `.avatar--sm` — the gold disc with a person's two initials. */
export function Avatar({ name, size = "md", className }: { name: string; size?: keyof typeof SIZE; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "rounded-pill grid place-items-center shrink-0 bg-gold text-brand font-display font-bold leading-none",
        SIZE[size],
        className,
      )}
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}
