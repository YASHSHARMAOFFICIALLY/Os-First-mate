"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAgentStream } from "@/hooks/useAgentStream";
import { AgentSteps } from "@/components/shared/AgentSteps";
import { CoralEvidence } from "@/components/shared/CoralEvidence";
import { RepoBrief } from "./types";

interface BriefPanelProps {
  owner: string;
  repo: string;
}

const GRADE_STYLES: Record<string, { bg: string; text: string }> = {
  A: { bg: "bg-lime-400", text: "text-black" },
  B: { bg: "bg-yellow-400", text: "text-black" },
  C: { bg: "bg-orange-400", text: "text-black" },
  D: { bg: "bg-red-400", text: "text-white" },
  F: { bg: "bg-red-600", text: "text-white" },
};

const PRIORITY_COLORS: Record<string, string> = {
  P0: "bg-red-500 text-white",
  P1: "bg-orange-400 text-black",
  P2: "bg-yellow-400 text-black",
  P3: "bg-gray-300 text-black",
};

function parseBrief(content: string): RepoBrief | null {
  const fenceMatch = content.match(/```json\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1]); } catch { /* fall through */ }
  }
  const braceMatch = content.match(/\{[\s\S]*"repoHealth"[\s\S]*\}/);
  if (braceMatch) {
    try { return JSON.parse(braceMatch[0]); } catch { /* fall through */ }
  }
  return null;
}

function IssueLink({ number, owner, repo }: { number: number; owner: string; repo: string }) {
  return (
    <a
      href={`https://github.com/${owner}/${repo}/issues/${number}`}
      target="_blank"
      rel="noopener noreferrer"
      className="font-mono text-xs text-blue-600 hover:underline"
    >
      #{number}
    </a>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="px-2 py-0.5 text-[10px] font-bold uppercase border-2 border-black bg-white hover:bg-yellow-100 transition-colors"
    >
      {copied ? "Copied!" : label}
    </button>
  );
}

