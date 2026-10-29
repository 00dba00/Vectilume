import { isWorker } from "@/lib/api-keys";
import { recordShipped } from "@/lib/request-emails";

/** Called by the npm release workflow: records the requests that just shipped for the update email (sends nothing). */
export async function POST(request: Request) {
  if (!isWorker(request)) return Response.json({ error: "worker token required" }, { status: 401 });
  return Response.json({ recorded: await recordShipped() });
}
