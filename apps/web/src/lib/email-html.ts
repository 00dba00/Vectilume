/**
 * HTML for the emails. Tables and inline styles only, so Gmail, Outlook and Apple Mail draw the same thing;
 * images are PNGs from /email/… (mail apps do not show SVG) and every one has alt text for clients that block them.
 */
const INK = "#2d2b30";
const BODY = "#454547";
const MUTED = "#6e6e73";
const BLUE = "#155bd0";
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,'SF Mono',Menlo,Consolas,monospace";

export const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

export function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 4px"><tr>
<td style="border-radius:12px;background:${BLUE}"><a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 26px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px">${label}</a></td>
</tr></table>`;
}

export const small = (html: string) => `<p style="margin:16px 0 0;font-family:${FONT};font-size:13px;line-height:1.5;color:${MUTED}">${html}</p>`;

export const paragraph = (html: string) => `<p style="margin:0 0 14px;font-family:${FONT};font-size:15px;line-height:1.6;color:${BODY}">${html}</p>`;

export const code = (text: string) =>
  `<div style="margin-top:10px;padding:10px 12px;border-radius:10px;background:#f5f5f7;font-family:${MONO};font-size:13px;line-height:1.5;color:${INK};overflow-wrap:break-word">${escapeHtml(text)}</div>`;

/** A status tile (Vectilume icon, white on colour), the request's name with a pill, and what changed. */
export function updateRow(site: string, { tile, icon, title, pill, pillColour, body, asked = "" }: {
  tile: string;
  icon: string;
  title: string;
  pill: string;
  pillColour: string;
  body: string;
  /** The developer's own request, quoted under the change. */
  asked?: string;
}): string {
  return `<tr><td style="padding:16px 0;border-top:1px solid #ececf0">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
<td width="40" valign="top" style="width:40px;padding-right:14px"><img src="${site}/email/on-${tile}-${icon}.png" width="40" height="40" alt="" style="display:block;border:0;border-radius:11px"></td>
<td valign="top" style="font-family:${FONT}">
<div style="font-size:15px;font-weight:600;line-height:1.4;color:${INK}">${title}
<span style="display:inline-block;margin-left:6px;padding:2px 10px;border-radius:999px;background:${pillColour}1a;color:${pillColour};font-size:12px;font-weight:600;vertical-align:1px">${pill}</span></div>
<div style="margin-top:4px;font-size:14px;line-height:1.55;color:${BODY}">${body}</div>${asked}
</td></tr></table>
</td></tr>`;
}

/** The page every email shares: logo, white card, footer. The preheader is the grey line inboxes show under the subject. */
export function layout(site: string, { preheader, hero, title, content, footer }: {
  preheader: string;
  /** Tile above the title, e.g. "on-blue-key". */
  hero: string;
  title: string;
  content: string;
  footer: string;
}): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#eef1f6">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#eef1f6"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px">
<tr><td style="padding:0 8px 20px"><a href="${site}"><img src="${site}/email/logo.png" width="108" height="20" alt="Vectilume" style="display:block;border:0"></a></td></tr>
<tr><td style="padding:32px;border-radius:20px;background:#ffffff">
<img src="${site}/email/${hero}.png" width="48" height="48" alt="" style="display:block;border:0;border-radius:13px;margin-bottom:20px">
<h1 style="margin:0 0 12px;font-family:${FONT};font-size:22px;line-height:1.3;font-weight:700;color:${INK}">${title}</h1>
${content}
</td></tr>
<tr><td style="padding:20px 8px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTED}">${footer}</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export const footerLink = (href: string, label: string) => `<a href="${escapeHtml(href)}" style="color:${MUTED};text-decoration:underline">${label}</a>`;
