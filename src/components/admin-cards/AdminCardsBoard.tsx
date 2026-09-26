"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Toast } from "@/components/ui/Toast";

const Deleted = createContext<(() => void) | null>(null);

/** The callback a row's **Usuń** runs once the card is gone: shows "Fiszka usunięta" (SCR-18 behaviour 6). */
export function useNotifyDeleted(): () => void {
  const notify = useContext(Deleted);
  if (!notify) throw new Error("useNotifyDeleted must be used inside AdminCardsBoard");
  return notify;
}

/**
 * Holds the toast above the table. It stays mounted while the list refreshes underneath it — also when
 * the deleted card was the last one and the empty state takes the table's place — so the toast survives
 * the row that raised it (server-rendered children are passed through untouched).
 */
export function AdminCardsBoard({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<number | null>(null);
  const notify = useCallback(() => setToast((last) => (last ?? 0) + 1), []);
  const hide = useCallback(() => setToast(null), []);
  return (
    <Deleted.Provider value={notify}>
      {children}
      <Toast key={toast ?? 0} message={toast === null ? null : "Fiszka usunięta"} onHide={hide} />
    </Deleted.Provider>
  );
}
