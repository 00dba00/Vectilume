import { isAdmin } from "@/lib/api-keys";
import { db, keyId, unauthorized } from "@/lib/db";
import { parseStatusChange, requestStatus, type RequestRow } from "@/lib/icon-requests";
import { publishedIcons } from "@/lib/published-icons";

const validId = (id: string) => /^\d{1,9}$/.test(id);
const notFound = () => Response.json({ error: "no such request" }, { status: 404 });

/** Status of one request; only the token that made it can read it. */
export async function GET(request: Request, ctx: RouteContext<"/api/requests/[id]">) {
  const { id } = await ctx.params;
  if (!validId(id)) return Response.json({ error: "id must be a number" }, { status: 400 });
  const key = await keyId(request);
  if (key === null) return unauthorized();

  const [row] = (await db()`
    select id, name, status, decline_reason, created_at from icon_requests
    where id = ${Number(id)} and key_id = ${key}`) as RequestRow[];
  if (!row) return notFound();
  return Response.json(requestStatus(row, await publishedIcons()));
}

/** Admin only (Authorization: Bearer <ADMIN_TOKEN>): set open, in-progress or declined with an optional reason. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/requests/[id]">) {
  if (!isAdmin(request)) return Response.json({ error: "admin token required" }, { status: 401 });
  const { id } = await ctx.params;
  if (!validId(id)) return Response.json({ error: "id must be a number" }, { status: 400 });

  let change;
  try {
    change = parseStatusChange(await request.json());
  } catch (error) {
    const message = error instanceof SyntaxError ? "body must be JSON" : (error as Error).message;
    return Response.json({ error: message }, { status: 400 });
  }

  const [row] = (await db()`
    update icon_requests set status = ${change.status}, decline_reason = ${change.reason}, updated_at = now()
    where id = ${Number(id)}
    returning id, name, status, decline_reason, created_at`) as RequestRow[];
  if (!row) return notFound();
  return Response.json(requestStatus(row, await publishedIcons()));
}
