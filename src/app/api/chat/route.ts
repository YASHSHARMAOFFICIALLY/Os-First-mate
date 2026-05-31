import { NextRequest, NextResponse } from "next/server";
import { openai, MODEL } from "@/server/openai";
import { toolDefinitions, executeTool } from "@/server/github/tools";
import { errorMessage } from "@/server/errors";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const SYSTEM_PROMPT = `You are OS First Mate, an AI assistant for open source maintainers.

You help with:
- Issue triage: suggesting labels, priority, and assignees for open issues
- Duplicate detection: finding semantically similar issues
- Release notes: generating changelogs from merged PRs
- General repo analysis: answering questions about issues, PRs, and releases

You have tools to query GitHub data via Coral SQL. Use them to answer questions with real data.
Keep responses concise and actionable. Use markdown formatting.
Always reference issue/PR numbers when discussing specific items.`;

const MAX_TOOL_ITERATIONS = 5;

interface ChatRequestBody {
  messages: { role: "user" | "assistant"; content: string }[];
  repoContext?: string;
  skills?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const { messages, repoContext, skills } = (await req.json()) as ChatRequestBody;

    const openaiMessages: ChatCompletionMessageParam[] = [
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
          content: result.data,
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
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: errorMessage(error, "Failed to generate response") },
      { status: 500 }
    );
  }
}
