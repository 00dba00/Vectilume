import { cookies } from "next/headers";
import { isAdminHash } from "@/lib/api-keys";

/** Holds the SHA-256 of ADMIN_TOKEN; changing the token on Vercel signs every admin out. */
export const ADMIN_COOKIE = "vl_admin";

export async function isAdminSession(): Promise<boolean> {
  return isAdminHash((await cookies()).get(ADMIN_COOKIE)?.value);
}
