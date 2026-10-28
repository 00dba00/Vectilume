import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { bearerToken, sha256 } from "@/lib/api-keys";

let client: NeonQueryFunction<false, false> | undefined;

/** Neon over HTTP (DATABASE_URL comes from the Vercel Neon integration). Created on first use so builds do not need it. */
export function db(): NeonQueryFunction<false, false> {
  if (client) return client;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return (client = neon(url));
}

/**
 * The api key behind the request's bearer token, or null when it is missing, unknown or revoked.
 * verifiedEmail is set only for tokens issued through a confirmed email; they see every request of that email.
 */
export async function apiKey(request: Request): Promise<{ id: number; verifiedEmail: string | null } | null> {
  const token = bearerToken(request);
  if (!token) return null;
  const [row] = await db()`select id, email, verified_at from api_keys where token_hash = ${sha256(token)} and revoked_at is null`;
  return row ? { id: row.id as number, verifiedEmail: row.verified_at ? (row.email as string) : null } : null;
}

export const unauthorized = () =>
  Response.json({ error: "send your token as Authorization: Bearer vl_…; get one with POST /api/keys" }, { status: 401 });
