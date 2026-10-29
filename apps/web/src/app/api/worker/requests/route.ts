import { isWorker } from "@/lib/api-keys";
import { db } from "@/lib/db";

/** For Codex (Authorization: Bearer <WORKER_TOKEN>): the queue, i.e. accepted requests and those being drawn, oldest first, without emails. */
export async function GET(request: Request) {
  if (!isWorker(request)) return Response.json({ error: "worker token required" }, { status: 401 });
  const requests = await db()`
    select id, name, description, keywords, status, review_icon as icon, review_note as note, created_at as "createdAt"
    from icon_requests where status in ('accepted', 'in-progress') order by id`;
  return Response.json({ requests });
}
