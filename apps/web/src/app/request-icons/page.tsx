import type { Metadata } from "next";
import Link from "next/link";
import { RequestForm } from "./RequestForm";
import styles from "./request-icons.module.css";

export const metadata: Metadata = {
  title: "Request an icon · Vectilume",
  description: "Missing an icon? Request it here or through the Vectilume API, then follow its status until it ships on npm.",
  alternates: { canonical: "/request-icons" },
};

const BASE = "https://vectilume.dev";

const STATUSES: [string, string][] = [
  ["open", "Received, waiting to be accepted."],
  ["accepted", "Accepted and queued to be drawn."],
  ["in-progress", "Being drawn."],
  ["ready", "Drawn and added; ships with the next npm release."],
  ["done", "In the latest @vectilume/icons and @vectilume/react. icon is the final name (it may differ from the one you asked for), version the release."],
  ["declined", "Not planned; reason may say why."],
];

export default function RequestIconsPage() {
  return (
    <main className={styles.page}>
      <p className={styles.back}><Link href="/">← Vectilume icons</Link></p>
      <h1>Request an icon</h1>
      <p className={styles.lede}>
        Missing an icon? Ask for it right here, or from your terminal, your app or your AI assistant. You get a token once, send
        requests with it and follow each one until it ships on npm.
      </p>

      <section aria-labelledby="form">
        <h2 id="form">Request it here</h2>
        <p>
          First <Link href="/">search the catalog</Link>, it may already be there. Then get a token with your email, or paste the one
          you have.
        </p>
        <RequestForm />
      </section>

      <h2 className={styles.divider}>Or use the API</h2>

      <section aria-labelledby="check">
        <h2 id="check"><span>1</span> Check it is not there yet</h2>
        <p>
          Search the <Link href="/">catalog</Link>, or the published manifest by <code>id</code>, <code>label</code> and{" "}
          <code>keywords</code>: <code>https://unpkg.com/@vectilume/icons@latest/manifest.json</code>.
        </p>
      </section>

      <section aria-labelledby="token">
        <h2 id="token"><span>2</span> Get a token</h2>
        <pre>{`curl -X POST ${BASE}/api/keys \\
  -H "content-type: application/json" \\
  -d '{"email":"you@example.com"}'

# → 202 {"sent":true,"note":"We sent a confirmation link to that address. …"}`}</pre>
        <p>
          Open the link from the email within 15 minutes: this page shows your token, once, so keep it, e.g. in{" "}
          <code>VECTILUME_TOKEN</code>. It shows every request made with your email and nobody else&apos;s. Until email confirmation is
          switched on, the answer is <code>201</code> with the token straight away.
        </p>
      </section>

      <section aria-labelledby="send">
        <h2 id="send"><span>3</span> Send a request</h2>
        <pre>{`curl -X POST ${BASE}/api/requests \\
  -H "authorization: Bearer $VECTILUME_TOKEN" \\
  -H "content-type: application/json" \\
  -d '{"name":"basketball-hoop","description":"Hoop with net, shown next to the live score","keywords":["nba","score"]}'

# → 201 {"id":42,"status":"open","statusUrl":"${BASE}/api/requests/42"}`}</pre>
        <ul>
          <li><code>name</code>: kebab-case, up to 40 characters.</li>
          <li><code>description</code>: 10–500 characters, what the icon shows and where you use it.</li>
          <li><code>keywords</code>: optional, up to 10 words.</li>
          <li>One icon per request, at most 20 requests per hour per token.</li>
          <li>Generic symbols only: no logos, trademarks or real people.</li>
        </ul>
      </section>

      <section aria-labelledby="follow">
        <h2 id="follow"><span>4</span> Follow it</h2>
        <pre>{`curl ${BASE}/api/requests -H "authorization: Bearer $VECTILUME_TOKEN"     # all your requests
curl ${BASE}/api/requests/42 -H "authorization: Bearer $VECTILUME_TOKEN"  # one request`}</pre>
        <dl className={styles.statuses}>
          {STATUSES.map(([status, meaning]) => (
            <div key={status}>
              <dt><code>{status}</code></dt>
              <dd>{meaning}</dd>
            </div>
          ))}
        </dl>
        <p>
          Once a day at most, we also email you what changed: requests <code>accepted</code>, <code>declined</code> or{" "}
          <code>ready</code>, and icons that shipped on npm, with the import line. One email for all your requests. Rather not?
          Untick it above, use the link in the email, or <code>{`curl -X PATCH ${BASE}/api/settings -H "authorization: Bearer $VECTILUME_TOKEN" -d '{"emails":false}'`}</code>.
        </p>
        <p>
          When it is <code>done</code>: <code>npm install @vectilume/react</code> and import it by its id in PascalCase, e.g.{" "}
          <code>{`import { BasketballHoop } from "@vectilume/react"`}</code>.
        </p>
      </section>

      <section aria-labelledby="ai" className={styles.note}>
        <h2 id="ai">Using an AI assistant?</h2>
        <p>
          Point it at <a href="/icon-requests.md"><code>{BASE}/icon-requests.md</code></a>: the same guide as plain Markdown, with
          every field, limit and error.
        </p>
      </section>
    </main>
  );
}
