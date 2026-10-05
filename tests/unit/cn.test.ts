import { describe, expect, it } from "vitest";
import { cn } from "@/components/ui/cn";

describe("cn — the kit's class helper", () => {
  it("lets a caller's token win over the component default", () => {
    expect(cn("bg-surface text-ink", "bg-surface-2")).toBe("text-ink bg-surface-2");
  });

  it("drops falsy branches", () => {
    expect(cn("shadow-hard", false && "shadow-none", undefined)).toBe("shadow-hard");
  });
});

describe("cn — the mockups' custom theme namespaces", () => {
  it("keeps a font size and a text colour apart", () => {
    expect(cn("text-40 text-ink")).toBe("text-40 text-ink");
    expect(cn("text-12 text-brand")).toBe("text-12 text-brand");
  });

  it("still treats two font sizes as a conflict", () => {
    expect(cn("text-40", "text-60")).toBe("text-60");
  });

  it("keeps a line height a font size would otherwise clear", () => {
    expect(cn("leading-none font-bold", "text-40")).toBe("leading-none font-bold text-40");
    expect(cn("leading-input", "text-12")).toBe("leading-input text-12");
  });

  it("treats the hard offset shadows as one group", () => {
    expect(cn("shadow-hard", "shadow-hard-4")).toBe("shadow-hard-4");
  });
});
