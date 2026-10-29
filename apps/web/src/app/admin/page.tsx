import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { isAdminSession } from "@/lib/admin";
import { bakeSvg } from "@/lib/bake-svg";
import { db } from "@/lib/db";
import { ICON_STYLES, requestStatus, STORED_STATUSES, type RequestRow, type RequestStatus, type ReviewSvgs } from "@/lib/icon-requests";
import { publishedIcons } from "@/lib/published-icons";
import { login, logout, requestChanges, revokeKey, sendUpdateEmails, setRequestStatus } from "./actions";
import styles from "./admin.module.css";

export const metadata: Metadata = { title: "Admin · Vectilume", robots: { index: false, follow: false } };

const FILTERS = ["all", "open", "accepted", "in-progress", "review", "ready", "done", "declined"] as const;
type Filter = (typeof FILTERS)[number];

const STATUS_LABEL: Record<RequestStatus["status"], string> = {
  open: "New, waiting for you",
  accepted: "Accepted, in Codex's queue",
  "in-progress": "In progress",
  review: "Waiting for your review",
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

  const sql = db();
  const [[stats], keys, rows, published, [pending]] = await Promise.all([
    sql`select
      (select count(*)::int from api_keys where revoked_at is null) as active_keys,
      (select count(distinct email)::int from api_keys) as emails,
      (select count(distinct key_id)::int from icon_requests) as requesting_keys,
      (select count(*)::int from icon_requests) as requests`,
    sql`select k.id, k.email, k.created_at, k.revoked_at, count(r.id)::int as requests, max(r.created_at) as last_request
      from api_keys k left join icon_requests r on r.key_id = k.id
      group by k.id order by k.id desc limit 500`,
    sql`select r.id, r.name, r.description, r.keywords, r.status, r.decline_reason, r.created_at, r.review_icon, r.review_svgs, r.review_note, k.email
      from icon_requests r join api_keys k on k.id = r.key_id order by r.id desc limit 500`,
    publishedIcons(),
    sql`select count(*)::int as updates, count(distinct k.email)::int as people from request_updates u
      join icon_requests r on r.id = u.request_id join api_keys k on k.id = r.key_id where u.sent_at is null`,
  ]);
  const emailed = typeof params.emailed === "string" ? params.emailed.split("-").map(Number) : null;

  const requests = rows.map((row) => ({
    row: row as AdminRow,
    status: requestStatus(row as RequestRow, published, true),
  }));
  const counts = Object.fromEntries(FILTERS.map((f) => [f, f === "all" ? requests.length : requests.filter((r) => r.status.status === f).length]));
  const shown = filter === "all" ? requests : requests.filter((r) => r.status.status === filter);
  const ready = requests.filter((r) => r.status.status === "ready");
  const toReview = requests.filter((r) => r.status.status === "review");

  return (
    <>
      <form action={logout} className={styles.logout}>
        <button type="submit" className={styles.secondary}>Sign out</button>
      </form>

      {ready.length > 0 && (
        <p className={styles.banner} role="status">
          <strong>{ready.length === 1 ? "1 icon is" : `${ready.length} icons are`} done and waiting for the npm release:</strong>{" "}
          {ready.map((r) => r.row.review_icon ?? r.row.name).join(", ")}.
        </p>
      )}

      {(pending.updates > 0 || emailed) && (
        <form action={sendUpdateEmails} className={styles.emails}>
          <span>
            {emailed && pending.updates === 0
              ? `Sent ${emailed[0]} update email${emailed[0] === 1 ? "" : "s"}${emailed[1] ? `, skipped ${emailed[1]} (unconfirmed or emails off)` : ""}${emailed[2] ? `, ${emailed[2]} failed` : ""}. The morning email skips them.`
              : `${pending.updates} change${pending.updates === 1 ? "" : "s"} for ${pending.people} developer${pending.people === 1 ? "" : "s"} wait for the daily email (08:00 UTC).`}
          </span>
          {pending.updates > 0 && <button type="submit" className={styles.secondary}>Send update emails now</button>}
        </form>
      )}

      {toReview.length > 0 && (
        <section aria-labelledby="review" className={styles.section}>
          <h2 id="review">Waiting for your review</h2>
          <ul className={styles.requests}>
            {toReview.map(({ row }) => (
              <ReviewCard key={row.id} row={row} />
            ))}
          </ul>
        </section>
      )}

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

type AdminRow = RequestRow & {
  description: string;
  keywords: string[];
  email: string;
  review_icon: string | null;
  review_svgs: ReviewSvgs | null;
  review_note: string | null;
};

// As <img>, an uploaded SVG cannot run scripts or load anything; page CSS does not reach it either,
// so the duotone colours are baked in (the catalog's defaults) or both layers would draw in one colour.
const svgSrc = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(bakeSvg(svg, { size: 96, color: "#111827", primary: "#2563eb", secondary: "#93c5fd", strokeWidth: 1.75 }))}`;

function ReviewCard({ row }: { row: AdminRow }) {
  return (
    <li className={styles.card}>
      <div className={styles.cardHead}>
        <h3>
          <span className={styles.muted}>#{row.id}</span> {row.name}
          {row.review_icon && row.review_icon !== row.name && <> → <code>{row.review_icon}</code></>}
        </h3>
      </div>
      <p>{row.description}</p>
      {row.review_svgs && (
        <div className={styles.previews}>
          {ICON_STYLES.map((style) => (
            <figure key={style}>
              {/* eslint-disable-next-line @next/next/no-img-element -- inline data URL, nothing to optimize */}
              <img src={svgSrc(row.review_svgs![style])} alt={`${row.review_icon} ${style}`} width={96} height={96} />
              <figcaption>{style}</figcaption>
            </figure>
          ))}
        </div>
      )}
      <div className={styles.reviewActions}>
        <form action={setRequestStatus}>
          <input type="hidden" name="id" value={row.id} />
          <input type="hidden" name="status" value="ready" />
          <button type="submit">Approve for the next release</button>
        </form>
        <form action={requestChanges} className={styles.statusForm}>
          <input type="hidden" name="id" value={row.id} />
          <label className={styles.reason}>
            <span>What should Codex change?</span>
            <input name="note" required maxLength={1000} />
          </label>
          <button type="submit" className={styles.secondary}>Request changes</button>
        </form>
      </div>
    </li>
  );
}

function RequestCard({ row, status }: { row: AdminRow; status: RequestStatus }) {
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
          {status.status === "in-progress" && row.review_note && <p className={styles.meta}>Changes asked: {row.review_note}</p>}
          {status.status === "open" && (
            <form action={setRequestStatus}>
              <input type="hidden" name="id" value={row.id} />
              <input type="hidden" name="status" value="accepted" />
              <button type="submit">Accept: queue it for Codex</button>
            </form>
          )}
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
