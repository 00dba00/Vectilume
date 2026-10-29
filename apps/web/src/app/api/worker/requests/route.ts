import { isWorker } from "@/lib/api-keys";
import { db } from "@/lib/db";

/**
 * For Codex (Authorization: Bearer <WORKER_TOKEN>): the queue, i.e. accepted requests and those being drawn, oldest first,
 * without emails. ?status=ready lists the approved ones instead (the npm release workflow ships only those).
 */
export async function GET(request: Request) {
  if (!isWorker(request)) return Response.json({ error: "worker token required" }, { status: 401 });
  if (new URL(request.url).searchParams.get("status") === "ready") {
    const rows = await db()`select id from icon_requests where status = 'ready' order by id`;
    return Response.json({ ids: rows.map((row) => row.id) });
  }
  const requests = await db()`
    select id, name, description, keywords, status, review_icon as icon, review_note as note, created_at as "createdAt"
    from icon_requests where status in ('accepted', 'in-progress') order by id`;
  return Response.json({ requests });
}
