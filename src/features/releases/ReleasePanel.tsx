"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAgentStream } from "@/hooks/useAgentStream";
import { AgentSteps } from "@/components/shared/AgentSteps";
import { CoralEvidence } from "@/components/shared/CoralEvidence";

interface ReleasePanelProps {
  owner: string;
  repo: string;
}

function highlightText(text: string): React.ReactNode[] {
  const parts = text.split(/(#\d+|@\w+)/g);
  return parts.map((part, j) => {
    if (part.match(/^#\d+$/)) return <span key={j} className="font-mono text-xs font-bold text-blue-600">{part}</span>;
    if (part.match(/^@\w+$/)) return <span key={j} className="font-semibold">{part}</span>;
    return <span key={j}>{part}</span>;
  });
}

function renderMarkdownLine(line: string, i: number) {
  if (line.startsWith("### ")) return <h4 key={i} className="font-bold text-sm mt-4 mb-1 text-orange-600">{line.slice(4)}</h4>;
  if (line.startsWith("## ")) return <h3 key={i} className="font-bold text-base mt-2 mb-2">{line.slice(3)}</h3>;
  if (line.startsWith("> ")) return <p key={i} className="text-sm text-gray-600 brutal-border bg-yellow-50 px-3 py-2 mb-3">{line.slice(2)}</p>;
  if (line.startsWith("- ")) {
    return <li key={i} className="text-sm ml-4 list-disc text-gray-700">{highlightText(line.slice(2))}</li>;
  }
  if (line.trim() === "") return <div key={i} className="h-2" />;
  return <p key={i} className="text-sm text-gray-700">{line}</p>;
}

export function ReleasePanel({ owner, repo }: ReleasePanelProps) {
  const { steps, traces, content, loading, error, run } = useAgentStream();
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedSlack, setCopiedSlack] = useState(false);

  function handleGenerate() {
    run("/api/releases", { owner, repo });
  }

  function handleCopyMarkdown() {
    navigator.clipboard.writeText(markdownContent);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  }

  function handleCopySlack() {
    navigator.clipboard.writeText(slackSummary);
    setCopiedSlack(true);
    setTimeout(() => setCopiedSlack(false), 2000);
  }

  const slackSplit = content.split("---SLACK---");
  const markdownContent = slackSplit[0]?.trim() || "";
  const slackSummary = slackSplit[1]?.trim() || "";
  const markdownLines = markdownContent.split("\n");

  return (
    <div className="flex-1 flex flex-col md:flex-row">
      {/* Left: Controls */}
      <div className="w-full md:w-80 p-6 border-b-3 md:border-b-0 md:border-r-3 border-black bg-white space-y-4">
        <h2 className="text-lg font-bold">Release Notes</h2>
        <p className="text-sm text-gray-600">
          Generate a changelog from merged PRs since the last release. Get markdown for GitHub and a summary for Slack.
        </p>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full px-4 py-3 bg-pink-400 border-3 border-black font-bold text-sm uppercase tracking-wide brutal-shadow brutal-hover disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Release Notes"}
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

        {slackSummary && (
          <div className="brutal-border brutal-shadow-sm bg-purple-50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600">Slack Preview</p>
              <button
                onClick={handleCopySlack}
                className="px-2 py-0.5 text-[10px] font-bold uppercase border-2 border-black bg-white hover:bg-purple-100 transition-colors"
              >
                {copiedSlack ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="brutal-border bg-white p-3 text-sm space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="font-bold text-[10px] text-gray-500">OS First Mate</span>
              </div>
              <p className="pl-4 text-gray-700">{slackSummary}</p>
            </div>
          </div>
        )}

        {traces.length > 0 && <CoralEvidence traces={traces} />}
      </div>

      {/* Right: Results */}
      <div className="flex-1 p-6 overflow-y-auto">
        {!content && !loading && (
          <div className="flex items-center justify-center h-full">
            <p className="text-center text-gray-500">
              Click &quot;Generate Release Notes&quot; for {owner}/{repo}
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
              Agent is generating release notes...
            </motion.p>
          </div>
        )}

        {markdownContent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="bg-lime-50 border-2 border-black p-2 flex-1 mr-3">
                <p className="text-[10px] font-bold uppercase text-gray-500 mb-0.5">Next Action</p>
                <p className="text-xs font-semibold">Review the notes below, then paste into your GitHub release.</p>
              </div>
              <button
                onClick={handleCopyMarkdown}
                className="px-3 py-1.5 text-xs font-bold uppercase bg-yellow-400 border-3 border-black brutal-hover shrink-0"
              >
                {copiedMd ? "Copied!" : "Copy for GitHub"}
              </button>
            </div>
            <div className="brutal-border brutal-shadow bg-white p-6">
              <div className="space-y-0">
                {markdownLines.map((line, i) => renderMarkdownLine(line, i))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
