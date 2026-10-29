import { isWorker } from "@/lib/api-keys";
import { db } from "@/lib/db";
import { parseWorkerChange } from "@/lib/icon-requests";
import { changeStatus } from "@/lib/request-emails";

/** For Codex: in-progress when it starts drawing, review with the icon and its SVGs when done. Approving stays with the owner. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/worker/requests/[id]">) {
  if (!isWorker(request)) return Response.json({ error: "worker token required" }, { status: 401 });
  const { id } = await ctx.params;
  if (!/^\d{1,9}$/.test(id)) return Response.json({ error: "id must be a number" }, { status: 400 });

  let change;
  try {
    change = parseWorkerChange(await request.json());
  } catch (error) {
    const message = error instanceof SyntaxError ? "body must be JSON" : (error as Error).message;
    return Response.json({ error: message }, { status: 400 });
  }

  const sql = db();
  const [current] = await sql`select status from icon_requests where id = ${Number(id)}`;
  if (!current) return Response.json({ error: "no such request" }, { status: 404 });
  if (!["accepted", "in-progress", "review"].includes(current.status)) {
    const why = current.status === "open" ? "waits for the owner to accept it" : `is ${current.status}; only the owner can change it now`;
    return Response.json({ error: `request ${why}` }, { status: 409 });
  }
  // The owner's note stays until a new version is sent for review.
  if (change.status === "review") {
    await sql`update icon_requests set review_icon = ${change.icon}, review_svgs = ${JSON.stringify(change.svgs)}, review_note = null where id = ${Number(id)}`;
  }
  const row = await changeStatus(Number(id), { status: change.status, reason: null });
  return Response.json({ id: row!.id, name: row!.name, status: row!.status, previous: current.status });
}
