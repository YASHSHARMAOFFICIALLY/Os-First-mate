import { NextRequest } from "next/server";
import { openai, MODEL } from "@/server/openai";
import { executeTool } from "@/server/github/tools";
import { errorMessage } from "@/server/errors";

const SYSTEM_PROMPT = `You are a project health analyst for open source maintainers.

Given PR and issue contribution data for a GitHub repo, analyze and return a structured JSON report.

Your analysis must include:

1. **Bus Factor** — How concentrated is the work?
   - Score 1-5 (1 = one person does everything = critical risk, 5 = well distributed)
   - Calculate what % of merged PRs the top contributor handles
   - Risk levels: critical (>70%), high (50-70%), medium (30-50%), low (<30%)

2. **Top Contributors** — Ranked by activity
   - Combine PR and issue data
   - Assign roles: "Core maintainer" (most PRs), "Active contributor" (regular PRs), "Issue reporter" (mostly issues), "New contributor" (few total contributions)

3. **Rising Stars** — Contributors with increasing recent activity
   - Look at recent PR activity to find contributors whose activity is growing
   - Identify new contributors who are becoming more active

4. **Review Bottleneck** — Is there a review bottleneck?
   - Identify if one person is reviewing/merging most PRs
   - Estimate review wait based on PR merge patterns
   - Suggest how to distribute review load

5. **Burnout Risk** — Are any contributors showing signs of overload?
   - High volume of PRs + issues filed by same person
   - Single contributor handling majority of work
   - Suggest actionable interventions

6. **Insights** — 3-5 actionable observations about the project health
   - Flag risks (bus factor, single points of failure, review bottlenecks)
   - Highlight positive trends (new contributors, growing community)
   - Note any concerning patterns

7. **Recommendations** — 3-5 specific actions the maintainer should take
   - Each recommendation must answer "what should I do next?"

Return ONLY a JSON object wrapped in \`\`\`json code fence:
\`\`\`json
{
  "busFactor": { "score": 3, "risk": "medium", "topContributor": "@alice", "percentage": 45 },
  "topContributors": [
    { "login": "alice", "prs": 45, "issues": 12, "role": "Core maintainer" }
  ],
  "risingStars": [
    { "login": "bob", "recentPrs": 8, "trend": "5 PRs in last 2 weeks, up from 1/month" }
  ],
  "reviewBottleneck": {
    "bottleneck": "@alice reviews 80% of PRs",
    "avgWaitDays": 3,
    "suggestion": "Add @bob and @carol as reviewers for frontend PRs"
  },
  "burnoutRisk": [
    { "contributor": "@alice", "signal": "Filed 15 issues and merged 20 PRs this month alone", "recommendation": "Consider delegating area/router ownership to @bob" }
  ],
  "insights": ["@alice handles 45% of all merged PRs — moderate bus factor risk"],
  "recommendations": ["Consider adding @bob as a reviewer to distribute review load"]
}
\`\`\``;

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
              tool: "query_contributor_pr_stats",
              description: "Analyzing PR contributions by author",
              run: () => executeTool("query_contributor_pr_stats", { owner, repo }),
            },
            {
              tool: "query_contributor_issue_stats",
              description: "Analyzing issue contributions by author",
              run: () => executeTool("query_contributor_issue_stats", { owner, repo }),
            },
            {
              tool: "query_recent_pr_activity",
              description: "Loading recent PR activity",
              run: () => executeTool("query_recent_pr_activity", { owner, repo, limit: 50 }),
            },
          ];

          const results = await Promise.all(tasks.map(async (task) => {
            send("step", { tool: task.tool, description: task.description, status: "running" });
            const result = await task.run();
            send("step", { tool: task.tool, description: task.description, status: "done" });
            send("trace", { tool: task.tool, ...result.trace });
            return [task.tool, result.data] as const;
          }));

          send("step", { tool: "synthesize_health", description: "Generating project health report", status: "running" });

          const data = Object.fromEntries(results);
          const response = await openai.chat.completions.create({
            model: MODEL,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              {
                role: "user",
                content: `Analyze contributor data for ${owner}/${repo}. Return the structured JSON report.\n\nPR Stats:\n${data.query_contributor_pr_stats}\n\nIssue Stats:\n${data.query_contributor_issue_stats}\n\nRecent Activity:\n${data.query_recent_pr_activity}`,
              },
            ],
          });

          send("step", { tool: "synthesize_health", description: "Generating project health report", status: "done" });
          send("result", { content: response.choices[0]?.message?.content ?? "" });
        } catch (error: unknown) {
          send("error", { message: errorMessage(error, "Project health analysis failed") });
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
    return new Response(JSON.stringify({ error: errorMessage(error, "Project health analysis failed") }), { status: 500 });
  }
}
