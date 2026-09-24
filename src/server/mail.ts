import { createTransport } from "nodemailer";

/**
 * The one outgoing message the system sends (`DEC-61`, `CLAUDE.md` §2): the password-reset link,
 * over Nodemailer/SMTP. Credentials come from the environment only and are never logged (`CLAUDE.md`
 * §8) — a failure below is caught and logged by the caller, never by name-dropping these values.
 */

function readEnv(name: "SMTP_HOST" | "SMTP_PORT" | "SMTP_USER" | "SMTP_PASSWORD" | "SMTP_FROM") {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Copy .env.example to .env and fill it in.`);
  return value;
}

function transport() {
  return createTransport({
    host: readEnv("SMTP_HOST"),
    port: Number(readEnv("SMTP_PORT")),
    // A local catcher (Mailpit) accepts plain SMTP; a real provider needs TLS on 587/465.
    secure: Number(readEnv("SMTP_PORT")) === 465,
    auth: { user: readEnv("SMTP_USER"), pass: readEnv("SMTP_PASSWORD") },
  });
}

/** SCR-03 / API-03 — the reset link is the whole message; no other content identifies the account. */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  await transport().sendMail({
    from: readEnv("SMTP_FROM"),
    to,
    subject: "Reset hasła — Fiszki",
    text: `Aby ustawić nowe hasło, otwórz ten link (ważny 60 minut): ${resetUrl}`,
    html: `<p>Aby ustawić nowe hasło, otwórz poniższy link (ważny 60 minut):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });
}
