/** ready = drawn and added to the library, waiting for the npm release that makes it done. */
export const STORED_STATUSES = ["open", "in-progress", "ready", "declined"] as const;
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
  | { id: number; name: string; status: "open" | "in-progress" | "ready"; createdAt: string }
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
export function parseStatusChange(input: unknown): { status: StoredStatus; reason: string | null } {
  const body = (input ?? {}) as Record<string, unknown>;
  const status = STORED_STATUSES.find((s) => s === body.status);
  if (!status) throw new Error(`status must be one of ${STORED_STATUSES.join(", ")}; done comes from the npm release`);
  const reason = typeof body.reason === "string" && status === "declined" ? plain(body.reason).slice(0, 500) || null : null;
  return { status, reason };
}

export function requestStatus(row: RequestRow, published: PublishedIcon[]): RequestStatus {
  const base = { id: row.id, name: row.name, createdAt: new Date(row.created_at).toISOString() };
  // The published package is the source of truth: done means installable, whatever the stored status says.
  // Deprecated aliases of a renamed icon carry the same request, so skip them for the current name.
  const icon = published.find((entry) => entry.request === row.id && !entry.deprecated);
  if (icon) return { ...base, status: "done", icon: icon.id, version: icon.since };
  if (row.status === "declined") return { ...base, status: "declined", reason: row.decline_reason };
  return { ...base, status: row.status };
}
