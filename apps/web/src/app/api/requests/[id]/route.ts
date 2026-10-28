import { cacheLife } from "next/cache";
import { github } from "@/lib/github";
import { requestStatus, type GithubIssue, type PublishedIcon } from "@/lib/icon-requests";

/** Icons of the latest @vectilume/icons on npm, which is what "done" means. */
async function publishedIcons(): Promise<PublishedIcon[]> {
  "use cache";
  cacheLife("hours");
  const response = await fetch("https://unpkg.com/@vectilume/icons@latest/manifest.json");
  if (!response.ok) throw new Error(`unpkg answered ${response.status}`);
  return ((await response.json()) as { icons: PublishedIcon[] }).icons;
}

export async function GET(_request: Request, ctx: RouteContext<"/api/requests/[id]">) {
  const { id } = await ctx.params;
  if (!/^\d{1,9}$/.test(id)) return Response.json({ error: "id must be a number" }, { status: 400 });

  const response = await github(`/issues/${id}`);
  if (response.status === 404) return Response.json({ error: "no such request" }, { status: 404 });
  if (!response.ok) {
    console.error(`GitHub issue read failed: ${response.status} ${await response.text()}`);
    return Response.json({ error: "could not read the request, try again later" }, { status: 502 });
  }
  const status = requestStatus((await response.json()) as GithubIssue, await publishedIcons());
  if (!status) return Response.json({ error: "no such request" }, { status: 404 });
  return Response.json(status);
}
