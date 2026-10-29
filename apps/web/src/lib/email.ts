import { button, code, escapeHtml, footerLink, layout, paragraph, small, updateRow } from "@/lib/email-html";
import { componentName } from "@/lib/react-snippet";

/**
 * Email through Resend's HTTP API (RESEND_API_KEY, EMAIL_FROM such as "Vectilume <noreply@domain>").
 * EMAIL_LOG=1 outside production logs the email instead, so the confirmation flow can be tried locally.
 */
const logOnly = () => process.env.EMAIL_LOG === "1" && process.env.NODE_ENV !== "production";

/** True when tokens must go through a mailed confirmation link; otherwise POST /api/keys answers with a token directly. */
export const emailEnabled = () => logOnly() || Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

/** Every email has a designed HTML part and the same content as plain text, for clients that show only that. */
export interface Email {
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail(to: string, { subject, text, html }: Email, headers?: Record<string, string>): Promise<void> {
  if (logOnly()) {
    console.log(`[email] to ${to}: ${subject}\n${text}`);
    return;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, text, html, headers }),
  });
  if (!response.ok) throw new Error(`Resend answered ${response.status}: ${await response.text()}`);
}

/** Links and images in emails point here. */
export const SITE = "https://vectilume.dev";

export const confirmationEmail = (link: string): Email => ({
  subject: "Confirm your email for Vectilume icon requests",
  text: `Open this link within 15 minutes to get your Vectilume token and see your icon requests:

${link}

The link works once. If you did not ask for it, ignore this email; nothing happens without it.

Vectilume icons · ${SITE}`,
  html: layout(SITE, {
    preheader: "Your token is one click away. The link works once, for 15 minutes.",
    hero: "on-blue-key",
    title: "Confirm your email",
    content: `${paragraph("Open the link below to get your Vectilume token. With it you can request icons, follow them until they ship on npm, and see every request made with this address.")}
${button(link, "Get my token")}
${small(`The button works once, for 15 minutes. If it does not open, paste this into your browser:<br><a href="${escapeHtml(link)}" style="color:#155bd0;word-break:break-all">${escapeHtml(link)}</a>`)}`,
    footer: `If you did not ask for this, ignore it: nothing happens without the link.<br>${footerLink(SITE, "Vectilume icons")} · free, MIT licensed`,
  }),
});

export const adminLoginEmail = (link: string): Email => ({
  subject: "Sign in to Vectilume admin",
  text: `Open this link within 15 minutes to sign in to Vectilume admin:

${link}

The link works once. If you did not ask for it, ignore this email; nobody signs in without it.`,
  html: layout(SITE, {
    preheader: "Your one-time sign-in link, valid for 15 minutes.",
    hero: "on-violet-key",
    title: "Sign in to admin",
    content: `${paragraph("Someone, hopefully you, asked to sign in to Vectilume admin with this address.")}
${button(link, "Sign in")}
${small(`The button works once, for 15 minutes. If it does not open, paste this into your browser:<br><a href="${escapeHtml(link)}" style="color:#155bd0;word-break:break-all">${escapeHtml(link)}</a>`)}`,
    footer: `If you did not ask for this, ignore it: nobody signs in without the link.<br>${footerLink(SITE, "vectilume.dev")}`,
  }),
});

/** What the developer asked for, quoted in the email so they recognise the request behind each change. */
type Asked = { id: number; name: string; description: string; keywords: string[] };

export type RequestUpdate = Asked &
  ({ kind: "accepted" | "ready" } | { kind: "declined"; reason?: string } | { kind: "shipped"; icon: string; version: string });

const askedText = ({ description, keywords }: Asked) => `  You asked: ${description}${keywords.length ? ` (${keywords.join(", ")})` : ""}`;

const SHORT = { accepted: "accepted", declined: "declined", ready: "ready", shipped: "on npm" };

const importLine = (icon: string) => `import { ${componentName(icon, "outline")} } from "@vectilume/react"`;

function line(update: RequestUpdate): string {
  return `${change(update)}\n${askedText(update)}`;
}

