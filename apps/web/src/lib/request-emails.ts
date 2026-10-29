import { after } from "next/server";
import { newToken } from "@/lib/api-keys";
import { db } from "@/lib/db";
import { emailEnabled, notificationFooter, receivedEmail, sendEmail, shippedEmail, SITE, statusEmail } from "@/lib/email";
import type { RequestRow, StatusChange } from "@/lib/icon-requests";
import { latestPublishedIcons } from "@/lib/published-icons";
import { componentName } from "@/lib/react-snippet";

/** The address's request-email setting, created on first use with the code of its stop link. */
export async function emailSettings(email: string): Promise<{ notify: boolean; code: string }> {
  const sql = db();
  await sql`insert into email_settings (email, unsubscribe_code) values (${email}, ${newToken().slice(3)}) on conflict (email) do nothing`;
  const [row] = await sql`select notify, unsubscribe_code from email_settings where email = ${email}`;
  return { notify: row.notify as boolean, code: row.unsubscribe_code as string };
}

/** Sends a request email unless the address turned them off; false when skipped. Every email carries a stop link. */
async function sendNotification(email: string, { subject, text }: { subject: string; text: string }): Promise<boolean> {
  const { notify, code } = await emailSettings(email);
  if (!notify) return false;
  await sendEmail(email, subject, `${text}\n\n${notificationFooter(`${SITE}/request-icons?unsubscribe=${code}`)}`, {
    // Mail apps show their own unsubscribe button and POST here (RFC 8058 one-click).
    "List-Unsubscribe": `<${SITE}/api/unsubscribe?code=${code}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  });
  return true;
}

/**
 * Sends after the response, so a slow or failed send never fails the call; failures are only logged.
 * Only addresses confirmed at least once get mail: tokens from before email confirmation may carry anyone's address.
 */
function mailLater(requestId: number, build: (row: { name: string; description: string }) => { subject: string; text: string }) {
  if (!emailEnabled()) return;
  after(async () => {
    try {
      const [row] = await db()`
        select k.email, r.name, r.description from icon_requests r join api_keys k on k.id = r.key_id
        where r.id = ${requestId} and exists (select 1 from api_keys v where v.email = k.email and v.verified_at is not null)`;
      if (!row) return;
      await sendNotification(row.email, build(row as { name: string; description: string }));
    } catch (error) {
      console.error(`email for request ${requestId} failed`, error);
    }
  });
}

export const notifyReceived = (id: number) => mailLater(id, (row) => receivedEmail(id, row.name, row.description));

/**
 * Stores a status change and mails the requester when it really changed to accepted, in-progress, ready or declined.
 * review is internal, so going into it, or back from it to in-progress (changes asked), sends nothing.
 */
export async function changeStatus(id: number, change: StatusChange): Promise<RequestRow | null> {
  const [row] = await db()`
    update icon_requests r set status = ${change.status}, decline_reason = ${change.reason}, updated_at = now()
    from (select id, status from icon_requests where id = ${id}) before
    where r.id = before.id
    returning r.id, r.name, r.status, r.decline_reason, r.created_at, before.status as previous`;
  if (!row) return null;
  const { status, reason } = change;
  const quiet = status === row.previous || (row.previous === "review" && status === "in-progress");
  if (!quiet && status !== "open" && status !== "review") mailLater(id, (r) => statusEmail(id, r.name, status, reason));
  return row as RequestRow;
}

/**
 * Mails every request whose icon is in the latest npm release and was not mailed yet. A request without a confirmed
 * address, or whose address turned emails off, is marked without an email; a failed send stays unmarked and is tried again next time.
 */
export async function notifyShipped(): Promise<{ sent: number; skipped: number; failed: number }> {
  const result = { sent: 0, skipped: 0, failed: 0 };
  if (!emailEnabled()) return result;
  const shipped = new Map((await latestPublishedIcons()).filter((icon) => icon.request && !icon.deprecated).map((icon) => [icon.request!, icon]));
  if (shipped.size === 0) return result;

  const sql = db();
  const rows = await sql`
    select r.id, r.name, k.email, exists (select 1 from api_keys v where v.email = k.email and v.verified_at is not null) as confirmed
    from icon_requests r join api_keys k on k.id = r.key_id
    where r.done_notified_at is null and r.id = any(${[...shipped.keys()]})`;
  for (const row of rows) {
    if (row.confirmed) {
      const icon = shipped.get(row.id)!;
      try {
        if (await sendNotification(row.email, shippedEmail(row.id, row.name, icon.id, icon.since, componentName(icon.id, "outline")))) result.sent++;
        else result.skipped++;
      } catch (error) {
        console.error(`shipped email for request ${row.id} failed`, error);
        result.failed++;
        continue;
      }
    } else result.skipped++;
    await sql`update icon_requests set done_notified_at = now() where id = ${row.id}`;
  }
  return result;
}
