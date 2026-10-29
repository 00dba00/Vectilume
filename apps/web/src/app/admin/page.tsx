import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { isAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { requestStatus, STORED_STATUSES, type RequestRow, type RequestStatus } from "@/lib/icon-requests";
import { publishedIcons } from "@/lib/published-icons";
import { login, logout, revokeKey, sendShippedEmails, setRequestStatus } from "./actions";
import styles from "./admin.module.css";

export const metadata: Metadata = { title: "Admin · Vectilume", robots: { index: false, follow: false } };

const FILTERS = ["all", "open", "in-progress", "ready", "done", "declined"] as const;
type Filter = (typeof FILTERS)[number];

const STATUS_LABEL: Record<RequestStatus["status"], string> = {
  open: "Open",
  "in-progress": "In progress",
  ready: "Ready, waiting for npm",
  done: "Done",
  declined: "Declined",
};

const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Zagreb" });

export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  return (
    <main className={styles.page}>
      <h1>Icon requests</h1>
      <Suspense fallback={<p className={styles.muted}>Loading…</p>}>
        <Admin searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Admin({ searchParams }: Pick<PageProps<"/admin">, "searchParams">) {
  const params = await searchParams;
  if (!(await isAdminSession())) return <LoginForm error={params.error === "login"} />;
  const filter: Filter = FILTERS.find((f) => f === params.status) ?? "all";
  const shipped = typeof params.shipped === "string" ? params.shipped.split("-").map(Number) : null;

  const sql = db();
  const [[stats], keys, rows, published] = await Promise.all([
    sql`select
      (select count(*)::int from api_keys where revoked_at is null) as active_keys,
      (select count(distinct email)::int from api_keys) as emails,
      (select count(distinct key_id)::int from icon_requests) as requesting_keys,
      (select count(*)::int from icon_requests) as requests`,
    sql`select k.id, k.email, k.created_at, k.revoked_at, count(r.id)::int as requests, max(r.created_at) as last_request
      from api_keys k left join icon_requests r on r.key_id = k.id
      group by k.id order by k.id desc limit 500`,
    sql`select r.id, r.name, r.description, r.keywords, r.status, r.decline_reason, r.created_at, k.email
      from icon_requests r join api_keys k on k.id = r.key_id order by r.id desc limit 500`,
    publishedIcons(),
  ]);

  const requests = rows.map((row) => ({
    row: row as RequestRow & { description: string; keywords: string[]; email: string },
    status: requestStatus(row as RequestRow, published),
  }));
  const counts = Object.fromEntries(FILTERS.map((f) => [f, f === "all" ? requests.length : requests.filter((r) => r.status.status === f).length]));
  const shown = filter === "all" ? requests : requests.filter((r) => r.status.status === filter);

  return (
    <>
      <form action={logout} className={styles.logout}>
        <button type="submit" className={styles.secondary}>Sign out</button>
      </form>

      <section aria-labelledby="usage" className={styles.section}>
        <h2 id="usage">Token usage</h2>
        <dl className={styles.stats}>
          <Stat label="Active tokens" value={stats.active_keys} />
          <Stat label="Developers (emails)" value={stats.emails} />
          <Stat label="Tokens that sent requests" value={stats.requesting_keys} />
          <Stat label="Requests" value={stats.requests} />
        </dl>
      </section>

      <section aria-labelledby="requests" className={styles.section}>
        <h2 id="requests">Requests</h2>
        <form action={sendShippedEmails} className={styles.shipped}>
          <button type="submit" className={styles.secondary}>Email shipped requests now</button>
          <span className={styles.hint}>
            {shipped
              ? `Sent ${shipped[0]}, skipped ${shipped[1]} (no confirmed email), failed ${shipped[2]}.`
              : "Runs daily at 08:00 UTC; use it right after an npm release."}
          </span>
        </form>
        <nav className={styles.filters} aria-label="Filter by status">
          {FILTERS.map((f) => (
            <Link key={f} href={f === "all" ? "/admin" : `/admin?status=${f}`} aria-current={f === filter ? "page" : undefined}>
              {f === "all" ? "All" : STATUS_LABEL[f]} <span>{counts[f]}</span>
            </Link>
          ))}
        </nav>
        {shown.length === 0 ? (
          <p className={styles.muted}>No requests here yet.</p>
        ) : (
          <ul className={styles.requests}>
            {shown.map(({ row, status }) => (
              <RequestCard key={row.id} row={row} status={status} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="tokens" className={styles.section}>
        <h2 id="tokens">Tokens</h2>
        {keys.length === 0 ? (
          <p className={styles.muted}>No tokens issued yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>Email</th><th>Issued</th><th>Requests</th><th>Last request</th><th>State</th></tr>
              </thead>
              <tbody>
                {keys.map((key) => (
                  <tr key={key.id}>
                    <td>{key.email}</td>
                    <td>{date.format(new Date(key.created_at))}</td>
                    <td className={styles.num}>{key.requests}</td>
                    <td>{key.last_request ? date.format(new Date(key.last_request)) : "—"}</td>
                    <td>
                      {key.revoked_at ? (
                        <span className={styles.muted}>Revoked</span>
                      ) : (
                        <form action={revokeKey}>
                          <input type="hidden" name="id" value={key.id} />
                          <button type="submit" className={styles.secondary}>Revoke</button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.stat}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function RequestCard({ row, status }: { row: RequestRow & { description: string; keywords: string[]; email: string }; status: RequestStatus }) {
  return (
    <li className={styles.card}>
      <div className={styles.cardHead}>
        <h3>
          <span className={styles.muted}>#{row.id}</span> {row.name}
        </h3>
        <span className={styles.badge} data-status={status.status}>{STATUS_LABEL[status.status]}</span>
      </div>
      <p>{row.description}</p>
      <p className={styles.meta}>
        {row.email} · {date.format(new Date(row.created_at))}
        {row.keywords.length > 0 && <> · {row.keywords.join(", ")}</>}
      </p>

      {status.status === "done" ? (
        <p className={styles.meta}>
          Shipped as <code>{status.icon}</code> in v{status.version}.
        </p>
      ) : (
        <>
          {status.status === "declined" && status.reason && <p className={styles.meta}>Reason: {status.reason}</p>}
          <form action={setRequestStatus} className={styles.statusForm}>
            <input type="hidden" name="id" value={row.id} />
            <label>
              <span>Status</span>
              <select name="status" defaultValue={row.status}>
                {STORED_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            </label>
            <label className={styles.reason}>
              <span>Reason (when declining)</span>
              <input name="reason" defaultValue={row.decline_reason ?? ""} maxLength={500} />
            </label>
            <button type="submit">Save</button>
          </form>
          {status.status !== "declined" && (
            <p className={styles.hint}>
              To ship it, add <code>&quot;request&quot;: {row.id}</code> to the icon&apos;s collection entry; the next npm release marks it done.
            </p>
          )}
        </>
      )}
    </li>
  );
}

function LoginForm({ error }: { error: boolean }) {
  return (
    <form action={login} className={styles.login}>
      <label>
        <span>Admin token</span>
        <input name="token" type="password" autoComplete="current-password" required />
      </label>
      <button type="submit">Sign in</button>
      {error && <p role="alert">That token is not right.</p>}
    </form>
  );
}
