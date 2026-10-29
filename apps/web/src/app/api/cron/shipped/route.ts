import { hasBearer, isAdmin } from "@/lib/api-keys";
import { notifyShipped } from "@/lib/request-emails";

/** Daily Vercel cron (Authorization: Bearer <CRON_SECRET>), or the admin token: mails the requests whose icons shipped on npm. */
export async function GET(request: Request) {
  if (!hasBearer(request, process.env.CRON_SECRET) && !isAdmin(request)) {
    return Response.json({ error: "cron secret or admin token required" }, { status: 401 });
  }
  return Response.json(await notifyShipped());
}
