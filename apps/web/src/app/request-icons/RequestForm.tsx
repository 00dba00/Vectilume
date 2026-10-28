"use client";

import { useCallback, useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import type { RequestStatus } from "@/lib/icon-requests";
import styles from "./request-icons.module.css";

type Listed = RequestStatus & { email?: string };

const STORAGE_KEY = "vl_token";

// localStorage can throw (private mode, blocked site data); the token then lives only in this tab.
const stored = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};
const store = (token: string | null) => {
  try {
    if (token) localStorage.setItem(STORAGE_KEY, token);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {}
  listeners.forEach((listener) => listener());
};
const listeners = new Set<() => void>();
// Same-tab changes come through store(); other tabs through the storage event.
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
};

const kebab = (text: string) =>
  text.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function call(path: string, init: RequestInit & { token?: string; body?: string } = {}) {
  const { token, ...rest } = init;
  const response = await fetch(path, {
    ...rest,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

/** Get a token, send requests with it and list the requests made with it; the admin token lists everyone's. */
export function RequestForm() {
  const saved = useSyncExternalStore(subscribe, stored, () => null);
  // A token used only in this tab (an admin token is never remembered).
  const [session, setSession] = useState<string | null>(null);
  const token = session ?? saved;
  const [fresh, setFresh] = useState(false);
  const [list, setList] = useState<{ token: string; admin: boolean; requests: Listed[] } | null>(null);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const signOut = useCallback((reason: string | null = null) => {
    store(null);
    setSession(null);
    setFresh(false);
    setList(null);
    setError(reason);
  }, []);

  useEffect(() => {
    if (!token) return;
    let live = true;
    call("/api/requests", { token }).then(({ ok, status, data }) => {
      if (!live) return;
      if (status === 401) signOut("This token is not valid (mistyped or revoked). Paste another one or get a new one.");
      else if (!ok) setError(data.error ?? "Could not load your requests, try again.");
      else setList({ token, admin: data.admin === true, requests: data.requests });
    });
    return () => {
      live = false;
    };
  }, [token, reload, signOut]);

  const signIn = useCallback((value: string, isNew = false) => {
    setError(null);
    setFresh(isNew);
    setList(null);
    // Only developer tokens are remembered on this browser.
    store(value.startsWith("vl_") ? value : null);
    setSession(value);
  }, []);

  // The link from the confirmation email: /request-icons?confirm=<code>.
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("confirm");
    if (!code) return;
    url.searchParams.delete("confirm");
    history.replaceState(null, "", url);
    call("/api/keys/confirm", { method: "POST", body: JSON.stringify({ code }) }).then(({ ok, data }) => {
      if (ok) signIn(data.token, true);
      else setError(data.error ?? "Could not confirm your email, ask for a new link.");
    });
  }, [signIn]);

  // Never show a list fetched for a previous token.
  const current = list?.token === token ? list : null;
  const admin = current?.admin ?? false;
  const requests = current?.requests ?? null;
  const load = () => setReload((n) => n + 1);

  if (!token) return <SignIn onToken={signIn} error={error} />;

  return (
    <div className={styles.app}>
      {fresh && <NewToken token={token} />}
      <div className={styles.bar}>
        <span>{admin ? "Signed in as admin: all requests" : "Using your token"}</span>
        <button type="button" className={styles.link} onClick={() => signOut()}>
          Use another token
        </button>
      </div>
      {!admin && <NewRequest token={token} onSent={load} />}
      {error && <p className={styles.error}>{error}</p>}
      <MyRequests requests={requests} admin={admin} />
    </div>
  );
}

function SignIn({ onToken, error }: { onToken: (token: string, isNew?: boolean) => void; error: string | null }) {
  const [email, setEmail] = useState("");
  const [pasted, setPasted] = useState("");
  const [busy, setBusy] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  const issue = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setIssueError(null);
    const { ok, data } = await call("/api/keys", { method: "POST", body: JSON.stringify({ email }) });
    setBusy(false);
    if (ok && data.token) onToken(data.token, true);
    else if (ok) setSent(email);
    else setIssueError(data.error ?? "Could not create a token, try again.");
  };

  const paste = (event: FormEvent) => {
    event.preventDefault();
    if (pasted.trim()) onToken(pasted.trim());
  };

  return (
    <div className={styles.app}>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.columns}>
        <form className={styles.card} onSubmit={issue}>
          <h3>Continue with your email</h3>
          {sent ? (
            <p className={styles.success}>
              We sent a link to <strong>{sent}</strong>. Open it within 15 minutes, in this or any browser, to get your token and see
              every request you made with this email.
            </p>
          ) : (
            <>
              <label>
                Email
                <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </label>
              <button type="submit" disabled={busy}>{busy ? "Sending…" : "Continue"}</button>
              <p className={styles.hint}>New or back: works for both. Lost your token? This gets you a new one.</p>
            </>
          )}
          {issueError && <p className={styles.error}>{issueError}</p>}
        </form>
        <form className={styles.card} onSubmit={paste}>
          <h3>Have a token? See your requests</h3>
          <label>
            Token
            <input required autoComplete="off" spellCheck={false} value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder="vl_…" />
          </label>
          <button type="submit">Show my requests</button>
          <p className={styles.hint}>A token shows only your own requests, never anyone else&apos;s.</p>
        </form>
      </div>
    </div>
  );
}

