import { clientIp, newToken, sha256 } from "@/lib/api-keys";
import { db } from "@/lib/db";

/** Trades the code from a confirmation email for a verified token (POST, so link scanners in mailboxes do not use it up). */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const code = typeof body.code === "string" && /^[A-Za-z0-9_-]{43}$/.test(body.code) ? body.code : null;
  const invalid = () => Response.json({ error: "this link is invalid, already used or older than 15 minutes; ask for a new one" }, { status: 400 });
  if (!code) return invalid();

  const sql = db();
  const [row] = await sql`
    update email_confirmations set used_at = now()
    where code_hash = ${sha256(code)} and used_at is null and created_at > now() - interval '15 minutes'
    returning email`;
  if (!row) return invalid();

  const token = newToken();
  await sql`
    insert into api_keys (email, token_hash, ip_hash, verified_at)
    values (${row.email}, ${sha256(token)}, ${sha256(clientIp(request))}, now())`;
  return Response.json({ token, email: row.email, note: "Store this token now; it is not shown again." }, { status: 201 });
}
