import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { findMissingStyles, parseIconPath, validateSvg, type IconPath, type Issue } from "./svg-rules.ts";

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile() && !entry.name.startsWith("."))
    .map((entry) => path.join(entry.parentPath, entry.name))
    .sort();
}

function format(file: string, issue: Issue): string {
  const label = issue.severity === "error" ? "error  " : "warning";
  return `  ${label} ${file}  [${issue.rule}] ${issue.message}`;
}

async function main(): Promise<void> {
  const root = path.resolve(process.argv[2] ?? "../icons-svg/src");
  const files = await listFiles(root);
  const icons: IconPath[] = [];
  const report: string[] = [];
  let errors = 0;
  let warnings = 0;

  const record = (file: string, issues: Issue[]) => {
    for (const issue of issues) {
      if (issue.severity === "error") errors++;
      else warnings++;
      report.push(format(file, issue));
    }
  };

  for (const file of files) {
    const relPath = path.relative(root, file).split(path.sep).join("/");
    const parsed = parseIconPath(relPath);
    if ("severity" in parsed) {
      record(relPath, [parsed]);
      continue;
    }
    icons.push(parsed);
    record(relPath, validateSvg(await readFile(file, "utf8"), parsed.style));
  }
  record("(collection)", findMissingStyles(icons));

  if (report.length > 0) console.log(report.join("\n"));
  console.log(`\n${files.length} files checked: ${errors} errors, ${warnings} warnings`);
  if (errors > 0) process.exitCode = 1;
}

await main();
