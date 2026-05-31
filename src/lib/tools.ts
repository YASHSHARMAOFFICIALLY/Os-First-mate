import { execFile } from "child_process";
import { promisify } from "util";
import type { ChatCompletionTool } from "openai/resources/chat/completions";

const execFileAsync = promisify(execFile);
const CORAL_BIN = process.env.CORAL_BIN || "/opt/homebrew/bin/coral";
const DEFAULT_PATH = "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin";

async function runCoralQuery(sql: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync(CORAL_BIN, ["sql", sql, "--format", "json"], {
      timeout: 8000,
      maxBuffer: 1024 * 1024 * 10,
      env: {
        ...process.env,
        PATH: `${process.env.PATH || ""}:${DEFAULT_PATH}`,
      },
    });
    return stdout.trim();
  } catch (error: any) {
    const message = error.stderr?.trim() || error.stdout?.trim() || error.message || "Coral query failed";
    console.error("[coral]", message);
    throw new Error(message);
  }
}

export interface QueryTrace {
  sql: string;
  table: string;
  source: "coral" | "github-rest";
  rowCount: number;
}

function extractTable(sql: string): string {
  const match = sql.match(/FROM\s+(github\.\w+)/i);
  return match ? match[1] : "unknown";
}

function countRows(json: string): number {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.length : 1;
  } catch { return 0; }
}

// Track the last query trace for each tool execution
let lastTrace: QueryTrace | null = null;
export function getLastTrace(): QueryTrace | null { return lastTrace; }

async function runQuery(sql: string, fallback?: () => Promise<unknown>): Promise<string> {
  const table = extractTable(sql);
  try {
    const result = await runCoralQuery(sql);
    lastTrace = { sql, table, source: "coral", rowCount: countRows(result) };
    return result;
  } catch (error: any) {
    if (!fallback) {
      lastTrace = { sql, table, source: "coral", rowCount: 0 };
      return JSON.stringify({ error: error.message || "Query failed" });
    }

    try {
      console.warn("[coral] Falling back to GitHub REST API");
      const result = JSON.stringify(await fallback());
      lastTrace = { sql, table, source: "github-rest", rowCount: countRows(result) };
      return result;
    } catch (fallbackError: any) {
      const message = fallbackError.message || "GitHub fallback failed";
      console.error("[github-fallback]", message);
      lastTrace = { sql, table, source: "github-rest", rowCount: 0 };
      return JSON.stringify({ error: `${error.message || "Coral query failed"}; fallback: ${message}` });
    }
  }
}

function githubHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "os-first-mate",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

