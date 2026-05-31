"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAgentStream } from "@/hooks/useAgentStream";
import { AgentSteps } from "@/components/shared/AgentSteps";
import { CoralEvidence } from "@/components/shared/CoralEvidence";
import { TriageResult } from "./types";

interface TriagePanelProps {
  owner: string;
  repo: string;
}

const PRIORITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  P0: { bg: "bg-red-500", text: "text-white", border: "border-l-red-500" },
  P1: { bg: "bg-orange-400", text: "text-black", border: "border-l-orange-400" },
  P2: { bg: "bg-yellow-400", text: "text-black", border: "border-l-yellow-400" },
  P3: { bg: "bg-gray-300", text: "text-black", border: "border-l-gray-300" },
};

function parseTriageResults(content: string): TriageResult[] | null {
  const fenceMatch = content.match(/```json\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1]); } catch { /* fall through */ }
  }
  const arrayMatch = content.match(/\[[\s\S]*"issueNumber"[\s\S]*\]/);
  if (arrayMatch) {
    try { return JSON.parse(arrayMatch[0]); } catch { /* fall through */ }
  }
  return null;
}

function buildCliCommand(item: TriageResult, owner: string, repo: string): string {
  const parts = [`gh issue edit ${item.issueNumber} -R ${owner}/${repo}`];
  for (const label of item.suggestedLabels) {
    parts.push(`--add-label "${label}"`);
  }
  if (item.assignee) {
    parts.push(`--add-assignee "${item.assignee.replace("@", "")}"`);
  }
  return parts.join(" ");
}

export function TriagePanel({ owner, repo }: TriagePanelProps) {
  const { steps, traces, content, loading, error, run } = useAgentStream();
  const [expandedResponse, setExpandedResponse] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  function handleTriage() {
    run("/api/triage", { owner, repo });
  }

  function handleCopyCli(item: TriageResult) {
    navigator.clipboard.writeText(buildCliCommand(item, owner, repo));
    setCopiedId(item.issueNumber);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const results = content ? parseTriageResults(content) : null;

  const grouped = results ? {
    P0: results.filter(r => r.priority === "P0"),
    P1: results.filter(r => r.priority === "P1"),
    P2: results.filter(r => r.priority === "P2"),
    P3: results.filter(r => r.priority === "P3"),
  } : null;

  return (
    <div className="flex-1 flex flex-col md:flex-row">
      {/* Left: Controls */}
      <div className="w-full md:w-80 p-6 border-b-3 md:border-b-0 md:border-r-3 border-black bg-white space-y-4">
        <h2 className="text-lg font-bold">Smart Issue Triage</h2>
        <p className="text-sm text-gray-600">
          AI-powered triage with evidence from past issues. Get labels, priority, assignee suggestions, and first-responder drafts.
        </p>
        <button
          onClick={handleTriage}
          disabled={loading}
          className="w-full px-4 py-3 bg-lime-400 border-3 border-black font-bold text-sm uppercase tracking-wide brutal-shadow brutal-hover disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Triage Issues"}
        </button>

        {steps.length > 0 && (
          <div className="brutal-border brutal-shadow-sm bg-white p-3">
            <AgentSteps steps={steps} />
          </div>
        )}

        {error && (
          <div className="brutal-border bg-red-50 p-3 text-red-700 text-sm font-semibold">
            {error}
          </div>
        )}

        {grouped && (
          <div className="brutal-border brutal-shadow-sm bg-white p-3 space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Priority Summary</p>
            {(["P0", "P1", "P2", "P3"] as const).map(p => {
              const style = PRIORITY_STYLES[p];
              return (
                <div key={p} className="flex items-center gap-2">
                  <span className={`w-8 text-center text-[10px] font-bold ${style.bg} ${style.text} border-2 border-black px-1 py-0.5`}>{p}</span>
                  <span className="text-sm text-gray-600">{grouped[p].length} issue{grouped[p].length !== 1 ? "s" : ""}</span>
                </div>
              );
            })}
          </div>
        )}

        {traces.length > 0 && <CoralEvidence traces={traces} />}
      </div>

      {/* Right: Results */}
      <div className="flex-1 p-6 overflow-y-auto">
        {!content && !loading && (
          <div className="flex items-center justify-center h-full">
            <p className="text-center text-gray-500">
              Click &quot;Triage Issues&quot; to analyze {owner}/{repo}
            </p>
          </div>
        )}

        {loading && !content && (
          <div className="flex items-center justify-center h-full">
            <motion.p
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-lg font-bold"
            >
              Agent is analyzing issues...
            </motion.p>
          </div>
        )}

        {results && (
          <div className="space-y-4">
            {results.map((item, i) => {
              const style = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.P3;
              return (
                <motion.div
                  key={item.issueNumber}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`brutal-border brutal-shadow bg-white p-4 space-y-3 border-l-[6px] ${style.border}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <span className="font-mono text-xs text-gray-400">#{item.issueNumber}</span>
                      <h3 className="font-bold text-sm">{item.title}</h3>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-bold ${style.bg} ${style.text} border-2 border-black`}>
                      {item.priority}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {item.suggestedLabels.map((label) => (
                      <span key={label} className="px-2 py-0.5 text-[10px] font-bold bg-lime-300 border-2 border-black">
                        {label}
                      </span>
                    ))}
                  </div>

                  {item.evidence && item.evidence.length > 0 && (
                    <div className="bg-blue-50 border-2 border-black p-2">
                      <p className="text-[10px] font-bold uppercase text-gray-500 mb-0.5">Evidence</p>
                      <p className="text-xs text-gray-700">
                        Similar to {item.evidence.map(n => `#${n}`).join(", ")} — {item.reasoning}
                      </p>
                    </div>
                  )}

                  {!item.evidence?.length && (
                    <p className="text-xs text-gray-500 italic">{item.reasoning}</p>
                  )}

                  {item.assignee && (
                    <p className="text-xs text-gray-600">
                      Assign to: <span className="font-bold text-black">{item.assignee}</span>
                    </p>
                  )}

                  {/* Next Action — always visible */}
                  {item.nextAction && (
                    <div className="bg-lime-50 border-2 border-black p-2">
                      <p className="text-[10px] font-bold uppercase text-gray-500 mb-0.5">Next Action</p>
                      <p className="text-xs font-semibold">{item.nextAction}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleCopyCli(item)}
                      className="px-2 py-1 text-[10px] font-bold uppercase border-2 border-black bg-white hover:bg-yellow-100 transition-colors"
                    >
                      {copiedId === item.issueNumber ? "Copied!" : "Copy CLI"}
                    </button>
                    {item.suggestedResponse && (
                      <button
                        onClick={() => setExpandedResponse(expandedResponse === item.issueNumber ? null : item.issueNumber)}
                        className="px-2 py-1 text-[10px] font-bold uppercase border-2 border-black bg-yellow-400 hover:bg-yellow-300 transition-colors"
                      >
                        {expandedResponse === item.issueNumber ? "Hide Reply" : "Suggested Comment"}
                      </button>
                    )}
                  </div>

                  {expandedResponse === item.issueNumber && item.suggestedResponse && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="brutal-border bg-yellow-50 p-3 space-y-2"
                    >
                      <p className="text-[10px] font-bold uppercase text-gray-500">Suggested Comment</p>
                      <p className="text-sm">{item.suggestedResponse}</p>
                      <button
                        onClick={() => { navigator.clipboard.writeText(item.suggestedResponse!); }}
                        className="px-2 py-0.5 text-[10px] font-bold uppercase border-2 border-black bg-white hover:bg-yellow-100 transition-colors"
                      >
                        Copy Comment
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {content && !results && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="brutal-border brutal-shadow bg-white p-6"
          >
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700">
              {content}
            </pre>
          </motion.div>
        )}
      </div>
    </div>
  );
}
