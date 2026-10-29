import { newToken } from "@/lib/api-keys";
import { db } from "@/lib/db";
import { dailyEmail, emailEnabled, sendEmail, SITE, type Email, type RequestUpdate } from "@/lib/email";
import type { RequestRow, StatusChange } from "@/lib/icon-requests";
import { latestPublishedIcons } from "@/lib/published-icons";

/** The address's request-email setting, created on first use with the code of its stop link. */
export async function emailSettings(email: string): Promise<{ notify: boolean; code: string }> {
  const sql = db();
  await sql`insert into email_settings (email, unsubscribe_code) values (${email}, ${newToken().slice(3)}) on conflict (email) do nothing`;
  const [row] = await sql`select notify, unsubscribe_code from email_settings where email = ${email}`;
  return { notify: row.notify as boolean, code: row.unsubscribe_code as string };
}

/** Sends a request email unless the address turned them off; false when skipped. Every email carries a stop link. */
async function sendNotification(email: string, build: (stopLink: string) => Email): Promise<boolean> {
  const { notify, code } = await emailSettings(email);
  if (!notify) return false;
  await sendEmail(email, build(`${SITE}/request-icons?unsubscribe=${code}`), {
    // Mail apps show their own unsubscribe button and POST here (RFC 8058 one-click).
    "List-Unsubscribe": `<${SITE}/api/unsubscribe?code=${code}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  });
  return true;
}

/** Changes worth telling the developer; in-progress and review are internal steps. */
const TOLD = ["accepted", "declined", "ready"];

/** Stores a status change and records it for the daily email when it really changed to accepted, declined or ready. */
export async function changeStatus(id: number, change: StatusChange): Promise<RequestRow | null> {
  const sql = db();
  const [row] = await sql`
    update icon_requests r set status = ${change.status}, decline_reason = ${change.reason}, updated_at = now()
    from (select id, status from icon_requests where id = ${id}) before
    where r.id = before.id
    returning r.id, r.name, r.status, r.decline_reason, r.created_at, before.status as previous`;
  if (!row) return null;
  if (change.status !== row.previous && TOLD.includes(change.status)) {
    const detail = change.reason ? { reason: change.reason } : {};
    await sql`insert into request_updates (request_id, kind, detail) values (${id}, ${change.status}, ${JSON.stringify(detail)})`;
  }
  return row as RequestRow;
}

/** Records a shipped update for every request whose icon is in the latest npm release and was not recorded yet. */
export async function recordShipped(): Promise<number> {
  const shipped = new Map((await latestPublishedIcons()).filter((icon) => icon.request && !icon.deprecated).map((icon) => [icon.request!, icon]));
  if (shipped.size === 0) return 0;
  const sql = db();
  const rows = await sql`update icon_requests set done_notified_at = now() where done_notified_at is null and id = any(${[...shipped.keys()]}) returning id`;
  for (const { id } of rows) {
    const icon = shipped.get(id)!;
    await sql`insert into request_updates (request_id, kind, detail) values (${id}, 'shipped', ${JSON.stringify({ icon: icon.id, version: icon.since })})`;
  }
  return rows.length;
}

/**
 * The daily email: one per address, with the latest unsent change of each of its requests. Addresses never confirmed
 * (older tokens may carry anyone's) or with emails turned off get nothing and their updates are marked sent; a failed
 * send stays unsent and goes out the next day. At most one a day: the morning cron leaves an address mailed in the last
 * 20 hours (the owner pressed the button in /admin) for later; the button itself always sends.
 */
export async function sendDailyEmails({ fromAdmin = false } = {}): Promise<{ shipped: number; sent: number; skipped: number; failed: number; later: number }> {
  const result = { shipped: 0, sent: 0, skipped: 0, failed: 0, later: 0 };
  if (!emailEnabled()) return result;
  result.shipped = await recordShipped();

  const sql = db();
  const rows = await sql`
    select u.id, u.request_id, u.kind, u.detail, r.name, r.description, r.keywords, k.email,
      exists (select 1 from api_keys v where v.email = k.email and v.verified_at is not null) as confirmed,
      coalesce(s.last_sent_at > now() - interval '20 hours', false) as mailed_recently
    from request_updates u join icon_requests r on r.id = u.request_id join api_keys k on k.id = r.key_id
    left join email_settings s on s.email = k.email
    where u.sent_at is null order by u.id`;
  const byEmail = Map.groupBy(rows, (row) => row.email as string);
  for (const [email, updates] of byEmail) {
    if (!fromAdmin && updates[0].mailed_recently) {
      result.later++;
      continue;
    }
    // Accepted and then ready on the same day reads as ready.
    const latest = new Map(updates.map((u) => [u.request_id as number, { id: u.request_id, name: u.name, description: u.description, keywords: u.keywords, kind: u.kind, ...u.detail } as RequestUpdate]));
    try {
      if (updates[0].confirmed && (await sendNotification(email, (stopLink) => dailyEmail([...latest.values()], stopLink)))) {
        await sql`update email_settings set last_sent_at = now() where email = ${email}`;
        result.sent++;
      } else result.skipped++;
    } catch (error) {
      console.error(`daily email for updates ${updates.map((u) => u.id).join(", ")} failed`, error);
      result.failed++;
      continue;
    }
    await sql`update request_updates set sent_at = now() where id = any(${updates.map((u) => u.id)})`;
  }
  return result;
}
