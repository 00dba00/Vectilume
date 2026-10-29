/**
 * Starts and reads the npm release workflow (.github/workflows/npm-release.yml) through the GitHub API.
 * GITHUB_RELEASE_TOKEN: a fine-grained token for this repository only, with Actions read and write.
 */
const RUNS = "https://api.github.com/repos/00dba00/Vectilume/actions/workflows/npm-release.yml";

export const releaseEnabled = () => Boolean(process.env.GITHUB_RELEASE_TOKEN);

const github = (url: string, init: RequestInit = {}) =>
  fetch(url, {
    ...init,
    headers: {
      authorization: `Bearer ${process.env.GITHUB_RELEASE_TOKEN}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
    },
  });

export async function startNpmRelease(bump: "patch" | "minor"): Promise<void> {
  const response = await github(`${RUNS}/dispatches`, { method: "POST", body: JSON.stringify({ ref: "main", inputs: { bump } }) });
  if (response.status !== 204) throw new Error(`GitHub answered ${response.status}: ${await response.text()}`);
}

export interface ReleaseRun {
  /** queued, in_progress or completed */
  status: string;
  /** success, failure, cancelled… once completed */
  conclusion: string | null;
  url: string;
  startedAt: string;
  /** A failed run whose npm publish steps both succeeded: the packages are out, a later step (commit, tag) failed. */
  published: boolean;
}

/** True when the run's publish steps (named "Publish …", or "Run npm publish …" in older runs) all succeeded. */
async function publishedIn(jobsUrl: string): Promise<boolean> {
  const response = await github(jobsUrl);
  if (!response.ok) return false;
  const { jobs } = (await response.json()) as { jobs: { steps?: { name: string; conclusion: string | null }[] }[] };
  const steps = jobs.flatMap((job) => job.steps ?? []).filter((step) => /^(Publish |Run npm publish)/.test(step.name));
  return steps.length >= 2 && steps.every((step) => step.conclusion === "success");
}

/** The latest run of the release workflow, or null when there is none or GitHub cannot be reached. */
export async function lastNpmRelease(): Promise<ReleaseRun | null> {
  try {
    const response = await github(`${RUNS}/runs?per_page=1`);
    if (!response.ok) return null;
    const [run] = ((await response.json()) as { workflow_runs: Record<string, string>[] }).workflow_runs;
    if (!run) return null;
    const conclusion = run.conclusion ?? null;
    const published = run.status === "completed" && conclusion === "failure" && (await publishedIn(run.jobs_url));
    return { status: run.status, conclusion, url: run.html_url, startedAt: run.run_started_at ?? run.created_at, published };
  } catch {
    return null;
  }
}
