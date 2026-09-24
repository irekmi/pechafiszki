import type { ReactNode } from "react";
import { Stack } from "@/components/ui/Page";
import { SectionTitle } from "@/components/ui/Typography";

/** Scratch scaffolding for AC-01.4 — groups one family of kit elements. */
export function KitSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-9">
      <SectionTitle>{title}</SectionTitle>
      <Stack size="sm">{children}</Stack>
    </section>
  );
}
