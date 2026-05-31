import { NextRequest } from "next/server";
import { openai, MODEL } from "@/lib/openai";
import { executeTool, getLastTrace } from "@/lib/tools";

const SYSTEM_PROMPT = `You are a senior open source maintainer's daily briefing system.

You will receive pre-fetched Coral SQL data from 8 parallel queries covering issues, PRs, labels, contributors, releases, and activity patterns.

Analyze ALL the data and return a comprehensive JSON brief. Every section must answer "what should the maintainer do next?"

Return ONLY a JSON object in a code fence:
\`\`\`json
{
  "repoHealth": {
    "score": 72,
    "grade": "B",
    "summary": "Active repo with moderate bus factor risk. 5 untriaged issues, 2 potential duplicates."
  },
  "urgentIssues": [
    {
      "number": 4521,
      "title": "Fix hydration mismatch in RSC",
      "priority": "P0",
      "reason": "Crash affecting users, similar to resolved #4100",
      "nextAction": "Assign to @alice and label as bug + area/rsc. Ask reporter for reproduction."
    }
  ],
  "duplicateRisks": [
    {
      "issues": [{"number": 4521, "title": "Fix hydration mismatch"}, {"number": 4100, "title": "RSC hydration error"}],
      "similarity": "Both report hydration failures in RSC with similar stack traces",
      "nextAction": "Close #4521 as duplicate of #4100, or merge discussion."
    }
  ],
  "contributorRisks": [
    {
      "risk": "Bus factor: 2",
      "detail": "@alice handles 68% of all merged PRs. If she's unavailable, merges stall.",
      "nextAction": "Mentor @bob on the review process for area/router PRs."
    }
  ],
  "risingContributors": [
    {
      "login": "bob",
      "recentPrs": 8,
      "recommendation": "Invite @bob as a collaborator — 8 PRs merged in 2 weeks."
    }
  ],
  "releaseCandidates": {
    "prCount": 12,
    "sinceTag": "v2.3.0 (2024-12-01)",
    "nextAction": "12 PRs merged since last release. Run: gh release create v2.4.0"
  },
  "recommendedActions": [
    {
      "priority": 1,
      "action": "Triage 5 unlabeled issues",
      "reason": "Open issues without labels get stale fast",
      "command": "gh issue list -R owner/repo --label '' --state open"
    },
    {
      "priority": 2,
      "action": "Close duplicate #4521",
      "reason": "Duplicate of #4100, splitting discussion",
      "command": "gh issue close 4521 -R owner/repo -c 'Duplicate of #4100'"
    },
    {
      "priority": 3,
      "action": "Cut a release",
      "reason": "12 PRs merged since v2.3.0, users waiting for fixes",
      "command": "gh release create v2.4.0 --generate-notes -R owner/repo"
    }
  ]
}
\`\`\`

Rules:
- urgentIssues: Only include issues that truly need immediate attention. Max 5.
- duplicateRisks: Group issues that look like they describe the same problem. Only include real matches.
- contributorRisks: Focus on bus factor, review bottlenecks, burnout signals.
- recommendedActions: Ranked by priority. Include gh CLI commands when possible.
- repoHealth score: 0-100 based on bus factor, untriaged issues, stale issues, release cadence.
- Every item must have a nextAction field — tell the maintainer exactly what to do.
- Be concise. This is a daily briefing, not a report.`;

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
            { tool: "query_recent_issues", description: "Fetching recent open issues", run: () => executeTool("query_recent_issues", { owner, repo, limit: 20 }) },
            { tool: "query_closed_issues", description: "Analyzing closed issue patterns", run: () => executeTool("query_closed_issues", { owner, repo }) },
            { tool: "query_repo_labels", description: "Loading repository labels", run: () => executeTool("query_repo_labels", { owner, repo }) },
            { tool: "query_contributor_pr_stats", description: "Analyzing PR contributions", run: () => executeTool("query_contributor_pr_stats", { owner, repo }) },
            { tool: "query_contributor_issue_stats", description: "Analyzing issue contributions", run: () => executeTool("query_contributor_issue_stats", { owner, repo }) },
            { tool: "query_recent_pr_activity", description: "Loading recent PR activity", run: () => executeTool("query_recent_pr_activity", { owner, repo, limit: 50 }) },
            { tool: "query_merged_prs", description: "Fetching merged pull requests", run: () => executeTool("query_merged_prs", { owner, repo, limit: 30 }) },
            { tool: "query_releases", description: "Loading recent releases", run: () => executeTool("query_releases", { owner, repo }) },
          ];

          // Run all 8 queries in parallel
          const results = await Promise.all(tasks.map(async (task) => {
            send("step", { tool: task.tool, description: task.description, status: "running" });
            const result = await task.run();
            const trace = getLastTrace();
            send("step", { tool: task.tool, description: task.description, status: "done" });
            if (trace) send("trace", { tool: task.tool, ...trace });
            return [task.tool, result] as const;
          }));

          send("step", { tool: "synthesize_brief", description: "Generating maintainer brief", status: "running" });

          const data = Object.fromEntries(results);
          const response = await openai.chat.completions.create({
            model: MODEL,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              {
                role: "user",
                content: `Generate a maintainer daily brief for ${owner}/${repo}. Analyze all data and return the structured JSON.\n\n${JSON.stringify(data)}`,
              },
            ],
          });

          send("step", { tool: "synthesize_brief", description: "Generating maintainer brief", status: "done" });
          send("result", { content: response.choices[0]?.message?.content ?? "" });
        } catch (error: any) {
          send("error", { message: error.message || "Brief generation failed" });
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
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
