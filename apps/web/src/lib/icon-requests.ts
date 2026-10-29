/**
 * accepted = the owner approved the request, it waits in Codex's queue;
 * review = drawn by Codex, waiting for the owner's approval (developers see in-progress);
 * ready = approved and added to the library, waiting for the npm release that makes it done.
 */
export const STORED_STATUSES = ["open", "accepted", "in-progress", "review", "ready", "declined"] as const;
export type StoredStatus = (typeof STORED_STATUSES)[number];

export interface IconRequest {
  name: string;
  description: string;
  keywords: string[];
}

/** A row of icon_requests as the status routes select it. */
export interface RequestRow {
  id: number;
  name: string;
  status: StoredStatus;
  decline_reason: string | null;
  created_at: Date | string;
}

export type RequestStatus =
  | { id: number; name: string; status: "open" | "accepted" | "in-progress" | "review" | "ready"; createdAt: string }
  | { id: number; name: string; status: "declined"; reason: string | null; createdAt: string }
  | { id: number; name: string; status: "done"; icon: string; version: string; createdAt: string };

export interface PublishedIcon {
  id: string;
  since: string;
  request?: number;
  deprecated?: true;
}

const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const plain = (text: string) => text.replace(/\s+/g, " ").trim();

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

/** Validates an admin status change; "done" is not settable, it comes from the npm release. */
export type StatusChange = { status: StoredStatus; reason: string | null };

export function parseStatusChange(input: unknown): StatusChange {
  const body = (input ?? {}) as Record<string, unknown>;
  const status = STORED_STATUSES.find((s) => s === body.status);
  if (!status) throw new Error(`status must be one of ${STORED_STATUSES.join(", ")}; done comes from the npm release`);
  const reason = typeof body.reason === "string" && status === "declined" ? plain(body.reason).slice(0, 500) || null : null;
  return { status, reason };
}

/** review is an internal step: everyone but the admin sees in-progress. */
export function requestStatus(row: RequestRow, published: PublishedIcon[], admin = false): RequestStatus {
  const base = { id: row.id, name: row.name, createdAt: new Date(row.created_at).toISOString() };
  // The published package is the source of truth: done means installable, whatever the stored status says.
  // Deprecated aliases of a renamed icon carry the same request, so skip them for the current name.
  const icon = published.find((entry) => entry.request === row.id && !entry.deprecated);
  if (icon) return { ...base, status: "done", icon: icon.id, version: icon.since };
  if (row.status === "declined") return { ...base, status: "declined", reason: row.decline_reason };
  return { ...base, status: row.status === "review" && !admin ? "in-progress" : row.status };
}

export const ICON_STYLES = ["outline", "duotone", "solid"] as const;
export type ReviewSvgs = Record<(typeof ICON_STYLES)[number], string>;

export type WorkerChange = { status: "in-progress" } | { status: "review"; icon: string; svgs: ReviewSvgs };

const SVG = /^\s*<svg[\s>][\s\S]*<\/svg>\s*$/;

/** Validates what Codex sends: in-progress, or review with the icon id and its three SVGs (shown in /admin as images only). */
export function parseWorkerChange(input: unknown): WorkerChange {
  const body = (input ?? {}) as Record<string, unknown>;
  if (body.status === "in-progress") return { status: "in-progress" };
  if (body.status !== "review") throw new Error("status must be in-progress or review");
  const icon = typeof body.icon === "string" ? body.icon : "";
  if (!NAME.test(icon) || icon.length > 40) throw new Error("icon must be the kebab-case id of the drawn icon");
  const raw = (body.svgs ?? {}) as Record<string, unknown>;
  const svgs = {} as ReviewSvgs;
  for (const style of ICON_STYLES) {
    const svg = raw[style];
    if (typeof svg !== "string" || svg.length > 20_000 || !SVG.test(svg)) throw new Error(`svgs.${style} must be one <svg> element up to 20 KB`);
    svgs[style] = svg.trim();
  }
  return { status: "review", icon, svgs };
}
