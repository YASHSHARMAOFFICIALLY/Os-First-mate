import { NextRequest } from "next/server";
import { openai, MODEL } from "@/lib/openai";
import { executeTool, getLastTrace } from "@/lib/tools";

const SYSTEM_PROMPT = `You are an expert issue triage assistant for open source maintainers.

You will receive pre-fetched data: repo labels, recently closed issues (for pattern learning), and recent open issues to triage.

For each open issue, provide:
- **suggestedLabels**: ONLY from the repo's actual label set. Match patterns from closed issues.
- **priority**: Based on impact:
  - P0: App crashes, data loss, security vulnerability, blocking release
  - P1: Major feature broken, significant regression, affects many users
  - P2: Minor bug, feature request with clear value, moderate impact
  - P3: Cosmetic, nice-to-have, low impact improvement
- **assignee**: Based on who resolved similar issues (from closed issue data). Use "@username" format.
- **reasoning**: 1-2 sentences explaining WHY this priority and these labels.
- **evidence**: Array of closed issue numbers that are similar (helped inform your suggestion).
- **suggestedResponse**: A brief first-responder reply the maintainer can post (1-3 sentences, helpful and welcoming).
- **nextAction**: One concrete sentence telling the maintainer what to do RIGHT NOW with this issue.

Return ONLY a JSON array in a code fence:
\`\`\`json
[{
  "issueNumber": 123,
  "title": "Issue title",
  "suggestedLabels": ["bug", "area/router"],
  "priority": "P1",
  "assignee": "@username",
  "reasoning": "Crash affecting RSC hydration, similar to #100 and #95 which were P1 bugs.",
  "evidence": [100, 95],
  "suggestedResponse": "Thanks for reporting this! This looks like a hydration issue. Could you share your Next.js version and a minimal reproduction?",
  "nextAction": "Label as bug + area/router, assign to @alice, and ask for reproduction steps."
}]
\`\`\`

Rules:
- Use ONLY labels that exist in the repo. Never invent labels.
- Reference specific closed issues as evidence when possible.
- Be conservative with P0 — reserve for truly critical issues.
- nextAction must be specific and actionable — tell the maintainer exactly what to do.`;

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
              tool: "query_repo_labels",
              description: "Loading repository labels",
              run: () => executeTool("query_repo_labels", { owner, repo }),
            },
            {
              tool: "query_closed_issues",
              description: "Analyzing closed issue patterns",
              run: () => executeTool("query_closed_issues", { owner, repo }),
            },
            {
              tool: "query_recent_issues",
              description: "Fetching recent open issues",
              run: () => executeTool("query_recent_issues", { owner, repo, limit: 8 }),
            },
          ];

          const results = await Promise.all(tasks.map(async (task) => {
            send("step", { tool: task.tool, description: task.description, status: "running" });
            const result = await task.run();
            const trace = getLastTrace();
            send("step", { tool: task.tool, description: task.description, status: "done" });
            if (trace) send("trace", { tool: task.tool, ...trace });
            return [task.tool, result] as const;
          }));

          send("step", { tool: "synthesize_triage", description: "Generating triage suggestions", status: "running" });

          const data = Object.fromEntries(results);
          const response = await openai.chat.completions.create({
            model: MODEL,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              {
                role: "user",
                content: `Using this Coral query data for ${owner}/${repo}, triage the recent open issues. Do not call tools. Return only the requested JSON code fence.\n\n${JSON.stringify(data)}`,
              },
            ],
          });

          send("step", { tool: "synthesize_triage", description: "Generating triage suggestions", status: "done" });
          send("result", { content: response.choices[0]?.message?.content ?? "" });
        } catch (error: any) {
          send("error", { message: error.message || "Triage failed" });
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
