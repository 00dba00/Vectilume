/**
 * Email through Resend's HTTP API (RESEND_API_KEY, EMAIL_FROM such as "Vectilume <noreply@domain>").
 * EMAIL_LOG=1 outside production logs the email instead, so the confirmation flow can be tried locally.
 */
const logOnly = () => process.env.EMAIL_LOG === "1" && process.env.NODE_ENV !== "production";

/** True when tokens must go through a mailed confirmation link; otherwise POST /api/keys answers with a token directly. */
export const emailEnabled = () => logOnly() || Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  if (logOnly()) {
    console.log(`[email] to ${to}: ${subject}\n${text}`);
    return;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, text }),
  });
  if (!response.ok) throw new Error(`Resend answered ${response.status}: ${await response.text()}`);
}

export const confirmationEmail = (link: string) => ({
  subject: "Confirm your email for Vectilume icon requests",
  text: `Open this link within 15 minutes to get your Vectilume token and see your icon requests:

${link}

The link works once. If you did not ask for it, ignore this email; nothing happens without it.

Vectilume icons · https://vectilume.vercel.app`,
});
