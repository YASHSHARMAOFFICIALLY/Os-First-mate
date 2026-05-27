import { RepoInfo, RepoIssue } from "./types";

const GITHUB_API = "https://api.github.com";

export function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s#?]+)|^([^/\s]+)\/([^/\s]+)$/
  );
  if (match) {
    return {
      owner: match[1] || match[3],
      repo: (match[2] || match[4]).replace(/\.git$/, ""),
    };
  }
  return null;
}

export async function fetchRepoInfo(owner: string, repo: string): Promise<RepoInfo> {
  const [repoRes, contributingRes] = await Promise.all([
    fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
      headers: { Accept: "application/vnd.github.v3+json" },
    }),
    fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/CONTRIBUTING.md`, {
      headers: { Accept: "application/vnd.github.v3+json" },
    }),
  ]);

  if (!repoRes.ok) {
    throw new Error(`GitHub API error: ${repoRes.status} ${repoRes.statusText}`);
  }

  const data = await repoRes.json();

  return {
    name: data.name,
    fullName: data.full_name,
    description: data.description,
    stars: data.stargazers_count,
    language: data.language,
    lastCommit: data.pushed_at,
    hasContributingMd: contributingRes.ok,
    openIssuesCount: data.open_issues_count,
    license: data.license?.spdx_id ?? null,
    defaultBranch: data.default_branch,
  };
}

export async function fetchIssues(
  owner: string,
  repo: string,
  labels?: string,
  perPage: number = 20
): Promise<RepoIssue[]> {
  const params = new URLSearchParams({
    state: "open",
    sort: "created",
    direction: "desc",
    per_page: String(perPage),
  });
  if (labels) params.set("labels", labels);

  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/issues?${params}`,
    { headers: { Accept: "application/vnd.github.v3+json" } }
  );

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  return data
    .filter((item: any) => !item.pull_request)
    .map((issue: any) => ({
      number: issue.number,
      title: issue.title,
      labels: issue.labels.map((l: any) => l.name),
      createdAt: issue.created_at,
      commentsCount: issue.comments,
      bodyPreview: issue.body ? issue.body.slice(0, 300) : "",
      url: issue.html_url,
    }));
}
