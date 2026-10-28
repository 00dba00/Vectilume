import { isAdmin } from "@/lib/api-keys";
import { apiKey, db, unauthorized } from "@/lib/db";
import { parseIconRequest, requestStatus, type RequestRow } from "@/lib/icon-requests";
import { publishedIcons } from "@/lib/published-icons";

const LIMIT = 20;

/** Stores an icon request for the token's owner; the returned id is the one GET /api/requests/{id} takes. */
export async function POST(request: Request) {
  const key = await apiKey(request);
  if (key === null) return unauthorized();

  let parsed;
  try {
    parsed = parseIconRequest(await request.json());
  } catch (error) {
    const message = error instanceof SyntaxError ? "body must be JSON" : (error as Error).message;
    return Response.json({ error: message }, { status: 400 });
  }

  const sql = db();
  const [{ count }] = await sql`select count(*)::int as count from icon_requests where key_id = ${key.id} and created_at > now() - interval '1 hour'`;
  if (count >= LIMIT) return Response.json({ error: `at most ${LIMIT} requests per hour` }, { status: 429 });

  const [{ id }] = await sql`
    insert into icon_requests (key_id, name, description, keywords)
    values (${key.id}, ${parsed.name}, ${parsed.description}, ${parsed.keywords})
    returning id`;
  const statusUrl = new URL(`/api/requests/${id}`, request.url).toString();
  return Response.json({ id, status: "open", statusUrl }, { status: 201 });
}

/** All requests made with this token, newest first; a token from a confirmed email gets every request of that email. The admin token gets every request, with its email. */
export async function GET(request: Request) {
  if (isAdmin(request)) {
    const rows = (await db()`
      select r.id, r.name, r.status, r.decline_reason, r.created_at, k.email from icon_requests r
      join api_keys k on k.id = r.key_id order by r.id desc limit 500`) as (RequestRow & { email: string })[];
    const published = await publishedIcons();
    return Response.json({ admin: true, requests: rows.map((row) => ({ ...requestStatus(row, published), email: row.email })) });
  }
  const key = await apiKey(request);
  if (key === null) return unauthorized();
  // email = null never matches, so an unconfirmed token sees only its own requests.
  const rows = (await db()`
    select r.id, r.name, r.status, r.decline_reason, r.created_at from icon_requests r
    join api_keys k on k.id = r.key_id
    where r.key_id = ${key.id} or k.email = ${key.verifiedEmail} order by r.id desc limit 200`) as RequestRow[];
  const published = await publishedIcons();
  return Response.json({ requests: rows.map((row) => requestStatus(row, published)) });
}
