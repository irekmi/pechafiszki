"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Toast } from "./Toast";

const Notify = createContext<(() => void) | null>(null);

/** The callback a row runs once its action succeeded: shows the board's message. */
export function useToastBoard(): () => void {
  const notify = useContext(Notify);
  if (!notify) throw new Error("useToastBoard must be used inside ToastBoard");
  return notify;
}

/**
 * Holds a toast above a list whose rows refresh in place (SCR-18, SCR-19). It stays mounted while the
 * list re-renders underneath it — also when the removed row was the last one and the empty state takes
 * the table's place — so the toast survives the row that raised it (server-rendered children pass
 * through untouched).
 */
export function ToastBoard({ message, children }: { message: string; children: ReactNode }) {
  const [toast, setToast] = useState<number | null>(null);
  const notify = useCallback(() => setToast((last) => (last ?? 0) + 1), []);
  const hide = useCallback(() => setToast(null), []);
  return (
    <Notify.Provider value={notify}>
      {children}
      <Toast key={toast ?? 0} message={toast === null ? null : message} onHide={hide} />
    </Notify.Provider>
  );
}
