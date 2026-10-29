"use server";

import { refresh } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, isAdminSession } from "@/lib/admin";
import { adminTokenHash, isAdminHash, newToken, sha256 } from "@/lib/api-keys";
import { db } from "@/lib/db";
import { adminLoginEmail, emailEnabled, sendEmail, SITE } from "@/lib/email";
import { startNpmRelease } from "@/lib/github";
import { parseStatusChange } from "@/lib/icon-requests";
import { changeStatus, sendDailyEmails } from "@/lib/request-emails";

const MONTH = 60 * 60 * 24 * 30;

/** The session cookie holds the SHA-256 of ADMIN_TOKEN, whichever way the admin signed in. */
async function startSession(hash: string) {
  (await cookies()).set(ADMIN_COOKIE, hash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: MONTH,
  });
}

export async function login(formData: FormData) {
  const hash = sha256(String(formData.get("token") ?? "").trim());
  if (!isAdminHash(hash)) redirect("/admin?error=login");
  await startSession(hash);
  redirect("/admin");
}

const LINKS_PER_HOUR = 3;

/** Mails a one-time sign-in link, but only to ADMIN_EMAIL; any other address gets the same answer and nothing is sent. */
export async function requestAdminLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const admin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (admin && email === admin && emailEnabled()) {
    const sql = db();
    const ipHash = sha256((await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown");
    const [{ count }] = await sql`select count(*)::int as count from admin_logins where ip_hash = ${ipHash} and created_at > now() - interval '1 hour'`;
    if (count >= LINKS_PER_HOUR) redirect("/admin?error=limit");
    const code = newToken().slice(3);
    await sql`insert into admin_logins (code_hash, ip_hash) values (${sha256(code)}, ${ipHash})`;
    try {
      await sendEmail(admin, adminLoginEmail(`${SITE}/admin?login=${code}`));
    } catch (error) {
      console.error("admin sign-in email failed", error);
      redirect("/admin?error=email");
    }
  }
  redirect("/admin?sent=1");
}

/** The button behind the mailed link (a POST, so mail scanners that open links do not use it up). */
export async function signInWithLink(formData: FormData) {
  const code = String(formData.get("code") ?? "");
  const hash = adminTokenHash();
  const [row] =
    hash && /^[A-Za-z0-9_-]{43}$/.test(code)
      ? await db()`
          update admin_logins set used_at = now()
          where code_hash = ${sha256(code)} and used_at is null and created_at > now() - interval '15 minutes'
          returning id`
      : [];
  if (!row || !hash) redirect("/admin?error=link");
  await startSession(hash);
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
