/** Icon requests are GitHub issues with this label; the issue number is the request id. */
export const REQUEST_LABEL = "icon-request";
/** Put on an open request while the icon is being drawn. */
export const IN_PROGRESS_LABEL = "in-progress";

export interface IconRequest {
  name: string;
  description: string;
  keywords: string[];
}

export type RequestStatus =
  | { id: number; status: "open" | "in-progress" | "declined"; url: string }
  | { id: number; status: "done"; url: string; icon: string; version: string };

export interface GithubIssue {
  number: number;
  html_url: string;
  state: "open" | "closed";
  state_reason?: string | null;
  labels: (string | { name?: string })[];
  pull_request?: unknown;
}

export interface PublishedIcon {
  id: string;
  since: string;
  request?: number;
  deprecated?: true;
}

const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// Issues render Markdown, so the text fields drop anything that could become markup or a mention.
const plain = (text: string) => text.replace(/[<>`@\\]/g, "").replace(/\s+/g, " ").trim();

/** Validates an untrusted request body; throws a message that is safe to send back. */
export function parseIconRequest(input: unknown): IconRequest {
  const body = (input ?? {}) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim().toLowerCase() : "";
  if (!NAME.test(name) || name.length > 40) throw new Error("name must be a kebab-case name up to 40 characters, e.g. basketball-hoop");
  const description = typeof body.description === "string" ? plain(body.description) : "";
  if (description.length < 10 || description.length > 500) throw new Error("description must be 10–500 characters: what the icon shows and where it is used");
  const raw = body.keywords ?? [];
  if (!Array.isArray(raw) || raw.length > 10 || raw.some((k) => typeof k !== "string" || plain(k).length === 0 || k.length > 30)) {
    throw new Error("keywords must be a list of up to 10 words, each up to 30 characters");
  }
  return { name, description, keywords: raw.map((k: string) => plain(k).toLowerCase()) };
}

export function issueFor(request: IconRequest): { title: string; body: string; labels: string[] } {
  const keywords = request.keywords.length > 0 ? request.keywords.join(", ") : "—";
  return {
    title: `Icon request: ${request.name}`,
    body: `**Name:** ${request.name}\n\n**What it shows / where it is used:**\n${request.description}\n\n**Keywords:** ${keywords}\n\n_Submitted through the Vectilume requests API._`,
    labels: [REQUEST_LABEL],
  };
}

const labelNames = (issue: GithubIssue) => issue.labels.map((label) => (typeof label === "string" ? label : label.name));

/** Null when the issue is not an icon request, so the API cannot be used to read other issues. */
export function requestStatus(issue: GithubIssue, published: PublishedIcon[]): RequestStatus | null {
  const labels = labelNames(issue);
  if (issue.pull_request || !labels.includes(REQUEST_LABEL)) return null;
  const base = { id: issue.number, url: issue.html_url };
  // The published package is the source of truth: done means installable, whatever the issue says.
  // Deprecated aliases of a renamed icon carry the same request, so skip them for the current name.
  const icon = published.find((entry) => entry.request === issue.number && !entry.deprecated);
  if (icon) return { ...base, status: "done", icon: icon.id, version: icon.since };
  if (issue.state === "closed" && issue.state_reason !== "completed") return { ...base, status: "declined" };
  // Closed as completed but not on npm yet: still waiting for the release.
  if (issue.state === "closed" || labels.includes(IN_PROGRESS_LABEL)) return { ...base, status: "in-progress" };
  return { ...base, status: "open" };
}
