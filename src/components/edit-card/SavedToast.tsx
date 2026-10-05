"use client";

import { useState } from "react";
import { Toast } from "@/components/ui/Toast";

/** "Zmiany zapisane" for one **Zapisz zmiany**: `saved` is the moment the action answered, so each save shows it once. */
export function SavedToast({ saved }: { saved: number | undefined }) {
  const [seen, setSeen] = useState(0);
  return <Toast message={saved && saved !== seen ? "Zmiany zapisane" : null} onHide={() => setSeen(saved ?? 0)} />;
}
