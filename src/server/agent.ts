import { openai, MODEL } from "./openai";
import { toolDefinitions, executeTool } from "./github/tools";
import { AgentStep } from "@/types/agent";
import { errorMessage } from "@/server/errors";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const MAX_ITERATIONS = 1;

// Human-readable descriptions for each tool
const TOOL_DESCRIPTIONS: Record<string, string> = {
  query_recent_issues: "Fetching recent open issues",
  query_repo_labels: "Loading repository labels",
  query_closed_issues: "Analyzing closed issue patterns",
  query_single_issue: "Fetching issue details",
  query_open_issues: "Loading open issues for comparison",
  query_merged_prs: "Fetching merged pull requests",
  query_releases: "Loading recent releases",
  query_contributor_pr_stats: "Analyzing PR contributions by author",
  query_contributor_issue_stats: "Analyzing issue contributions by author",
  query_recent_pr_activity: "Loading recent PR activity",
};

interface AgentResult {
  content: string;
  steps: AgentStep[];
}

// Non-streaming version (kept for simplicity)
export async function runAgent(
  systemPrompt: string,
  userMessage: string
): Promise<AgentResult> {
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  const steps: AgentStep[] = [];

  let response = await openai.chat.completions.create({
    model: MODEL,
    messages,
    tools: toolDefinitions,
  });

  let iterations = 0;

  while (
    response.choices[0]?.finish_reason === "tool_calls" &&
    response.choices[0]?.message?.tool_calls?.length &&
    iterations < MAX_ITERATIONS
  ) {
    iterations++;
    const assistantMessage = response.choices[0].message;
    messages.push(assistantMessage);

    for (const toolCall of assistantMessage.tool_calls!) {
      if (toolCall.type !== "function") continue;

      const step: AgentStep = {
        tool: toolCall.function.name,
        description: TOOL_DESCRIPTIONS[toolCall.function.name] || toolCall.function.name,
        status: "done",
      };
      steps.push(step);

      const args = JSON.parse(toolCall.function.arguments);
      const result = await executeTool(toolCall.function.name, args);

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result,
      });
    }

    response = await openai.chat.completions.create({
      model: MODEL,
      messages,
      tools: toolDefinitions,
    });
  }

  const content = response.choices[0]?.message?.content ?? "";
  return { content, steps };
}

// Streaming version — sends SSE events as the agent works
export function runAgentStream(
  systemPrompt: string,
  userMessage: string
): ReadableStream {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      }

      try {
        const messages: ChatCompletionMessageParam[] = [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ];

        send("status", { message: "Starting analysis..." });

        let response = await openai.chat.completions.create({
          model: MODEL,
          messages,
          tools: toolDefinitions,
        });

        let iterations = 0;

        while (
          response.choices[0]?.finish_reason === "tool_calls" &&
          response.choices[0]?.message?.tool_calls?.length &&
          iterations < MAX_ITERATIONS
        ) {
          iterations++;
          const assistantMessage = response.choices[0].message;
          messages.push(assistantMessage);

          for (const toolCall of assistantMessage.tool_calls!) {
            if (toolCall.type !== "function") continue;

            const toolName = toolCall.function.name;
            const description = TOOL_DESCRIPTIONS[toolName] || toolName;

            // Send "running" step
            send("step", { tool: toolName, description, status: "running" });

            const args = JSON.parse(toolCall.function.arguments);
            const result = await executeTool(toolName, args);

            // Send "done" step
            send("step", { tool: toolName, description, status: "done" });

            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: result,
            });
          }

          send("status", { message: "Agent is thinking..." });

          response = await openai.chat.completions.create({
            model: MODEL,
            messages,
            tools: toolDefinitions,
          });
        }

        const content = response.choices[0]?.message?.content ?? "";
        send("result", { content });
      } catch (error: unknown) {
        send("error", { message: errorMessage(error, "Agent failed") });
      } finally {
        controller.close();
      }
    },
  });
}
