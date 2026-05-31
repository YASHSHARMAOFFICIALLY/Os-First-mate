import { NextRequest } from "next/server";
import { runAgentStream } from "@/lib/agent";

const SYSTEM_PROMPT = `You are a duplicate issue detector for open source repos.

When given an issue number:
1. Call query_single_issue to get the target issue's full details
2. Call query_open_issues to get other open issues for comparison
3. Call query_closed_issues to check if this was already fixed

Compare the target issue SEMANTICALLY against all candidates. Two issues are duplicates if they describe the same underlying problem, even with different wording.

IMPORTANT: Return your response as JSON wrapped in \`\`\`json code fence:
\`\`\`json
{"target": {"number": 123, "title": "..."}, "matches": [{"issueNumber": 456, "title": "...", "similarity": 85, "explanation": "Both describe..."}], "verdict": "Likely duplicate of #456"}
\`\`\`

Only include matches with similarity >= 40. If no duplicates found, return empty matches array with verdict "Appears unique".`;

export async function POST(req: NextRequest) {
  try {
    const { owner, repo, issueNumber } = await req.json();
    if (!owner || !repo || !issueNumber) {
      return new Response(JSON.stringify({ error: "owner, repo, and issueNumber required" }), { status: 400 });
    }

    const stream = runAgentStream(
      SYSTEM_PROMPT,
      `Check if issue #${issueNumber} in ${owner}/${repo} is a duplicate of any existing issue.`
    );

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
