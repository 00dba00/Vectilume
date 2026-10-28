import type { Metadata } from "next";
import Link from "next/link";
import { RequestForm } from "./RequestForm";
import styles from "./request-icons.module.css";

export const metadata: Metadata = {
  title: "Request an icon · Vectilume",
  description: "Missing an icon? Request it here or through the Vectilume API, then follow its status until it ships on npm.",
};

const BASE = "https://vectilume.vercel.app";

const STATUSES: [string, string][] = [
  ["open", "Received, not started."],
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

# → 201 {"token":"vl_…","note":"Store this token now; it is not shown again."}`}</pre>
        <p>The token is shown once, so keep it, e.g. in <code>VECTILUME_TOKEN</code>. It only shows the requests made with it.</p>
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
