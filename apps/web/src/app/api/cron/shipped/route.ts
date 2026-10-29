import { timingSafeEqual } from "node:crypto";
import { isAdmin, sha256 } from "@/lib/api-keys";
import { notifyShipped } from "@/lib/request-emails";

/** Vercel sends Authorization: Bearer <CRON_SECRET>; hashes keep the comparison constant-time. */
function isCron(request: Request) {
  const given = /^Bearer (.+)$/.exec(request.headers.get("authorization")?.trim() ?? "")?.[1];
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && given) && timingSafeEqual(Buffer.from(sha256(given!)), Buffer.from(sha256(secret!)));
}

/** Daily cron, or the admin token: mails the requests whose icons shipped on npm. */
export async function GET(request: Request) {
  if (!isCron(request) && !isAdmin(request)) return Response.json({ error: "cron secret or admin token required" }, { status: 401 });
  return Response.json(await notifyShipped());
}
