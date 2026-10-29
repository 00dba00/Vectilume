import { componentName } from "@/lib/react-snippet";

/**
 * Email through Resend's HTTP API (RESEND_API_KEY, EMAIL_FROM such as "Vectilume <noreply@domain>").
 * EMAIL_LOG=1 outside production logs the email instead, so the confirmation flow can be tried locally.
 */
const logOnly = () => process.env.EMAIL_LOG === "1" && process.env.NODE_ENV !== "production";

/** True when tokens must go through a mailed confirmation link; otherwise POST /api/keys answers with a token directly. */
export const emailEnabled = () => logOnly() || Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

export async function sendEmail(to: string, subject: string, text: string, headers?: Record<string, string>): Promise<void> {
  if (logOnly()) {
    console.log(`[email] to ${to}: ${subject}\n${text}`);
    return;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, text, headers }),
  });
  if (!response.ok) throw new Error(`Resend answered ${response.status}: ${await response.text()}`);
}

/** Links in emails that are not answers to a visitor (the daily email) point here. */
export const SITE = "https://vectilume.dev";

export const confirmationEmail = (link: string) => ({
  subject: "Confirm your email for Vectilume icon requests",
  text: `Open this link within 15 minutes to get your Vectilume token and see your icon requests:

${link}

The link works once. If you did not ask for it, ignore this email; nothing happens without it.

Vectilume icons · ${SITE}`,
});

/** Added under every request email; the link opens a page with a button, so mail scanners cannot turn emails off. */
export const notificationFooter = (stopLink: string) => `You get this because you requested an icon on Vectilume with this address.
Stop these emails: ${stopLink}
Vectilume icons · ${SITE}`;

export type RequestUpdate =
  | { id: number; name: string; kind: "accepted" | "ready" }
  | { id: number; name: string; kind: "declined"; reason?: string }
  | { id: number; name: string; kind: "shipped"; icon: string; version: string };

const SHORT = { accepted: "accepted", declined: "declined", ready: "ready", shipped: "on npm" };

function line(update: RequestUpdate): string {
  const head = `#${update.id} ${update.name}`;
  switch (update.kind) {
    case "accepted":
      return `${head}: accepted and queued to be drawn.`;
    case "declined":
      return `${head}: not planned, so we declined it.${update.reason ? ` Reason: ${update.reason}` : ""}`;
    case "ready":
      return `${head}: drawn and added; it ships with the next npm release.`;
    case "shipped":
      return `${head}: on npm in ${update.version}${update.icon === update.name ? "" : ` as "${update.icon}"`}.
  import { ${componentName(update.icon, "outline")} } from "@vectilume/react"`;
  }
}

/** The daily email: the latest change of each request since the last one. */
export function dailyEmail(updates: RequestUpdate[]) {
  const one = updates.length === 1 ? updates[0] : null;
  const shipped = updates.some((u) => u.kind === "shipped");
  return {
    subject: one ? `Icon request #${one.id} ${one.name}: ${SHORT[one.kind]}` : `${updates.length} updates on your Vectilume icon requests`,
    text: `What changed on your icon requests since our last email:

${updates.map(line).join("\n\n")}
${shipped ? "\nGet them with npm install @vectilume/react@latest, or the SVGs from @vectilume/icons.\n" : ""}
Follow your requests at ${SITE}/request-icons (or GET /api/requests with your token).`,
  };
}
