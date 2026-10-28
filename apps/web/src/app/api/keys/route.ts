import { clientIp, newToken, parseEmail, sha256 } from "@/lib/api-keys";
import { db } from "@/lib/db";

const LIMIT = 3;

/** Registers a developer: returns a token for the requests API. It is shown once; only its hash is stored. */
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
  const [{ count }] = await sql`select count(*)::int as count from api_keys where ip_hash = ${ipHash} and created_at > now() - interval '1 hour'`;
  if (count >= LIMIT) return Response.json({ error: `at most ${LIMIT} tokens per hour` }, { status: 429 });

  const token = newToken();
  await sql`insert into api_keys (email, token_hash, ip_hash) values (${email}, ${sha256(token)}, ${ipHash})`;
  return Response.json({ token, note: "Store this token now; it is not shown again." }, { status: 201 });
}
