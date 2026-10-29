import { clientIp, newToken, parseEmail, sha256 } from "@/lib/api-keys";
import { db } from "@/lib/db";
import { confirmationEmail, emailEnabled, sendEmail } from "@/lib/email";

const LIMIT = 3;

/**
 * Registers a developer. With email configured it mails a one-time confirmation link (202) and the token comes
 * from POST /api/keys/confirm; without it the token is returned right away (201). Only token hashes are stored.
 */
export async function POST(request: Request) {
  let email;
  try {
    email = parseEmail(await request.json());
  } catch (error) {
    const message = error instanceof SyntaxError ? "body must be JSON" : (error as Error).message;
    return Response.json({ error: message }, { status: 400 });
  }

  const sql = db();
  const ipHash = sha256(clientIp(request));

  if (emailEnabled()) {
    const [{ count }] = await sql`
      select count(*)::int as count from email_confirmations
      where (ip_hash = ${ipHash} or email = ${email}) and created_at > now() - interval '1 hour'`;
    if (count >= LIMIT) return Response.json({ error: `at most ${LIMIT} confirmation emails per hour` }, { status: 429 });

    const code = newToken().slice(3);
    await sql`insert into email_confirmations (email, code_hash, ip_hash) values (${email}, ${sha256(code)}, ${ipHash})`;
    const link = new URL(`/request-icons?confirm=${code}`, request.url).toString();
    try {
      await sendEmail(email, confirmationEmail(link));
    } catch (error) {
      console.error("confirmation email failed", error);
      return Response.json({ error: "could not send the email, try again later" }, { status: 502 });
    }
    // Same answer for every address, so it does not reveal who has asked before.
    return Response.json(
      { sent: true, note: "We sent a confirmation link to that address. Open it within 15 minutes to get your token." },
      { status: 202 },
    );
  }

  const [{ count }] = await sql`select count(*)::int as count from api_keys where ip_hash = ${ipHash} and created_at > now() - interval '1 hour'`;
  if (count >= LIMIT) return Response.json({ error: `at most ${LIMIT} tokens per hour` }, { status: 429 });

  const token = newToken();
  await sql`insert into api_keys (email, token_hash, ip_hash) values (${email}, ${sha256(token)}, ${ipHash})`;
  return Response.json({ token, note: "Store this token now; it is not shown again." }, { status: 201 });
}
