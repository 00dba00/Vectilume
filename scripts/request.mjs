// Codex's side of icon requests. Usage: pnpm request <sync|start|review> [id]
//   sync         writes icon-queue/: one file per request the owner accepted and nobody finished yet
//   start <id>   marks it in-progress (the developer gets an email)
//   review <id>  sends the drawn icon (found by "request": <id> in a collection) to the owner and drops its queue file
// Needs VECTILUME_WORKER_TOKEN, e.g. in .env.worker at the repo root.
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
    if (entry) return entry;
  }
  throw new Error(`no collection entry has "request": ${id}; add it to the icon's entry first`);
}

async function review(id) {
  const entry = await collectionEntry(id);
  const svgs = {};
  for (const style of ["outline", "duotone", "solid"]) {
    svgs[style] = await readFile(path.join(ICONS, "src", style, `${entry.id}.svg`), "utf8");
  }
  const result = await call("PATCH", `/${id}`, { status: "review", icon: entry.id, svgs });
  for (const file of await queueFiles(id)) await rm(path.join(QUEUE, file));
  console.log(`#${id} ${result.name}: ${result.previous} → review, icon ${entry.id}. The owner approves it in /admin.`);
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
