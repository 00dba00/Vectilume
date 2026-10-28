import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** A developer token: vl_ + 32 random bytes. Shown once; only its hash is stored. */
export const newToken = () => `vl_${randomBytes(32).toString("base64url")}`;

export const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");

/** The token from `Authorization: Bearer vl_…`, or null when missing or malformed. */
export function bearerToken(request: Request): string | null {
  const match = /^Bearer (vl_[A-Za-z0-9_-]{43})$/.exec(request.headers.get("authorization")?.trim() ?? "");
  return match ? match[1] : null;
}

/** True when the request carries `Authorization: Bearer <ADMIN_TOKEN>`. */
export function isAdmin(request: Request): boolean {
  const expected = process.env.ADMIN_TOKEN;
  const given = /^Bearer (.+)$/.exec(request.headers.get("authorization")?.trim() ?? "")?.[1];
  if (!expected || !given) return false;
  // Compare hashes so the lengths match and the check takes the same time either way.
  return timingSafeEqual(Buffer.from(sha256(given)), Buffer.from(sha256(expected)));
}

export const clientIp = (request: Request) => request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validates an untrusted registration body; throws a message that is safe to send back. */
export function parseEmail(input: unknown): string {
  const raw = (input ?? {}) as Record<string, unknown>;
  const email = typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";
  if (!EMAIL.test(email) || email.length > 254) throw new Error("email must be a valid address");
  return email;
}
