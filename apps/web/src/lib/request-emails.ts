import { after } from "next/server";
import { db } from "@/lib/db";
import { emailEnabled, receivedEmail, sendEmail, shippedEmail, statusEmail } from "@/lib/email";
import type { RequestRow, StatusChange } from "@/lib/icon-requests";
import { latestPublishedIcons } from "@/lib/published-icons";
import { componentName } from "@/lib/react-snippet";

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
      const { subject, text } = build(row as { name: string; description: string });
      await sendEmail(row.email, subject, text);
    } catch (error) {
      console.error(`email for request ${requestId} failed`, error);
    }
  });
}

export const notifyReceived = (id: number) => mailLater(id, (row) => receivedEmail(id, row.name, row.description));

/** Stores an admin status change and mails the requester when the status really changed to in-progress, ready or declined. */
export async function changeStatus(id: number, change: StatusChange): Promise<RequestRow | null> {
  const [row] = await db()`
    update icon_requests r set status = ${change.status}, decline_reason = ${change.reason}, updated_at = now()
    from (select id, status from icon_requests where id = ${id}) before
    where r.id = before.id
    returning r.id, r.name, r.status, r.decline_reason, r.created_at, before.status as previous`;
  if (!row) return null;
  const { status, reason } = change;
  if (status !== "open" && status !== row.previous) mailLater(id, (r) => statusEmail(id, r.name, status, reason));
  return row as RequestRow;
}

/**
 * Mails every request whose icon is in the latest npm release and was not mailed yet. A request without a confirmed
 * address is marked without an email; a failed send stays unmarked and is tried again next time.
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
      const { subject, text } = shippedEmail(row.id, row.name, icon.id, icon.since, componentName(icon.id, "outline"));
      try {
        await sendEmail(row.email, subject, text);
        result.sent++;
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
