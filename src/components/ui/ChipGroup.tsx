import type { ReactNode } from "react";

/**
 * `fieldset.chips` — a labelled group of filter chips, one active at a time (SCR-06, SCR-08). The
 * fieldset is itself the flex row, and its legend is a full-width first item, as in styles.css.
 */
export function ChipGroup({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="flex gap-2 flex-wrap border-0 p-0 m-0 min-w-0">
      <legend className="float-left w-full p-0 mb-2 text-12 font-bold text-ink-2">{legend}</legend>
      {children}
    </fieldset>
  );
}