function NewToken({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
    } catch {}
  };
  return (
    <div className={styles.token}>
      <strong>Save this token now.</strong> It is shown only once; we keep just a fingerprint of it, so it cannot be recovered. This
      browser remembers it, but another device or a cleared browser will need it.
      <div className={styles.tokenRow}>
        <code>{token}</code>
        <button type="button" onClick={copy}>{copied ? "Copied" : "Copy"}</button>
      </div>
    </div>
  );
}

function NewRequest({ token, onSent }: { token: string; onSent: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const body = {
      name: kebab(name),
      description,
      keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
    };
    const { ok, data } = await call("/api/requests", { method: "POST", token, body: JSON.stringify(body) });
    setBusy(false);
    if (!ok) return setMessage({ ok: false, text: data.error ?? "Could not send the request, try again." });
    setMessage({ ok: true, text: `Request #${data.id} received. It is listed below.` });
    setName("");
    setDescription("");
    setKeywords("");
    onSent();
  };

  return (
    <form className={styles.card} onSubmit={send}>
      <h3>Request an icon</h3>
      <label>
        Name
        <input required maxLength={40} value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setName(kebab(name))} placeholder="basketball-hoop" />
        <small>kebab-case, up to 40 characters; spaces become dashes.</small>
      </label>
      <label>
        Description
        <textarea required minLength={10} maxLength={500} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Hoop with net, shown next to the live score" />
        <small>10–500 characters: what the icon shows and where you use it. Generic symbols only, no logos.</small>
      </label>
      <label>
        <span>
          Keywords <span className={styles.optional}>(optional)</span>
        </span>
        <input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="nba, score" />
        <small>Up to 10, separated by commas.</small>
      </label>
      <button type="submit" disabled={busy}>{busy ? "Sending…" : "Send request"}</button>
      {message && <p className={message.ok ? styles.success : styles.error}>{message.text}</p>}
    </form>
  );
}

function MyRequests({ requests, admin }: { requests: Listed[] | null; admin: boolean }) {
  if (!requests) return <p className={styles.hint}>Loading requests…</p>;
  return (
    <div>
      <h3 className={styles.listTitle}>{admin ? "All requests" : "Your requests"}</h3>
      {requests.length === 0 ? (
        <p className={styles.hint}>No requests yet.</p>
      ) : (
        <ul className={styles.list}>
          {requests.map((r) => (
            <li key={r.id}>
              <div className={styles.listHead}>
                <span>
                  <code>#{r.id}</code> <strong>{r.name}</strong>
                </span>
                <span className={styles.status} data-status={r.status}>{r.status}</span>
              </div>
              <div className={styles.meta}>
                {new Date(r.createdAt).toLocaleDateString()}
                {admin && r.email && <> · {r.email}</>}
                {r.status === "done" && (
                  <> · shipped as <code>{r.icon}</code> in v{r.version}</>
                )}
                {r.status === "declined" && r.reason && <> · {r.reason}</>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
