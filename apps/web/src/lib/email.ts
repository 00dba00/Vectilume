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

/** Links in emails that are not answers to a visitor (status changes, the daily shipped check) point here. */
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

const FOLLOW = `Follow your requests at ${SITE}/request-icons (or GET /api/requests with your token).`;

export const receivedEmail = (id: number, name: string, description: string) => ({
  subject: `Icon request #${id} received: ${name}`,
  text: `We got your request #${id} for the icon "${name}":

${description}

We will email you when it is accepted, when it is being drawn, when it is ready and when it ships on npm.
${FOLLOW}`,
});

const STATUS_LINE = {
  accepted: (name: string) => `"${name}" is accepted and queued to be drawn.`,
  "in-progress": (name: string) => `"${name}" is being drawn.`,
  ready: (name: string) => `"${name}" is drawn and added to the library. It ships with the next npm release; we will email you then.`,
  declined: (name: string) => `"${name}" is not planned, so we declined the request.`,
};

export const statusEmail = (id: number, name: string, status: keyof typeof STATUS_LINE, reason: string | null) => ({
  subject: `Icon request #${id} ${status === "accepted" ? "is accepted" : status === "in-progress" ? "is in progress" : status === "ready" ? "is ready" : "was declined"}: ${name}`,
  text: `${STATUS_LINE[status](name)}${reason ? `\n\nReason: ${reason}` : ""}

${FOLLOW}`,
});

export const shippedEmail = (id: number, name: string, icon: string, version: string, component: string) => ({
  subject: `Your icon is on npm: ${icon} (request #${id})`,
  text: `The icon you requested as "${name}" shipped in Vectilume ${version}${icon === name ? "" : ` under the name "${icon}"`}.

npm install @vectilume/react@latest
import { ${component}, ${component}Duotone, ${component}Solid } from "@vectilume/react";

Plain SVG: @vectilume/icons/{outline,duotone,solid}/${icon}.svg`,
});