async function githubFetch<T>(path: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: githubHeaders(),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status}: ${body}`);
  }

  return await response.json() as T;
}

type GitHubIssue = {
  number: number;
  title: string;
  body: string | null;
  labels: Array<string | { name?: string }>;
  created_at: string;
  comments: number;
  user?: { login?: string };
  state: string;
  pull_request?: unknown;
};

type GitHubPull = {
  number: number;
  title: string;
  body: string | null;
  merged_at: string | null;
  user?: { login?: string };
};

type GitHubLabel = {
  name: string;
  description: string | null;
  color: string;
};

type GitHubRelease = {
  tag_name: string;
  name: string | null;
  published_at: string | null;
  body: string | null;
};

function normalizeLabels(labels: GitHubIssue["labels"]): string[] {
  return labels
    .map((label) => (typeof label === "string" ? label : label.name))
    .filter((label): label is string => Boolean(label));
}

function issueRow(issue: GitHubIssue) {
  return {
    number: issue.number,
    title: issue.title,
    body: issue.body,
    labels: normalizeLabels(issue.labels),
    created_at: issue.created_at,
    comments: issue.comments,
    user__login: issue.user?.login,
  };
}

async function fetchIssues(owner: string, repo: string, state: "open" | "closed", limit: number) {
  const perPage = Math.min(Math.max(limit * 2, 10), 100);
  const issues = await githubFetch<GitHubIssue[]>(
    `/repos/${owner}/${repo}/issues?state=${state}&sort=created&direction=desc&per_page=${perPage}`
  );

  return issues
    .filter((issue) => !issue.pull_request)
    .slice(0, limit)
    .map(issueRow);
}

// 7 maintainer tools — each maps to a Coral SQL query
export const toolDefinitions: ChatCompletionTool[] = [
  // Tool 1: Recent open issues for triage
  {
    type: "function",
    function: {
      name: "query_recent_issues",
      description:
        "Fetches recent open issues from a GitHub repo. Returns issue number, title, body, labels, creation date, comment count, and author. Use this to find issues that need triage.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "GitHub repo owner" },
          repo: { type: "string", description: "GitHub repo name" },
          limit: { type: "number", description: "Max issues to return (default 20)" },
        },
        required: ["owner", "repo"],
      },
    },
  },
  // Tool 2: Repo label set
  {
    type: "function",
    function: {
      name: "query_repo_labels",
      description:
        "Fetches all labels defined in a GitHub repo. Returns label name, description, and color. Use this to know which labels exist before suggesting labels for triage.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "GitHub repo owner" },
          repo: { type: "string", description: "GitHub repo name" },
        },
        required: ["owner", "repo"],
      },
    },
  },
  // Tool 3: Closed issues for pattern learning
  {
    type: "function",
    function: {
      name: "query_closed_issues",
      description:
        "Fetches recently closed issues with their labels. Use this to learn labeling patterns — which types of issues get which labels. Helps make better triage suggestions.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "GitHub repo owner" },
          repo: { type: "string", description: "GitHub repo name" },
        },
        required: ["owner", "repo"],
      },
    },
  },
  // Tool 4: Single issue by number
  {
    type: "function",
    function: {
      name: "query_single_issue",
      description:
        "Fetches a specific issue by number, including its full body text. Use this to get details about a particular issue for duplicate detection or deep analysis.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "GitHub repo owner" },
          repo: { type: "string", description: "GitHub repo name" },
          number: { type: "number", description: "Issue number" },
        },
        required: ["owner", "repo", "number"],
      },
    },
  },
  // Tool 5: Open issues for duplicate comparison
  {
    type: "function",
    function: {
      name: "query_open_issues",
      description:
        "Fetches open issues with titles and bodies for duplicate comparison. Use when scanning for potential duplicates of a given issue.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "GitHub repo owner" },
          repo: { type: "string", description: "GitHub repo name" },
          limit: { type: "number", description: "Max issues to return (default 50)" },
        },
        required: ["owner", "repo"],
      },
    },
  },
  // Tool 6: Merged PRs for release notes
  {
    type: "function",
    function: {
      name: "query_merged_prs",
      description:
        "Fetches recently merged pull requests. Returns PR number, title, body, merge date, and author. Use this to generate release notes by categorizing merged PRs.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "GitHub repo owner" },
          repo: { type: "string", description: "GitHub repo name" },
          limit: { type: "number", description: "Max PRs to return (default 30)" },
        },
        required: ["owner", "repo"],
      },
    },
  },
  // Tool 7: Releases/tags
  {
    type: "function",
    function: {
      name: "query_releases",
      description:
        "Fetches recent releases/tags from a GitHub repo. Returns tag name, release name, publish date, and body. Use this to find the last release date for generating release notes since that date.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "GitHub repo owner" },
          repo: { type: "string", description: "GitHub repo name" },
        },
        required: ["owner", "repo"],
      },
    },
  },
  // Tool 8: Contributor stats from PRs (GROUP BY)
  {
    type: "function",
    function: {
      name: "query_contributor_pr_stats",
      description:
        "Fetches PR contribution stats per author. Returns each contributor's login and their merged PR count, ordered by most active. Use for bus factor and top contributor analysis.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "GitHub repo owner" },
          repo: { type: "string", description: "GitHub repo name" },
          limit: { type: "number", description: "Max contributors to return (default 20)" },
        },
        required: ["owner", "repo"],
      },
    },
  },
  // Tool 9: Contributor stats from issues (GROUP BY)
  {
    type: "function",
    function: {
      name: "query_contributor_issue_stats",
      description:
        "Fetches issue contribution stats per author. Returns each contributor's login and their issue count, ordered by most active. Use for contributor analysis.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "GitHub repo owner" },
          repo: { type: "string", description: "GitHub repo name" },
          limit: { type: "number", description: "Max contributors to return (default 20)" },
        },
        required: ["owner", "repo"],
      },
    },
  },
  // Tool 10: Recent PR activity (for rising star detection)
  {
    type: "function",
    function: {
      name: "query_recent_pr_activity",
      description:
        "Fetches recently merged PRs with author and merge date. Use to identify rising star contributors (new contributors with high recent activity) and activity trends.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "GitHub repo owner" },
          repo: { type: "string", description: "GitHub repo name" },
          limit: { type: "number", description: "Max PRs to return (default 50)" },
        },
        required: ["owner", "repo"],
      },
    },
  },
];

// Sanitize input to prevent injection
function sanitize(value: unknown): string {
  return String(value ?? "").replace(/[^a-zA-Z0-9._-]/g, "");
}

function limit(value: unknown, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), max);
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  const owner = sanitize(args.owner);
  const repo = sanitize(args.repo);

  switch (name) {
    case "query_recent_issues": {
      const rowLimit = limit(args.limit, 20, 50);
      const sql = `SELECT number, title, body, labels, created_at, comments, user__login FROM github.issues WHERE owner='${owner}' AND repo='${repo}' AND state='open' ORDER BY created_at DESC LIMIT ${rowLimit}`;
      return await runQuery(sql, () => fetchIssues(owner, repo, "open", rowLimit));
    }

    case "query_repo_labels": {
      const sql = `SELECT name, description, color FROM github.repo_labels WHERE owner='${owner}' AND repo='${repo}'`;
      return await runQuery(sql, async () => {
        const labels = await githubFetch<GitHubLabel[]>(`/repos/${owner}/${repo}/labels?per_page=100`);
        return labels.map(({ name, description, color }) => ({ name, description, color }));
      });
    }

    case "query_closed_issues": {
      const sql = `SELECT number, title, labels FROM github.issues WHERE owner='${owner}' AND repo='${repo}' AND state='closed' ORDER BY created_at DESC LIMIT 30`;
      return await runQuery(sql, async () => {
        const issues = await fetchIssues(owner, repo, "closed", 30);
        return issues.map(({ number, title, labels }) => ({ number, title, labels }));
      });
    }

    case "query_single_issue": {
      const num = Number(args.number) || 0;
      const sql = `SELECT number, title, body, labels, created_at, state, comments, user__login FROM github.issues WHERE owner='${owner}' AND repo='${repo}' AND number=${num}`;
      return await runQuery(sql, async () => {
        const issue = await githubFetch<GitHubIssue>(`/repos/${owner}/${repo}/issues/${num}`);
        return [{
          ...issueRow(issue),
          state: issue.state,
        }];
      });
    }

    case "query_open_issues": {
      const rowLimit = limit(args.limit, 50, 100);
      const sql = `SELECT number, title, body, labels FROM github.issues WHERE owner='${owner}' AND repo='${repo}' AND state='open' ORDER BY created_at DESC LIMIT ${rowLimit}`;
      return await runQuery(sql, async () => {
        const issues = await fetchIssues(owner, repo, "open", rowLimit);
        return issues.map(({ number, title, body, labels }) => ({ number, title, body, labels }));
      });
    }

    case "query_merged_prs": {
      const rowLimit = limit(args.limit, 30, 100);
      const sql = `SELECT number, title, body, merged_at, user__login FROM github.pulls WHERE owner='${owner}' AND repo='${repo}' AND state='closed' ORDER BY merged_at DESC LIMIT ${rowLimit}`;
      return await runQuery(sql, async () => {
        const pulls = await githubFetch<GitHubPull[]>(
          `/repos/${owner}/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=${rowLimit}`
        );

        return pulls
          .filter((pull) => pull.merged_at)
          .map((pull) => ({
            number: pull.number,
            title: pull.title,
            body: pull.body,
            merged_at: pull.merged_at,
            user__login: pull.user?.login,
          }));
      });
    }

    case "query_releases": {
      const sql = `SELECT tag_name, name, published_at, body FROM github.releases WHERE owner='${owner}' AND repo='${repo}' ORDER BY created_at DESC LIMIT 5`;
      return await runQuery(sql, async () => {
        const releases = await githubFetch<GitHubRelease[]>(`/repos/${owner}/${repo}/releases?per_page=5`);
        return releases.map(({ tag_name, name, published_at, body }) => ({ tag_name, name, published_at, body }));
      });
    }

    case "query_contributor_pr_stats": {
      const rowLimit = limit(args.limit, 20, 50);
      const sql = `SELECT user__login, COUNT(*) as pr_count FROM github.pulls WHERE owner='${owner}' AND repo='${repo}' AND state='closed' GROUP BY user__login ORDER BY pr_count DESC LIMIT ${rowLimit}`;
      return await runQuery(sql, async () => {
        // Fallback: fetch PRs and aggregate in JS
        const pulls = await githubFetch<GitHubPull[]>(
          `/repos/${owner}/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=100`
        );
        const counts: Record<string, number> = {};
        for (const pr of pulls) {
          if (!pr.merged_at) continue;
          const login = pr.user?.login || "unknown";
          counts[login] = (counts[login] || 0) + 1;
        }
        return Object.entries(counts)
          .map(([user__login, pr_count]) => ({ user__login, pr_count }))
          .sort((a, b) => b.pr_count - a.pr_count)
          .slice(0, rowLimit);
      });
    }

    case "query_contributor_issue_stats": {
      const rowLimit = limit(args.limit, 20, 50);
      const sql = `SELECT user__login, COUNT(*) as issue_count FROM github.issues WHERE owner='${owner}' AND repo='${repo}' GROUP BY user__login ORDER BY issue_count DESC LIMIT ${rowLimit}`;
      return await runQuery(sql, async () => {
        // Fallback: fetch issues and aggregate in JS
        const issues = await githubFetch<GitHubIssue[]>(
          `/repos/${owner}/${repo}/issues?state=all&sort=created&direction=desc&per_page=100`
        );
        const counts: Record<string, number> = {};
        for (const issue of issues) {
          if (issue.pull_request) continue;
          const login = issue.user?.login || "unknown";
          counts[login] = (counts[login] || 0) + 1;
        }
        return Object.entries(counts)
          .map(([user__login, issue_count]) => ({ user__login, issue_count }))
          .sort((a, b) => b.issue_count - a.issue_count)
          .slice(0, rowLimit);
      });
    }

    case "query_recent_pr_activity": {
      const rowLimit = limit(args.limit, 50, 100);
      const sql = `SELECT user__login, title, merged_at FROM github.pulls WHERE owner='${owner}' AND repo='${repo}' AND state='closed' ORDER BY merged_at DESC LIMIT ${rowLimit}`;
      return await runQuery(sql, async () => {
        const pulls = await githubFetch<GitHubPull[]>(
          `/repos/${owner}/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=${rowLimit}`
        );
        return pulls
          .filter((pr) => pr.merged_at)
          .map((pr) => ({
            user__login: pr.user?.login,
            title: pr.title,
            merged_at: pr.merged_at,
          }));
      });
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}
