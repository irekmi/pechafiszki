"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Toast } from "./Toast";

type Notify = (text?: string) => void;
const Notify = createContext<Notify | null>(null);

/** The callback a row runs once its action succeeded: shows the board's `message`, or `text` instead. */
export function useToastBoard(): Notify {
  const notify = useContext(Notify);
  if (!notify) throw new Error("useToastBoard must be used inside ToastBoard");
  return notify;
}

/**
 * Holds a toast above a list whose rows refresh in place (SCR-18, SCR-19, SCR-21). It stays mounted
 * while the list re-renders underneath it — also when the removed row was the last one and the empty
 * state takes the table's place — so the toast survives the row that raised it (server-rendered
 * children pass through untouched). `message` is the one fixed text most boards need; a board with
 * more than one outcome (SCR-21's add / reorder / delete) omits it and passes its own text to every
 * `notify(text)` call instead.
 */
export function ToastBoard({ message, children }: { message?: string; children: ReactNode }) {
  const [toast, setToast] = useState<{ n: number; text: string } | null>(null);
  const notify = useCallback<Notify>(
    (text) => setToast((last) => ({ n: (last?.n ?? 0) + 1, text: text ?? message ?? "" })),
    [message],
  );
  const hide = useCallback(() => setToast(null), []);
  return (
    <Notify.Provider value={notify}>
      {children}
      <Toast key={toast?.n ?? 0} message={toast ? toast.text : null} onHide={hide} />
    </Notify.Provider>
  );
}
