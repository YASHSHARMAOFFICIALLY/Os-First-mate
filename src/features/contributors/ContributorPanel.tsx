"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAgentStream } from "@/hooks/useAgentStream";
import { AgentSteps } from "@/components/shared/AgentSteps";
import { CoralEvidence } from "@/components/shared/CoralEvidence";
import { ContributorStats } from "./types";

interface ContributorPanelProps {
  owner: string;
  repo: string;
}

const RISK_STYLES: Record<string, { bg: string; badge: string; badgeText: string }> = {
  critical: { bg: "bg-red-50", badge: "bg-red-500 text-white", badgeText: "CRITICAL" },
  high: { bg: "bg-orange-50", badge: "bg-orange-400 text-black", badgeText: "HIGH RISK" },
  medium: { bg: "bg-yellow-50", badge: "bg-yellow-400 text-black", badgeText: "MEDIUM" },
  low: { bg: "bg-lime-50", badge: "bg-lime-400 text-black", badgeText: "LOW" },
};

function parseContributorStats(content: string): ContributorStats | null {
  const fenceMatch = content.match(/```json\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1]); } catch { /* fall through */ }
  }
  const braceMatch = content.match(/\{[\s\S]*"busFactor"[\s\S]*\}/);
  if (braceMatch) {
    try { return JSON.parse(braceMatch[0]); } catch { /* fall through */ }
  }
  return null;
}

function getBarColor(percentage: number): string {
  if (percentage > 70) return "bg-red-400";
  if (percentage > 50) return "bg-orange-400";
  if (percentage > 30) return "bg-yellow-400";
  return "bg-lime-400";
}

export function ContributorPanel({ owner, repo }: ContributorPanelProps) {
  const { steps, traces, content, loading, error, run } = useAgentStream();
  const [copied, setCopied] = useState(false);

  function handleAnalyze() {
    run("/api/contributors", { owner, repo });
  }

  function handleCopy() {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const stats = content ? parseContributorStats(content) : null;

  return (
    <div className="flex-1 flex flex-col md:flex-row">
      {/* Left: Controls */}
      <div className="w-full md:w-80 p-6 border-b-3 md:border-b-0 md:border-r-3 border-black bg-white space-y-4">
        <h2 className="text-lg font-bold">Project Health</h2>
        <p className="text-sm text-gray-600">
          Bus factor, review bottlenecks, burnout risk, and rising star contributors.
        </p>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full px-4 py-3 bg-orange-400 border-3 border-black font-bold text-sm uppercase tracking-wide brutal-shadow brutal-hover disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze Health"}
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
            <p className="text-center text-gray-500">
              Click &quot;Analyze Health&quot; to scan {owner}/{repo}
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
              Analyzing contributor patterns...
            </motion.p>
          </div>
        )}

        {stats && (
          <div className="space-y-5">
            {/* Bus Factor Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`brutal-border brutal-shadow p-6 ${RISK_STYLES[stats.busFactor.risk]?.bg || "bg-white"}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Bus Factor</h3>
                <span className={`px-2 py-0.5 text-xs font-bold border-2 border-black ${RISK_STYLES[stats.busFactor.risk]?.badge || "bg-gray-200"}`}>
                  {RISK_STYLES[stats.busFactor.risk]?.badgeText || stats.busFactor.risk}
                </span>
              </div>
              <div className="flex items-end gap-6">
                <div className="text-6xl font-black font-display">{stats.busFactor.score}</div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-gray-700">
                    <span className="font-bold">{stats.busFactor.topContributor}</span> handles{" "}
                    <span className="font-bold">{stats.busFactor.percentage}%</span> of merged PRs
                  </p>
                  <div className="h-3 bg-gray-200 border-2 border-black overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.busFactor.percentage}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full ${getBarColor(stats.busFactor.percentage)}`}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Review Bottleneck */}
            {stats.reviewBottleneck && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="brutal-border brutal-shadow bg-amber-50 p-5"
              >
                <h3 className="text-lg font-bold mb-2">Review Bottleneck</h3>
                <p className="text-sm text-gray-700 mb-2">{stats.reviewBottleneck.bottleneck}</p>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl font-black font-display">{stats.reviewBottleneck.avgWaitDays}d</span>
                  <span className="text-xs text-gray-500">avg wait for review</span>
                </div>
                <div className="bg-lime-50 border-2 border-black p-2">
                  <p className="text-[10px] font-bold uppercase text-gray-500 mb-0.5">Next Action</p>
                  <p className="text-xs font-semibold">{stats.reviewBottleneck.suggestion}</p>
                </div>
              </motion.div>
            )}

            {/* Burnout Risk */}
            {stats.burnoutRisk && stats.burnoutRisk.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="brutal-border brutal-shadow bg-red-50 p-5"
              >
                <h3 className="text-lg font-bold mb-3">Burnout Risk</h3>
                <div className="space-y-3">
                  {stats.burnoutRisk.map((risk, i) => (
                    <div key={i} className="brutal-border bg-white p-3 space-y-2">
                      <p className="font-bold text-sm">{risk.contributor}</p>
                      <p className="text-xs text-gray-600">{risk.signal}</p>
                      <div className="bg-lime-50 border-2 border-black p-2">
                        <p className="text-[10px] font-bold uppercase text-gray-500 mb-0.5">Next Action</p>
                        <p className="text-xs font-semibold">{risk.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Top Contributors */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="brutal-border brutal-shadow bg-white p-5"
            >
              <h3 className="text-lg font-bold mb-4">Top Contributors</h3>
              <div className="space-y-3">
                {stats.topContributors.map((c, i) => {
                  const maxPrs = stats.topContributors[0]?.prs || 1;
                  return (
                    <motion.div
                      key={c.login}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <span className="w-6 text-sm font-bold text-gray-400">#{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm">@{c.login}</span>
                          <span className="text-[10px] px-2 py-0.5 font-bold bg-blue-200 border-2 border-black">{c.role}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2.5 bg-gray-200 border border-black overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(c.prs / maxPrs) * 100}%` }}
                              transition={{ duration: 0.6, delay: 0.25 + i * 0.05 }}
                              className="h-full bg-orange-400"
                            />
                          </div>
                          <span className="text-[10px] font-mono text-gray-500 w-24 text-right">
                            {c.prs} PRs / {c.issues} issues
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Rising Stars */}
            {stats.risingStars.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="brutal-border brutal-shadow bg-lime-50 p-5"
              >
                <h3 className="text-lg font-bold mb-3">Rising Stars</h3>
                <div className="space-y-3">
                  {stats.risingStars.map((star, i) => (
                    <motion.div
                      key={star.login}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + i * 0.05 }}
                      className="brutal-border bg-white p-3 flex items-center gap-3"
                    >
                      <span className="text-lg">&#9733;</span>
                      <div>
                        <p className="font-bold text-sm">@{star.login}</p>
                        <p className="text-xs text-gray-600">{star.recentPrs} recent PRs — {star.trend}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* AI Insights */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="brutal-border brutal-shadow bg-white p-5"
            >
              <h3 className="text-lg font-bold mb-3">Insights</h3>
              <ul className="space-y-2">
                {stats.insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 font-bold">&#8226;</span>
                    <span className="text-gray-700">{insight}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="brutal-border brutal-shadow bg-yellow-50 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold">Recommendations</h3>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1 text-[10px] font-bold uppercase border-2 border-black bg-white hover:bg-yellow-100 transition-colors"
                >
                  {copied ? "Copied!" : "Copy Report"}
                </button>
              </div>
              <ol className="space-y-2 list-decimal list-inside">
                {stats.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-gray-700">{rec}</li>
                ))}
              </ol>
            </motion.div>
          </div>
        )}

        {content && !stats && (
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
