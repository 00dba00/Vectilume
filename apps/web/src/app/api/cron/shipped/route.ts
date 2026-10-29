import { hasBearer, isAdmin } from "@/lib/api-keys";
import { sendDailyEmails } from "@/lib/request-emails";

/** Daily Vercel cron (Authorization: Bearer <CRON_SECRET>), or the admin token: records shipped requests and sends the daily emails. */
export async function GET(request: Request) {
  if (!hasBearer(request, process.env.CRON_SECRET) && !isAdmin(request)) {
    return Response.json({ error: "cron secret or admin token required" }, { status: 401 });
  }
  return Response.json(await sendDailyEmails());
}
