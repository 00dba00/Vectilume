import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** A developer token: vl_ + 32 random bytes. Shown once; only its hash is stored. */
export const newToken = () => `vl_${randomBytes(32).toString("base64url")}`;

export const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");

/** The token from `Authorization: Bearer vl_…`, or null when missing or malformed. */
export function bearerToken(request: Request): string | null {
  const match = /^Bearer (vl_[A-Za-z0-9_-]{43})$/.exec(request.headers.get("authorization")?.trim() ?? "");
  return match?.[1] ?? null;
}

/** SHA-256 of ADMIN_TOKEN, or null when it is not set. The admin session cookie holds this value. */
export const adminTokenHash = () => (process.env.ADMIN_TOKEN ? sha256(process.env.ADMIN_TOKEN) : null);

/** Constant-time check of a hex SHA-256 against the admin token's. */
export function isAdminHash(given: string | undefined): boolean {
  const expected = adminTokenHash();
  if (!expected || !given || given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

const bearer = (request: Request) => /^Bearer (.+)$/.exec(request.headers.get("authorization")?.trim() ?? "")?.[1];

/** True when the request carries `Authorization: Bearer <ADMIN_TOKEN>`. */
export function isAdmin(request: Request): boolean {
  const given = bearer(request);
  // Compare hashes so the lengths match and the check takes the same time either way.
  return given !== undefined && isAdminHash(sha256(given));
}

/** True when the request carries `Authorization: Bearer <secret>` (CRON_SECRET, WORKER_TOKEN); false when the secret is not set. */
export function hasBearer(request: Request, secret: string | undefined): boolean {
  const given = bearer(request);
  if (!secret || given === undefined) return false;
  return timingSafeEqual(Buffer.from(sha256(given)), Buffer.from(sha256(secret)));
}

/** Codex, drawing requested icons: reads open requests and moves them to in-progress or review, nothing else. */
export const isWorker = (request: Request) => hasBearer(request, process.env.WORKER_TOKEN);

export const clientIp = (request: Request) => request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validates an untrusted registration body; throws a message that is safe to send back. */
export function parseEmail(input: unknown): string {
  const raw = (input ?? {}) as Record<string, unknown>;
  const email = typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";
  if (!EMAIL.test(email) || email.length > 254) throw new Error("email must be a valid address");
  return email;
}
