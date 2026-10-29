import { db } from "@/lib/db";

/**
 * Turns request emails off for the address behind a stop-link code: the code comes in the query (mail apps' one-click
 * POST, RFC 8058) or as JSON {code} from /request-icons?unsubscribe=…. POST only, so links opened by scanners do nothing.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const raw = new URL(request.url).searchParams.get("code") ?? body.code;
  const code = typeof raw === "string" && /^[A-Za-z0-9_-]{43}$/.test(raw) ? raw : null;
  const [row] = code ? await db()`update email_settings set notify = false, updated_at = now() where unsubscribe_code = ${code} returning email` : [];
  if (!row) return Response.json({ error: "this stop link is not valid" }, { status: 400 });
  return Response.json({ emails: false, note: "No more emails about your icon requests. Turn them back on at /request-icons." });
}
