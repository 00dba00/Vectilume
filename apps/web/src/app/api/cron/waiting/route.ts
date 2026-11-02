import { hasBearer, isAdmin } from "@/lib/api-keys";
import { alertOwner } from "@/lib/request-emails";

/** Daily Vercel cron (Authorization: Bearer <CRON_SECRET>): mails the owner the open requests. The admin token sends it even when none are open, as a test. */
export async function GET(request: Request) {
  const admin = isAdmin(request);
  if (!hasBearer(request, process.env.CRON_SECRET) && !admin) {
    return Response.json({ error: "cron secret or admin token required" }, { status: 401 });
  }
  return Response.json(await alertOwner({ always: admin }));
}
