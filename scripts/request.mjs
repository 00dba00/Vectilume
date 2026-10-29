// Codex's side of icon requests. Usage: pnpm request <sync|start|review> [id]
//   sync         writes icon-queue/: one file per request the owner accepted and nobody finished yet
//   start <id>   marks it in-progress (the developer gets an email)
//   review <id>  commits and pushes the drawn icon (found by "request": <id> in a collection), sends it to the owner
//                and drops its queue file; the npm release ships it only after the owner approves it
// Needs VECTILUME_WORKER_TOKEN, e.g. in .env.worker at the repo root.
import { execFileSync } from "node:child_process";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const QUEUE = path.join(ROOT, "icon-queue");
const ICONS = path.join(ROOT, "packages/icons-svg");
const API = process.env.VECTILUME_API ?? "https://vectilume.dev";
const TOKEN = process.env.VECTILUME_WORKER_TOKEN;

async function call(method, url, body) {
  const response = await fetch(`${API}/api/worker/requests${url}`, {
    method,
    headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
    body: body && JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${method} ${url || "/"}: ${response.status} ${data.error ?? ""}`);
  return data;
}

const STYLES = ["outline", "duotone", "solid"];

const queueFile = (request) => path.join(QUEUE, `${request.id}-${request.name}.md`);

async function queueFiles(id) {
  const files = await readdir(QUEUE).catch(() => []);
  return files.filter((file) => file.endsWith(".md") && (id === undefined || file.startsWith(`${id}-`)));
}

async function sync() {
  const { requests } = await call("GET", "");
  await mkdir(QUEUE, { recursive: true });
  for (const file of await queueFiles()) await rm(path.join(QUEUE, file));
  for (const r of requests) {
    await writeFile(
      queueFile(r),
      `# #${r.id} ${r.name}

Status: ${r.status}${r.note ? `\n\n**Changes asked by the owner:** ${r.note}` : ""}

${r.description}

Keywords: ${r.keywords.length ? r.keywords.join(", ") : "none"}

When you start: \`pnpm request start ${r.id}\`. When drawn and added to a collection with \`"request": ${r.id}\`:
\`pnpm request review ${r.id}\`.
`,
    );
  }
  console.log(requests.length ? `icon-queue/: ${requests.map((r) => `#${r.id} ${r.name} (${r.status})`).join(", ")}` : "icon-queue/ is empty: nothing accepted is waiting.");
}

async function collectionEntry(id) {
  for (const file of await readdir(ICONS)) {
    if (!file.endsWith(".json") || file === "package.json" || file === "release.json") continue;
    const items = JSON.parse(await readFile(path.join(ICONS, file), "utf8"));
    const entry = Array.isArray(items) && items.find((item) => item.request === id);
    if (entry) return { entry, file };
  }
  throw new Error(`no collection entry has "request": ${id}; add it to the icon's entry first`);
}

const git = (...args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();

/** Commits only this icon (its SVGs and collection file) and pushes, so the npm release on GitHub can ship it once approved. */
function commitIcon(id, entry, file) {
  const files = [...STYLES.map((style) => `packages/icons-svg/src/${style}/${entry.id}.svg`), `packages/icons-svg/${file}`];
  git("add", "--", ...files);
  const staged = git("diff", "--cached", "--name-only");
  const other = staged.split("\n").filter((name) => name && !files.includes(name));
  if (other.length) throw new Error(`other staged files would ride along: ${other.join(", ")}; unstage them first`);
  if (staged) git("commit", "-m", `Icons: #${id} ${entry.id} for review`, "--", ...files);
  git("push", "origin", "HEAD:main");
}

async function review(id) {
  const { entry, file } = await collectionEntry(id);
  const svgs = {};
  for (const style of STYLES) {
    svgs[style] = await readFile(path.join(ICONS, "src", style, `${entry.id}.svg`), "utf8");
  }
  commitIcon(id, entry, file);
  const result = await call("PATCH", `/${id}`, { status: "review", icon: entry.id, svgs });
  for (const file of await queueFiles(id)) await rm(path.join(QUEUE, file));
  console.log(`#${id} ${result.name}: ${result.previous} → review, icon ${entry.id} (pushed ${git("rev-parse", "--short", "HEAD")}). The owner approves it in /admin.`);
}

const [command, rawId] = process.argv.slice(2);
const id = Number(rawId);
try {
  if (!TOKEN) throw new Error("VECTILUME_WORKER_TOKEN is not set (put it in .env.worker at the repo root)");
  if (command === "sync") await sync();
  else if ((command === "start" || command === "review") && Number.isInteger(id) && id > 0) {
    if (command === "start") {
      const result = await call("PATCH", `/${id}`, { status: "in-progress" });
      console.log(`#${id} ${result.name}: ${result.previous} → in-progress.`);
    } else await review(id);
  } else throw new Error("usage: pnpm request <sync|start <id>|review <id>>");
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
