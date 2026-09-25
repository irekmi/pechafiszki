import { Fragment } from "react";
import { TextLink } from "./TextLink";

type Crumb = { label: string; href?: string };

/** `.breadcrumb` — "Fiszki / JavaScript / Domknięcie"; a crumb with an `href` is a link. */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Ścieżka" className="flex gap-2 text-13 text-ink-3 mb-3.5 flex-wrap">
      {items.map((item, index) => (
        <Fragment key={item.label}>
          {index > 0 ? <span>/</span> : null}
          {item.href ? (
            <TextLink href={item.href} className="text-ink-2">
              {item.label}
            </TextLink>
          ) : (
            <span>{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
