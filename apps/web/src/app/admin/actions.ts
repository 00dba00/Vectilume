"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, isAdminSession } from "@/lib/admin";
import { isAdminHash, sha256 } from "@/lib/api-keys";
import { db } from "@/lib/db";
import { startNpmRelease } from "@/lib/github";
import { parseStatusChange } from "@/lib/icon-requests";
import { changeStatus, sendDailyEmails } from "@/lib/request-emails";

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

/** Sends a drawn icon back to Codex's queue with the owner's note (the developer still sees in-progress). */
export async function requestChanges(formData: FormData) {
  await requireAdmin();
  const id = idFrom(formData);
  const note = String(formData.get("note") ?? "").replace(/\s+/g, " ").trim().slice(0, 1000);
  if (!note) throw new Error("a note is required");
  const [inReview] = await db()`update icon_requests set review_note = ${note} where id = ${id} and status = 'review' returning id`;
  if (inReview) await changeStatus(id, { status: "in-progress", reason: null });
  refresh();
}

/** The daily email right away, e.g. after a batch of reviews; the morning cron then skips these addresses. */
export async function sendUpdateEmails() {
  await requireAdmin();
  const { sent, skipped, failed } = await sendDailyEmails({ fromAdmin: true });
  redirect(`/admin?emailed=${sent}-${skipped}-${failed}`);
}

/** Starts the GitHub workflow that publishes both npm packages with the approved icons. */
export async function releaseToNpm(formData: FormData) {
  await requireAdmin();
  try {
    await startNpmRelease(formData.get("bump") === "minor" ? "minor" : "patch");
  } catch (error) {
    console.error("npm release did not start", error);
    redirect("/admin?released=error");
  }
  redirect("/admin?released=1");
}

export async function revokeKey(formData: FormData) {
  await requireAdmin();
  await db()`update api_keys set revoked_at = now() where id = ${idFrom(formData)} and revoked_at is null`;
  refresh();
}
