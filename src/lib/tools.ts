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

  

  // Tool 2: YOUR TURN — query_issues
  // Copy the pattern above. Change: name, description, properties.
  // This tool queries open issues. It takes owner, repo, and an optional label.

  // Tool 3: YOUR TURN — query_pulls
  // This tool queries recent pull requests. It takes owner and repo.
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
      const sql = `SELECT name, description, stargazers_count, language, open_issues_count, license FROM github.repos WHERE owner='${owner}' AND name='${repo}'`;
      return await runCoralQuery(sql);
    }

    // Case 2: YOUR TURN — "query_issues"
    // SQL: SELECT number, title, labels, created_at, comments FROM github.issues
    //      WHERE owner='${owner}' AND repo='${repo}' AND state='open' LIMIT 20
    // Bonus: if args.label exists, add AND labels LIKE '%${label}%'

    // Case 3: YOUR TURN — "query_pulls"
    // SQL: SELECT number, title, state, created_at, user_login FROM github.pulls
    //      WHERE owner='${owner}' AND repo='${repo}' ORDER BY created_at DESC LIMIT 10

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}
