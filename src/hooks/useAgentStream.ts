"use client";

import { useState, useCallback } from "react";
import { AgentStep, CoralTrace } from "@/types/agent";

interface UseAgentStreamReturn {
  steps: AgentStep[];
  traces: CoralTrace[];
  content: string;
  loading: boolean;
  error: string | null;
  run: (url: string, body: Record<string, unknown>) => void;
}

export function useAgentStream(): UseAgentStreamReturn {
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [traces, setTraces] = useState<CoralTrace[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback((url: string, body: Record<string, unknown>) => {
    setSteps([]);
    setTraces([]);
    setContent("");
    setError(null);
    setLoading(true);

    // Use fetch + ReadableStream to consume SSE
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        if (!res.ok || !res.body) {
          throw new Error(`API error: ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events from buffer
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          let currentEvent = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEvent = line.slice(7);
            } else if (line.startsWith("data: ")) {
              const data = JSON.parse(line.slice(6));

              if (currentEvent === "step") {
                setSteps((prev) => {
                  // Update existing step or add new one
                  const existing = prev.findIndex(
                    (s) => s.tool === data.tool && s.status === "running"
                  );
                  if (existing >= 0 && data.status === "done") {
                    const updated = [...prev];
                    updated[existing] = data;
                    return updated;
                  }
                  if (data.status === "running") {
                    return [...prev, data];
                  }
                  return prev;
                });
              } else if (currentEvent === "trace") {
                setTraces((prev) => [...prev, data]);
              } else if (currentEvent === "result") {
                setContent(data.content);
              } else if (currentEvent === "error") {
                setError(data.message);
              }
            }
          }
        }
      })
      .catch((err) => {
        setError(err.message || "Connection failed");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { steps, traces, content, loading, error, run };
}
