import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "./cn";

/** `.table-wrap` — every table in the application is wrapped in this. */
export function TableWrapper({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "min-w-0 bg-surface border-2 border-ink rounded-md shadow-hard overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Below 768 px the mockup sheds every column from the 4th on
 * (`styles.css` — `.table th:nth-child(n + 4), .table td:nth-child(n + 4) { display: none }`),
 * so a table never overflows on mobile. Automatic: no screen has to mark its own columns.
 */
const SHED_COLUMNS =
  "[&_th:nth-child(n+4)]:hidden [&_td:nth-child(n+4)]:hidden " +
  "md:[&_th:nth-child(n+4)]:table-cell md:[&_td:nth-child(n+4)]:table-cell";

export function Table({ children }: { children: ReactNode }) {
  return (
    <table className={cn("w-full border-collapse text-14", SHED_COLUMNS)}>{children}</table>
  );
}

export function Th({ className, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        "text-left px-4.5 py-3 bg-surface-2 font-sans font-medium text-12 leading-flat text-ink-2 whitespace-nowrap",
        className,
      )}
      {...rest}
    />
  );
}

export function Td({ className, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4.5 py-3.5 border-t border-line align-middle", className)} {...rest} />;
}

export function Tr({ children }: { children: ReactNode }) {
  return <tr className="hover:bg-surface-hover">{children}</tr>;
}
