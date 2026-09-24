import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fiszki na rozmowy rekrutacyjne",
  description:
    "Nauka odpowiedzi na pytania z rozmów rekrutacyjnych dla programistów — jedna wspólna pula fiszek.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pl">
      <body className="bg-bg text-ink font-sans text-body-sm leading-body md:text-15">
        {children}
      </body>
    </html>
  );
}
