"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, isAdminSession } from "@/lib/admin";
import { isAdminHash, sha256 } from "@/lib/api-keys";
import { db } from "@/lib/db";
import { parseStatusChange } from "@/lib/icon-requests";
import { changeStatus, notifyShipped } from "@/lib/request-emails";

const MONTH = 60 * 60 * 24 * 30;

export async function login(formData: FormData) {
  const hash = sha256(String(formData.get("token") ?? "").trim());
  if (!isAdminHash(hash)) redirect("/admin?error=login");
  (await cookies()).set(ADMIN_COOKIE, hash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: MONTH,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/admin" });
  redirect("/admin");
}

// Server actions accept any POST, so each one checks the session itself.
async function requireAdmin() {
  if (!(await isAdminSession())) redirect("/admin?error=session");
}

const idFrom = (formData: FormData) => {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) throw new Error("invalid id");
  return id;
};

export async function setRequestStatus(formData: FormData) {
  await requireAdmin();
  const id = idFrom(formData);
  const change = parseStatusChange({ status: formData.get("status"), reason: formData.get("reason") });
  await changeStatus(id, change);
  refresh();
}

/** Right after an npm release, so developers do not wait for the daily check. */
export async function sendShippedEmails() {
  await requireAdmin();
  const { sent, skipped, failed } = await notifyShipped();
  redirect(`/admin?shipped=${sent}-${skipped}-${failed}`);
}

export async function revokeKey(formData: FormData) {
  await requireAdmin();
  await db()`update api_keys set revoked_at = now() where id = ${idFrom(formData)} and revoked_at is null`;
  refresh();
}
