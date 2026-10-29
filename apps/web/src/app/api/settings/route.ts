import { apiKey, db, unauthorized } from "@/lib/db";
import { emailSettings } from "@/lib/request-emails";

// Only tokens from a confirmed email: an older unconfirmed token may carry someone else's address.
const unconfirmed = () => Response.json({ error: "confirm your email first: get a token through the emailed link" }, { status: 403 });

/** Whether the token's email gets request emails (the daily email with accepted, declined, ready and shipped requests). */
export async function GET(request: Request) {
  const key = await apiKey(request);
  if (key === null) return unauthorized();
  if (!key.verifiedEmail) return unconfirmed();
  const { notify } = await emailSettings(key.verifiedEmail);
  return Response.json({ email: key.verifiedEmail, emails: notify });
}

/** {"emails": false} stops request emails for the token's email, {"emails": true} turns them back on. */
export async function PATCH(request: Request) {
  const key = await apiKey(request);
  if (key === null) return unauthorized();
  if (!key.verifiedEmail) return unconfirmed();
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (typeof body.emails !== "boolean") return Response.json({ error: "send {\"emails\": true} or {\"emails\": false}" }, { status: 400 });
  await emailSettings(key.verifiedEmail);
  await db()`update email_settings set notify = ${body.emails}, updated_at = now() where email = ${key.verifiedEmail}`;
  return Response.json({ email: key.verifiedEmail, emails: body.emails });
}