export function BriefPanel({ owner, repo }: BriefPanelProps) {
  const { steps, traces, content, loading, error, run } = useAgentStream();

  function handleBrief() {
    run("/api/brief", { owner, repo });
  }

  const brief = content ? parseBrief(content) : null;

  return (
    <div className="flex-1 flex flex-col md:flex-row">
      {/* Left: Controls */}
      <div className="w-full md:w-80 p-6 border-b-3 md:border-b-0 md:border-r-3 border-black bg-white space-y-4">
        <h2 className="text-lg font-bold">Repo Brief</h2>
        <p className="text-sm text-gray-600">
          Get a complete maintainer briefing: health score, urgent issues, duplicate risks, contributor analysis, and actionable next steps.
        </p>
        <button
          onClick={handleBrief}
          disabled={loading}
          className="w-full px-4 py-3 bg-yellow-400 border-3 border-black font-bold text-sm uppercase tracking-wide brutal-shadow brutal-hover disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Generate Brief"}
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

        {traces.length > 0 && <CoralEvidence traces={traces} />}
      </div>

      {/* Right: Results */}
      <div className="flex-1 p-6 overflow-y-auto">
        {!content && !loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <p className="text-5xl font-bold font-display">Today&apos;s Brief</p>
              <p className="text-gray-500">
                Click &quot;Generate Brief&quot; for a full analysis of {owner}/{repo}
              </p>
            </div>
          </div>
        )}

        {loading && !content && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <motion.p
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-lg font-bold"
              >
                Running 8 Coral queries in parallel...
              </motion.p>
              <p className="text-sm text-gray-500">Scanning issues, PRs, contributors, releases</p>
            </div>
          </div>
        )}

        {brief && (
          <div className="space-y-5">
            {/* Health Score */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="brutal-border brutal-shadow bg-white p-6 flex items-center gap-6"
            >
              <div className={`w-20 h-20 flex items-center justify-center border-3 border-black ${GRADE_STYLES[brief.repoHealth.grade]?.bg || "bg-gray-200"}`}>
                <span className={`text-4xl font-black font-display ${GRADE_STYLES[brief.repoHealth.grade]?.text || ""}`}>
                  {brief.repoHealth.grade}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold">Repo Health</h3>
                  <span className="text-sm font-mono text-gray-500">{brief.repoHealth.score}/100</span>
                </div>
                <p className="text-sm text-gray-700">{brief.repoHealth.summary}</p>
              </div>
            </motion.div>

            {/* Recommended Actions */}
            {brief.recommendedActions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="brutal-border brutal-shadow bg-yellow-50 p-5"
              >
                <h3 className="text-lg font-bold mb-3">What To Do Now</h3>
                <div className="space-y-3">
                  {brief.recommendedActions.map((action, i) => (
                    <div key={i} className="brutal-border bg-white p-3 flex items-start gap-3">
                      <span className="w-7 h-7 flex items-center justify-center bg-yellow-400 border-2 border-black font-bold text-sm shrink-0">
                        {action.priority}
                      </span>
                      <div className="flex-1 space-y-1">
                        <p className="font-bold text-sm">{action.action}</p>
                        <p className="text-xs text-gray-600">{action.reason}</p>
                        {action.command && (
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-[10px] font-mono bg-gray-100 border border-gray-300 px-2 py-1 flex-1 break-all">
                              {action.command}
                            </code>
                            <CopyButton text={action.command} label="Copy" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Urgent Issues */}
            {brief.urgentIssues.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="brutal-border brutal-shadow bg-white p-5"
              >
                <h3 className="text-lg font-bold mb-3">Urgent Issues</h3>
                <div className="space-y-3">
                  {brief.urgentIssues.map((issue) => (
                    <div key={issue.number} className="brutal-border p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <IssueLink number={issue.number} owner={owner} repo={repo} />
                          <p className="font-bold text-sm">{issue.title}</p>
                        </div>
                        <span className={`px-2 py-0.5 text-xs font-bold border-2 border-black ${PRIORITY_COLORS[issue.priority] || "bg-gray-200"}`}>
                          {issue.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{issue.reason}</p>
                      <div className="bg-lime-50 border-2 border-black p-2">
                        <p className="text-[10px] font-bold uppercase text-gray-500 mb-0.5">Next Action</p>
                        <p className="text-xs font-semibold">{issue.nextAction}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Duplicate Clusters */}
            {brief.duplicateRisks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="brutal-border brutal-shadow bg-orange-50 p-5"
              >
                <h3 className="text-lg font-bold mb-3">Duplicate Clusters</h3>
                <div className="space-y-3">
                  {brief.duplicateRisks.map((dup, i) => (
                    <div key={i} className="brutal-border bg-white p-3 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {dup.issues.map((issue) => (
                          <span key={issue.number} className="text-xs font-mono bg-orange-200 border-2 border-black px-2 py-0.5">
                            #{issue.number} {issue.title}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600">{dup.similarity}</p>
                      <div className="bg-lime-50 border-2 border-black p-2">
                        <p className="text-[10px] font-bold uppercase text-gray-500 mb-0.5">Next Action</p>
                        <p className="text-xs font-semibold">{dup.nextAction}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Contributor Risks */}
            {brief.contributorRisks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="brutal-border brutal-shadow bg-red-50 p-5"
              >
                <h3 className="text-lg font-bold mb-3">Contributor Risks</h3>
                <div className="space-y-3">
                  {brief.contributorRisks.map((risk, i) => (
                    <div key={i} className="brutal-border bg-white p-3 space-y-2">
                      <p className="font-bold text-sm">{risk.risk}</p>
                      <p className="text-xs text-gray-600">{risk.detail}</p>
                      <div className="bg-lime-50 border-2 border-black p-2">
                        <p className="text-[10px] font-bold uppercase text-gray-500 mb-0.5">Next Action</p>
                        <p className="text-xs font-semibold">{risk.nextAction}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Rising Contributors */}
            {brief.risingContributors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="brutal-border brutal-shadow bg-lime-50 p-5"
              >
                <h3 className="text-lg font-bold mb-3">Rising Contributors</h3>
                <div className="space-y-2">
                  {brief.risingContributors.map((c, i) => (
                    <div key={i} className="brutal-border bg-white p-3 flex items-center gap-3">
                      <span className="text-lg">&#9733;</span>
                      <div className="flex-1">
                        <p className="font-bold text-sm">@{c.login}</p>
                        <p className="text-xs text-gray-600">{c.recentPrs} recent PRs</p>
                      </div>
                      <p className="text-xs text-gray-700 max-w-[200px]">{c.recommendation}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Release Candidates */}
            {brief.releaseCandidates && brief.releaseCandidates.prCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="brutal-border brutal-shadow bg-pink-50 p-5"
              >
                <h3 className="text-lg font-bold mb-2">Release Candidates</h3>
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-3xl font-black font-display">{brief.releaseCandidates.prCount}</span>
                  <div>
                    <p className="text-sm text-gray-700">PRs merged since <span className="font-mono font-bold">{brief.releaseCandidates.sinceTag}</span></p>
                  </div>
                </div>
                <div className="bg-lime-50 border-2 border-black p-2">
                  <p className="text-[10px] font-bold uppercase text-gray-500 mb-0.5">Next Action</p>
                  <p className="text-xs font-semibold">{brief.releaseCandidates.nextAction}</p>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {content && !brief && (
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
