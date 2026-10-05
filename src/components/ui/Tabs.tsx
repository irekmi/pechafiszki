"use client";

import { cn } from "./cn";

export type TabItem = { id: string; label: string };

type TabsProps = {
  items: readonly TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
};

/** `.tabs` — the mockups' `data-tabs` group, one panel shown at a time by the owner. */
export function Tabs({ items, value, onChange, className }: TabsProps) {
  return (
    <div role="tablist" className={cn("flex gap-1 border-b-2 border-ink", className)}>
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              "px-4 py-2.75 bg-transparent cursor-pointer font-sans text-14 leading-none",
              "border-b-3 -mb-0.5",
              active
                ? "text-ink border-gold font-bold"
                : "text-ink-2 border-transparent font-medium hover:text-ink",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
