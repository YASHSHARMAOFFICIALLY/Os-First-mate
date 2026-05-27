import { exec } from "child_process";
import { promisify } from "util";
import type { ChatCompletionTool } from "openai/resources/chat/completions";

const execAsync = promisify(exec);

async function runCoralQuery(sql: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`coral sql "${sql.replace(/"/g, '\\"')}" --format json`, {
      timeout: 15000,
    });
    return stdout.trim();
  } catch (error: any) {
    return JSON.stringify({ error: error.message || "Coral query failed" });
  }
}

// TOOL DEFINITIONS
// This is a "menu" for GPT — it tells the AI what tools exist.
// Tool 1 is done for you. You write tools 2 and 3.

export const toolDefinitions: ChatCompletionTool[] = [
  // Tool 1: DONE FOR YOU — study this pattern
  {
    type: "function",
    function: {
      name: "query_repo_info",
      description: "Queries GitHub repository metadata. Returns stars, language, description, open issues count, and license. Use this to assess if a repo is active and contributor-friendly.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "GitHub repo owner, e.g. 'vercel'" },
          repo: { type: "string", description: "GitHub repo name, e.g. 'next.js'" },
        },
        required: ["owner", "repo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_issues",
      description: "Queries GitHub repository issues. Classifies issues by level (good first issue, intermediate, expert). Returns issues sorted by newest first, with language required for each. Can filter by label.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "GitHub repo owner, e.g. 'vercel'" },
          repo: { type: "string", description: "GitHub repo name, e.g. 'next.js'" },
          label: { type: "string", description: "Optional label to filter by, e.g. 'good first issue'" },
        },
        required: ["owner", "repo"],
      },
    },
  },
    {
    type: "function",
    function: {
      name: "query_pulls",
      description: "Queries GitHub repository pulls all open and close pull made by the owner . Return the pull made by owner into closed and open , if any mainatiner ask for review mention too if the pull is open .",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "GitHub repo owner, e.g. 'vercel'" },
          repo: { type: "string", description: "GitHub repo name, e.g. 'next.js'" },
        },
        required: ["owner", "repo"],
      },
    },
  },
];

// TOOL EXECUTOR
// When GPT calls a tool, this runs the actual SQL query.
// Case 1 is done for you. You write cases 2 and 3.

export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  const owner = String(args.owner ?? "").replace(/[^a-zA-Z0-9._-]/g, "");
  const repo = String(args.repo ?? "").replace(/[^a-zA-Z0-9._-]/g, "");

  switch (name) {
    // Case 1: DONE FOR YOU
    case "query_repo_info": {
      const sql = `SELECT name, description, stargazers_count, language, open_issues_count, license__spdx_id, pushed_at, has_issues FROM github.repos_get WHERE owner='${owner}' AND repo='${repo}'`;
      return await runCoralQuery(sql);
    }

    case "query_issues": {
      let sql = `SELECT number, title, labels, created_at, comments FROM github.issues WHERE owner='${owner}' AND repo='${repo}' AND state='open'`;
      if (args.label) {
        const label = String(args.label).replace(/[^a-zA-Z0-9 _-]/g, "");
        sql += ` AND labels LIKE '%${label}%'`;
      }
      sql += ` LIMIT 20`;
      return await runCoralQuery(sql);
    }

    case "query_pulls": {
      const sql = `SELECT number, title, state, created_at, merged_at FROM github.pulls WHERE owner='${owner}' AND repo='${repo}' ORDER BY created_at DESC LIMIT 10`;
      return await runCoralQuery(sql);
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}
