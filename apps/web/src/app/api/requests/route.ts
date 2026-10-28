import { github } from "@/lib/github";
import { issueFor, parseIconRequest } from "@/lib/icon-requests";

const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;
// shortcut: per-instance memory, so the limit resets on cold starts and is per region; move to Vercel WAF or a KV store if spam gets through.
const recent = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((at) => now - at < WINDOW_MS);
  const limited = hits.length >= LIMIT;
  if (!limited) hits.push(now);
  recent.set(ip, hits);
  return limited;
}

/** Opens an icon request as a GitHub issue; the issue number is the id for GET /api/requests/{id}. */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return Response.json({ error: `at most ${LIMIT} requests per hour` }, { status: 429 });

  let parsed;
  try {
    parsed = parseIconRequest(await request.json());
  } catch (error) {
    const message = error instanceof SyntaxError ? "body must be JSON" : (error as Error).message;
    return Response.json({ error: message }, { status: 400 });
  }

  const response = await github("/issues", { method: "POST", body: JSON.stringify(issueFor(parsed)) });
  if (!response.ok) {
    console.error(`GitHub issue create failed: ${response.status} ${await response.text()}`);
    return Response.json({ error: "could not store the request, try again later" }, { status: 502 });
  }
  const issue = (await response.json()) as { number: number; html_url: string };
  const statusUrl = new URL(`/api/requests/${issue.number}`, request.url).toString();
  return Response.json({ id: issue.number, status: "open", url: issue.html_url, statusUrl }, { status: 201 });
}
