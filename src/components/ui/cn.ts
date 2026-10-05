import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * The mockups' theme uses custom names in namespaces tailwind-merge cannot guess — without this,
 * `text-40` and `text-ink` look like the same class group and one of them is silently dropped.
 * Every list below mirrors a namespace of `src/app/globals.css`'s `@theme` block.
 */
const twMerge = extendTailwindMerge({
  // No `--text-*--line-height` pair exists in this theme, so a font size never carries a line
  // height with it and must not clear one — `text-40 leading-none` keeps both.
  override: { conflictingClassGroups: { "font-size": [] } },
  extend: {
    theme: {
      text: [
        "11", "12", "13", "code", "14", "body-sm", "15", "16", "17", "20", "21", "22", "24",
        "27", "28", "36", "38", "40", "60", "72",
      ],
      shadow: [
        "hard", "hard-lg", "hard-xl", "hard-2", "hard-4", "hard-6", "hard-brand", "pressed",
        "focus", "invalid", "underline",
      ],
      leading: ["hero", "aside", "flat", "title", "card", "input", "body", "answer", "code"],
      tracking: ["brand", "label"],
      radius: ["pill"],
      spacing: ["page", "press"],
      container: ["narrow"],
    },
  },
});

/** Joins conditional class names and lets a caller's className win over a component default. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
