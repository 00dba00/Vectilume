const REPO = "00dba00/Vectilume";

/** GitHub REST call as the repo's bot token (GITHUB_TOKEN: fine-grained, Issues read/write on this repo only). */
export async function github(pathname: string, init?: RequestInit): Promise<Response> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set");
  return fetch(`https://api.github.com/repos/${REPO}${pathname}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...init?.headers,
    },
  });
}
