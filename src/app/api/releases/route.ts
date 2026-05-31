import { NextRequest } from "next/server";
import { openai, MODEL } from "@/server/openai";
import { executeTool } from "@/server/github/tools";
import { errorMessage } from "@/server/errors";

const SYSTEM_PROMPT = `You are a release notes generator for open source repos.

You will receive pre-fetched data: recent releases and merged PRs.

Categorize each PR into ONE section:
- **Breaking Changes**: title/body mentions "breaking", "BREAKING", migration needed
- **Features**: "feat:", "add", "implement", "introduce", "support"
- **Bug Fixes**: "fix:", "resolve", "patch", "correct", "handle"
- **Performance**: "perf:", "optimize", "speed", "cache"
- **Documentation**: "docs:", "readme", "documentation", "guide"
- **Internal**: refactor, chore, test, ci, build, deps, lint

Return your response in TWO parts:

PART 1 — Markdown release notes. Start with a stats line, then the categorized notes:
## [Next Release] — YYYY-MM-DD

> **X PRs merged** since TAG (YYYY-MM-DD) by **Y contributors**

### Breaking Changes
- #123 Title (@author)

### Features
- #456 Title (@author)

(skip empty sections, but always include at least Features and Bug Fixes headers even if empty)

PART 2 — After a line containing ONLY "---SLACK---", write a concise 2-3 sentence Slack announcement.
Example: "Released v2.4.0 with 3 new features and 5 bug fixes. Highlights: dark mode support and SSR fix. Breaking: removed legacy API endpoints."

Be thorough. Include every merged PR in exactly one category. Never skip a PR.`;

export async function POST(req: NextRequest) {
  try {
    const { owner, repo } = await req.json();
    if (!owner || !repo) {
      return new Response(JSON.stringify({ error: "owner and repo required" }), { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function send(event: string, data: unknown) {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        }

        try {
          const tasks = [
            {
              tool: "query_releases",
              description: "Loading recent releases",
              run: () => executeTool("query_releases", { owner, repo }),
            },
            {
              tool: "query_merged_prs",
              description: "Fetching merged pull requests",
              run: () => executeTool("query_merged_prs", { owner, repo, limit: 30 }),
            },
          ];

          const results = await Promise.all(tasks.map(async (task) => {
            send("step", { tool: task.tool, description: task.description, status: "running" });
            const result = await task.run();
            send("step", { tool: task.tool, description: task.description, status: "done" });
            send("trace", { tool: task.tool, ...result.trace });
            return [task.tool, result.data] as const;
          }));

          send("step", { tool: "synthesize_release", description: "Generating release notes", status: "running" });

          const data = Object.fromEntries(results);
          const response = await openai.chat.completions.create({
            model: MODEL,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              {
                role: "user",
                content: `Generate release notes for ${owner}/${repo}. If no releases exist, generate notes from all recent merged PRs.\n\nReleases:\n${data.query_releases}\n\nMerged PRs:\n${data.query_merged_prs}`,
              },
            ],
          });

          send("step", { tool: "synthesize_release", description: "Generating release notes", status: "done" });
          send("result", { content: response.choices[0]?.message?.content ?? "" });
        } catch (error: unknown) {
          send("error", { message: errorMessage(error, "Release notes generation failed") });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: errorMessage(error, "Release notes generation failed") }), { status: 500 });
  }
}
