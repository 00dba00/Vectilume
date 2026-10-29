import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type CSSProperties } from "react";
import { isAdminSession } from "@/lib/admin";
import { bakeSvg } from "@/lib/bake-svg";
import { db } from "@/lib/db";
import { Icon } from "@/components/Icon";
import { lastNpmRelease, releaseEnabled, type ReleaseRun } from "@/lib/github";
import { ICON_STYLES, requestStatus, STORED_STATUSES, type RequestRow, type RequestStatus, type ReviewSvgs } from "@/lib/icon-requests";
import { buildLookup, iconId, icons } from "@/lib/icons";
import { publishedIcons } from "@/lib/published-icons";
import { login, logout, releaseToNpm, requestAdminLink, requestChanges, revokeKey, sendUpdateEmails, setRequestStatus, signInWithLink } from "./actions";
import { ActivityChart, CountUp, type DayPoint } from "./charts";
import styles from "./admin.module.css";

const lookup = buildLookup(icons);
const glyph = (name: string, size = 20) => <Icon svg={lookup[iconId("duotone", name)]} size={size} />;

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
      <Suspense fallback={<p className={`${styles.muted} ${styles.loading}`}>Loading…</p>}>
        <Admin searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Admin({ searchParams }: Pick<PageProps<"/admin">, "searchParams">) {
  const params = await searchParams;
  if (!(await isAdminSession())) {
    const code = typeof params.login === "string" && /^[A-Za-z0-9_-]{43}$/.test(params.login) ? params.login : null;
    return <LoginForm code={code} sent={params.sent === "1"} error={typeof params.error === "string" ? params.error : null} />;
  }
  const filter: Filter = FILTERS.find((f) => f === params.status) ?? "all";

  const sql = db();
  const [[stats], keys, rows, published, [pending], run, days] = await Promise.all([
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
    releaseEnabled() ? lastNpmRelease() : null,
    // Last 30 days in Zagreb time, one row per day even when nothing happened.
    sql`select to_char(g.d, 'YYYY-MM-DD') as day,
      (select count(*)::int from icon_requests where (created_at at time zone 'Europe/Zagreb')::date = g.d::date) as requests,
      (select count(*)::int from api_keys where (created_at at time zone 'Europe/Zagreb')::date = g.d::date) as tokens
      from generate_series((now() at time zone 'Europe/Zagreb')::date - 29, (now() at time zone 'Europe/Zagreb')::date, interval '1 day') as g(d)
      order by g.d`,
  ]);
  const series = days as DayPoint[];
  const week = series.slice(-7);
  const weekRequests = week.reduce((sum, d) => sum + d.requests, 0);
  const weekTokens = week.reduce((sum, d) => sum + d.tokens, 0);
  const emailed = typeof params.emailed === "string" ? params.emailed.split("-").map(Number) : null;

  const requests = rows.map((row) => ({
    row: row as AdminRow,
    status: requestStatus(row as RequestRow, published, true),
  }));
  const counts = Object.fromEntries(FILTERS.map((f) => [f, f === "all" ? requests.length : requests.filter((r) => r.status.status === f).length]));
  const shown = filter === "all" ? requests : requests.filter((r) => r.status.status === filter);
  const ready = requests.filter((r) => r.status.status === "ready");
  const toReview = requests.filter((r) => r.status.status === "review");

  const done = counts.done;
  const pipeline = requests.length - counts.open - counts.declined;
  const shippedShare = pipeline > 0 ? Math.round((done / pipeline) * 100) : 0;
  const statusMax = Math.max(1, ...STORED_STATUSES.map((s) => counts[s]), done);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <p className={styles.brand}>
          {glyph("sparkles", 28)}
          <span>Vectilume <em>Admin</em></span>
        </p>
        <nav aria-label="Admin sections" className={styles.nav}>
          <a href="#overview">{glyph("dashboard")} Overview</a>
          {toReview.length > 0 && (
            <a href="#review">{glyph("eye")} Review <span className={styles.count}>{toReview.length}</span></a>
          )}
          <a href="#requests">{glyph("inbox")} Requests <span className={styles.count}>{requests.length}</span></a>
          <a href="#tokens">{glyph("key")} Tokens <span className={styles.count}>{keys.length}</span></a>
          <Link href="/">{glyph("home")} Icon catalog</Link>
        </nav>
        <form action={logout} className={styles.logout}>
          <button type="submit">{glyph("log-out")} Sign out</button>
        </form>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.crumbs}>Admin / Dashboard</p>
            <h1>Icon requests</h1>
          </div>
        </header>

      {(ready.length > 0 || run || params.released) && (
        <div className={styles.banner} role="status">
          {ready.length > 0 && (
            <p>
              <strong>{ready.length === 1 ? "1 icon is" : `${ready.length} icons are`} done and waiting for the npm release:</strong>{" "}
              {ready.map((r) => r.row.review_icon ?? r.row.name).join(", ")}.
            </p>
          )}
          {params.released === "1" && <p>Release started on GitHub; it takes a few minutes, reload to follow it.</p>}
          {params.released === "error" && <p>GitHub did not start the release; the reason is in the Vercel logs.</p>}
          {run && <ReleaseStatus run={run} />}
          {releaseEnabled() && ready.length > 0 && run?.status !== "queued" && run?.status !== "in_progress" && (
            <form action={releaseToNpm} className={styles.releaseForm}>
              <select name="bump" defaultValue="patch" aria-label="Version step">
                <option value="patch">patch: new icons</option>
                <option value="minor">minor: breaking change</option>
              </select>
              <button type="submit">Release to npm</button>
            </form>
          )}
        </div>
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

      <section id="overview" aria-label="Overview" className={styles.section}>
        <dl className={styles.stats}>
          <Stat i={0} icon="inbox" tone="pink" label="Requests" value={stats.requests} note={`+${weekRequests} in the last 7 days`} />
          <Stat i={1} icon="key" tone="violet" label="Active tokens" value={stats.active_keys} note={`+${weekTokens} issued in the last 7 days`} />
          <Stat i={2} icon="users" tone="blue" label="Developers (emails)" value={stats.emails} note={`${stats.requesting_keys} tokens sent requests`} />
          <Stat i={3} icon="rocket" tone="teal" label="Shipped on npm" value={done} note={`${counts.review} in review · ${counts.ready} ready`} />
        </dl>

        <div className={styles.charts}>
          <article className={styles.panel} style={{ "--i": 4 } as CSSProperties}>
            <header className={styles.panelHead}>
              <h2>Activity</h2>
              <p className={styles.meta}>Last 30 days</p>
            </header>
            <ActivityChart data={series} />
          </article>

          <article className={styles.panel} style={{ "--i": 5 } as CSSProperties}>
            <header className={styles.panelHead}>
              <h2>Pipeline</h2>
              <p className={styles.meta}>Accepted requests that shipped</p>
            </header>
            <div className={styles.ring} style={{ "--share": shippedShare } as CSSProperties}>
              <svg viewBox="0 0 120 120" aria-hidden="true">
                <defs>
                  <linearGradient id="ring-fill" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--series-2)" />
                    <stop offset="100%" stopColor="var(--series-1)" />
                  </linearGradient>
                </defs>
                <circle cx="60" cy="60" r="50" className={styles.ringTrack} />
                <circle cx="60" cy="60" r="50" className={styles.ringValue} pathLength={100} />
              </svg>
              <p>
                <strong>{shippedShare}%</strong>
                <span>{done} of {pipeline}</span>
              </p>
            </div>
            <ul className={styles.bars}>
              {[...STORED_STATUSES, "done" as const].map((s, n) => (
                <li key={s} style={{ "--w": counts[s] / statusMax, "--n": n } as CSSProperties}>
                  <Link href={`/admin?status=${s}#requests`}>
                    <span>{STATUS_LABEL[s]}</span>
                    <b>{counts[s]}</b>
                    <i aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

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

      <section aria-labelledby="requests" className={styles.section}>
        <h2 id="requests">Requests</h2>
        <nav className={styles.filters} aria-label="Filter by status">
          {FILTERS.map((f) => (
            <Link key={f} href={f === "all" ? "/admin#requests" : `/admin?status=${f}#requests`} aria-current={f === filter ? "page" : undefined}>
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
      </div>
    </div>
  );
}

function ReleaseStatus({ run }: { run: ReleaseRun }) {
  const state =
    run.status !== "completed"
      ? "is running"
      : run.conclusion === "success"
        ? "finished"
        : run.published
          ? "published to npm, last step failed"
          : `ended: ${run.conclusion ?? "unknown"}`;
  return (
    <p className={styles.meta}>
      Last npm release {state} (started {date.format(new Date(run.startedAt))}) · <a href={run.url}>log on GitHub</a>
      {run.status !== "completed" && " · reload to see the result"}
    </p>
  );
}

function Stat({ i, icon, tone, label, value, note }: { i: number; icon: string; tone: string; label: string; value: number; note: string }) {
  return (
    <div className={styles.stat} style={{ "--i": i } as CSSProperties}>
      <dt>{label}</dt>
      <dd>
        <CountUp value={value} />
      </dd>
      <dd className={styles.statNote}>{note}</dd>
      <span className={styles.chip} data-tone={tone} aria-hidden="true">{glyph(icon, 22)}</span>
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

const LOGIN_ERRORS: Record<string, string> = {
  login: "That token is not right.",
  link: "That link is invalid, already used or older than 15 minutes. Ask for a new one.",
  limit: "Too many links this hour; try again later or use the token.",
  email: "The email could not be sent; try again or use the token.",
  session: "Your session ended; sign in again.",
};

/** Email first (a one-time link to ADMIN_EMAIL); the admin token stays as a fallback when email fails. */
function LoginForm({ code, sent, error }: { code: string | null; sent: boolean; error: string | null }) {
  const brand = (
    <p className={styles.brand}>
      {glyph("sparkles", 28)}
      <span>Vectilume <em>Admin</em></span>
    </p>
  );
  if (code) {
    return (
      <form action={signInWithLink} className={styles.login}>
        {brand}
        <h1>Sign in</h1>
        <p className={styles.hint}>You opened your sign-in link. Press the button to continue.</p>
        <input type="hidden" name="code" value={code} />
        <button type="submit">Sign in</button>
      </form>
    );
  }
  return (
    <div className={styles.login}>
      {brand}
      <h1>Sign in</h1>
      {sent ? (
        <p className={styles.hint}>If that is the admin address, a sign-in link is on its way. It works once, for 15 minutes.</p>
      ) : (
        <form action={requestAdminLink} className={styles.loginForm}>
          <label>
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <button type="submit">Email me a sign-in link</button>
        </form>
      )}
      {error && LOGIN_ERRORS[error] && <p role="alert">{LOGIN_ERRORS[error]}</p>}
      <details className={styles.fallback} open={error === "login"}>
        <summary>Use the admin token instead</summary>
        <form action={login} className={styles.loginForm}>
          <label>
            <span>Admin token</span>
            <input name="token" type="password" autoComplete="current-password" required />
          </label>
          <button type="submit" className={styles.secondary}>Sign in with token</button>
        </form>
      </details>
    </div>
  );
}
