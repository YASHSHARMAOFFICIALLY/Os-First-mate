import { NextRequest, NextResponse } from "next/server";
import { openai, MODEL } from "@/lib/openai";
import { toolDefinitions, executeTool } from "@/lib/tools";

const SYSTEM_PROMPT = `You are OS First Mate, a helpful AI assistant that helps developers find and prepare for open source contributions.

When a user provides a GitHub repository:
1. First query the repo info to assess its health and activity
2. Then find beginner-friendly issues if asked
3. Query pull requests to gauge how active the maintainers are

When ranking issues for beginners, consider:
- Labels like "good first issue", "beginner", "help wanted"
- How recently the issue was created (newer = more relevant)
- Number of comments (fewer = less complex)

If the user mentions their skills, match issues to those skills based on the repo's language and issue content.

Be encouraging but honest. If a repo looks inactive or unfriendly to contributors, say so.
Keep responses concise and actionable. Use markdown formatting.
Always mention the issue number and title when recommending issues.`;

const MAX_TOOL_ITERATIONS = 5;

export async function POST(req: NextRequest) {
  try {
    const { messages, repoContext, skills } = await req.json();

    const openaiMessages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    if (repoContext || skills?.length) {
      let context = "";
      if (repoContext) context += `Current repo: ${repoContext}\n`;
      if (skills?.length) context += `User's skills: ${skills.join(", ")}\n`;
      openaiMessages.push({ role: "system", content: context });
    }

    for (const msg of messages) {
      openaiMessages.push({ role: msg.role, content: msg.content });
    }

    let response = await openai.chat.completions.create({
      model: MODEL,
      messages: openaiMessages,
      tools: toolDefinitions,
    });

    let iterations = 0;

    while (
      response.choices[0]?.finish_reason === "tool_calls" &&
      response.choices[0]?.message?.tool_calls?.length &&
      iterations < MAX_TOOL_ITERATIONS
    ) {
      iterations++;
      const assistantMessage = response.choices[0].message;
      openaiMessages.push(assistantMessage);

      for (const toolCall of assistantMessage.tool_calls!) {
        if (toolCall.type !== "function") continue;
        const args = JSON.parse(toolCall.function.arguments);
        const result = await executeTool(toolCall.function.name, args);

        openaiMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });
      }

      response = await openai.chat.completions.create({
        model: MODEL,
        messages: openaiMessages,
        tools: toolDefinitions,
      });
    }

    const content = response.choices[0]?.message?.content ?? "";

    return NextResponse.json({ content, citations: [] });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate response" },
      { status: 500 }
    );
  }
}