function change(update: RequestUpdate): string {
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
  ${importLine(update.icon)}`;
  }
}

/** Tile colour, Vectilume icon, pill and text of each kind of change, with the request quoted under it. */
function row(update: RequestUpdate): string {
  return updateRow(SITE, { ...rowParts(update), asked: askedHtml(update) });
}

function askedHtml({ description, keywords }: Asked): string {
  const tags = keywords.map((k) => `<span style="display:inline-block;margin:6px 4px 0 0;padding:1px 8px;border-radius:999px;background:#ffffff;border:1px solid #e3e3e8;font-size:12px;color:#6e6e73">${escapeHtml(k)}</span>`).join("");
  return `<div style="margin-top:10px;padding:10px 12px;border-left:3px solid #d2d2d7;border-radius:0 10px 10px 0;background:#fafafc">
<div style="font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#6e6e73">You asked</div>
<div style="margin-top:2px;font-size:14px;line-height:1.5;color:#454547">${escapeHtml(description)}</div>${tags ? `<div>${tags}</div>` : ""}
</div>`;
}

function rowParts(update: RequestUpdate) {
  const title = `<span style="color:#6e6e73;font-weight:500">#${update.id}</span> ${escapeHtml(update.name)}`;
  switch (update.kind) {
    case "accepted":
      return { tile: "violet", icon: "check-circle", title, pill: "Accepted", pillColour: "#5b2bb5", body: "Accepted and queued to be drawn." };
    case "declined":
      return {
        tile: "red",
        icon: "x-circle",
        title,
        pill: "Declined",
        pillColour: "#b42318",
        body: `Not planned, so we declined it.${update.reason ? `<br><span style="color:#6e6e73">Reason:</span> ${escapeHtml(update.reason)}` : ""}`,
      };
    case "ready":
      return { tile: "blue", icon: "sparkles", title, pill: "Ready", pillColour: "#155bd0", body: "Drawn and added to the library. It ships with the next npm release." };
    case "shipped":
      return {
        tile: "green",
        icon: "rocket",
        title,
        pill: `On npm · ${escapeHtml(update.version)}`,
        pillColour: "#1b7f3b",
        body: `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:8px"><tr>
<td valign="middle" style="padding:8px;border-radius:12px;background:#f5f5f7"><img src="${SITE}/email/${update.icon}.png?outline" width="48" height="48" alt="${escapeHtml(update.icon)} icon" style="display:block;border:0"></td>
<td valign="middle" style="padding-left:12px;font-size:14px;color:#454547">${update.icon === update.name ? "Ready to install." : `Named <strong>${escapeHtml(update.icon)}</strong>.`}</td>
</tr></table>${code(importLine(update.icon))}`,
      };
  }
}

/** The daily email: the latest change of each request since the last one. stopLink turns these emails off. */
export function dailyEmail(updates: RequestUpdate[], stopLink: string): Email {
  const one = updates.length === 1 ? updates[0] : null;
  const shipped = updates.filter((u) => u.kind === "shipped").length;
  const subject = one ? `Icon request #${one.id} ${one.name}: ${SHORT[one.kind]}` : `${updates.length} updates on your Vectilume icon requests`;
  const follow = `${SITE}/request-icons`;
  return {
    subject,
    text: `What changed on your icon requests since our last email:

${updates.map(line).join("\n\n")}
${shipped ? "\nGet them with npm install @vectilume/react@latest, or the SVGs from @vectilume/icons.\n" : ""}
Follow your requests at ${follow} (or GET /api/requests with your token).

You get this because you requested an icon on Vectilume with this address.
Stop these emails: ${stopLink}
Vectilume icons · ${SITE}`,
    html: layout(SITE, {
      preheader: shipped ? `${shipped === 1 ? "An icon you asked for is" : `${shipped} icons you asked for are`} on npm.` : `${updates.map((u) => `${u.name}: ${SHORT[u.kind]}`).join(", ")}`,
      hero: shipped ? "on-green-rocket" : "on-blue-mail",
      title: shipped ? (shipped === 1 ? "Your icon is here" : "Your icons are here") : "News on your icon requests",
      content: `${paragraph(one ? "Here is what changed on your request since our last email." : `Here is what changed on your ${updates.length} requests since our last email.`)}
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:8px">${updates.map(row).join("\n")}</table>
${shipped ? `<div style="margin-top:4px;padding-top:16px;border-top:1px solid #ececf0">${paragraph("Update to get them, with the Duotone and Solid versions and the SVG files:")}${code("npm install @vectilume/react@latest")}</div>` : ""}
${button(follow, "See all your requests")}`,
      footer: `You get this because you requested an icon on Vectilume with this address. At most one email a day.<br>${footerLink(stopLink, "Stop these emails")} · ${footerLink(SITE, "vectilume.dev")}`,
    }),
  };
}
