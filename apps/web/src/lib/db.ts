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

/** Id of the api key behind the request's bearer token, or null when it is missing, unknown or revoked. */
export async function keyId(request: Request): Promise<number | null> {
  const token = bearerToken(request);
  if (!token) return null;
  const [row] = await db()`select id from api_keys where token_hash = ${sha256(token)} and revoked_at is null`;
  return row ? (row.id as number) : null;
}

export const unauthorized = () =>
  Response.json({ error: "send your token as Authorization: Bearer vl_…; get one with POST /api/keys" }, { status: 401 });
