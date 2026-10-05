"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Toast } from "@/components/ui/Toast";

type StudyContext = {
  revealed: boolean;
  toggle: () => void;
  notify: (message: string) => void;
};

const Study = createContext<StudyContext | null>(null);

export function useStudy(): StudyContext {
  const value = useContext(Study);
  if (!value) throw new Error("useStudy must be used inside StudyShell");
  return value;
}

/**
 * The client state SCR-06 shares between distant parts of the screen: whether the card is flipped
 * (the card itself and **Pokaż / ukryj** both drive it) and the toast. It re-hides the answer when
 * `cardKey` changes — a new card always starts on its question — while the toast, which lives
 * here, survives the refresh that brings the next card in. `app.js`'s flip and toast, in React.
 */
export function StudyShell({ cardKey, children }: { cardKey: string; children: ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  const [shownKey, setShownKey] = useState(cardKey);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);

  if (shownKey !== cardKey) {
    setShownKey(cardKey);
    setRevealed(false);
  }
  const toggle = useCallback(() => setRevealed((value) => !value), []);
  const notify = useCallback((message: string) => setToast((last) => ({ id: (last?.id ?? 0) + 1, message })), []);
  const hide = useCallback(() => setToast(null), []);

  return (
    <Study.Provider value={{ revealed, toggle, notify }}>
      {children}
      <Toast key={toast?.id} message={toast?.message ?? null} onHide={hide} />
    </Study.Provider>
  );
}
