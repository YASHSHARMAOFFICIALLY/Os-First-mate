"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAgentStream } from "@/hooks/useAgentStream";
import { AgentSteps } from "@/components/shared/AgentSteps";

interface DuplicatePanelProps {
  owner: string;
  repo: string;
}

interface DuplicateData {
  target: { number: number; title: string };
  matches: { issueNumber: number; title: string; similarity: number; explanation: string }[];
  verdict: string;
}

function parseDuplicateResults(content: string): DuplicateData | null {
  const match = content.match(/```json\s*([\s\S]*?)```/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function similarityColor(score: number): string {
  if (score >= 80) return "bg-red-400";
  if (score >= 60) return "bg-orange-400";
  if (score >= 40) return "bg-yellow-400";
  return "bg-gray-300";
}

export function DuplicatePanel({ owner, repo }: DuplicatePanelProps) {
  const [issueNumber, setIssueNumber] = useState("");
  const { steps, content, loading, error, run } = useAgentStream();

  function handleScan(e: React.FormEvent) {
    e.preventDefault();
    const num = parseInt(issueNumber);
    if (!num) return;
    run("/api/duplicates", { owner, repo, issueNumber: num });
  }

  const results = content ? parseDuplicateResults(content) : null;

  return (
    <div className="flex-1 flex flex-col md:flex-row">
      {/* Left: Controls */}
      <div className="w-full md:w-80 p-6 border-b-3 md:border-b-0 md:border-r-3 border-black space-y-4">
        <h2 className="text-lg font-bold">Duplicate Detection</h2>
        <p className="text-sm text-gray-600">
          Enter an issue number to scan for semantically similar existing issues.
        </p>
        <form onSubmit={handleScan} className="space-y-3">
          <input
            type="number"
            value={issueNumber}
            onChange={(e) => setIssueNumber(e.target.value)}
            placeholder="Issue #"
            className="w-full px-4 py-3 brutal-border brutal-shadow-sm bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <button
            type="submit"
            disabled={loading || !issueNumber}
            className="w-full px-4 py-3 bg-cyan-300 brutal-border brutal-shadow font-bold uppercase tracking-wide brutal-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Scanning..." : "Scan for Duplicates"}
          </button>
        </form>

        {steps.length > 0 && (
          <div className="brutal-border p-3 bg-white">
            <AgentSteps steps={steps} />
          </div>
        )}

        {error && (
          <div className="brutal-border p-3 bg-red-100 text-red-800 text-sm font-bold">
            {error}
          </div>
        )}
      </div>

      {/* Right: Results */}
      <div className="flex-1 p-6 overflow-y-auto">
        {!content && !loading && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p className="text-center">Enter an issue number to check for duplicates</p>
          </div>
        )}

        {loading && !content && (
          <div className="flex items-center justify-center h-full">
            <motion.p
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-lg font-bold"
            >
              Agent is comparing issues...
            </motion.p>
          </div>
        )}

        {/* Structured results */}
        {results && (
          <div className="space-y-4">
            {/* Target issue */}
            <div className="brutal-border bg-yellow-100 p-4">
              <span className="font-mono text-xs text-gray-500">Target</span>
              <p className="font-bold">#{results.target.number} — {results.target.title}</p>
            </div>

            {/* Verdict */}
            <div className={`brutal-border p-4 font-bold text-center ${
              results.matches.length > 0 ? "bg-orange-200" : "bg-lime-200"
            }`}>
              {results.verdict}
            </div>

            {/* Matches */}
            {results.matches.map((match, i) => (
              <motion.div
                key={match.issueNumber}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="brutal-border brutal-shadow-sm bg-white p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs text-gray-500">#{match.issueNumber}</span>
                    <p className="font-bold text-sm">{match.title}</p>
                  </div>
                  <span className="text-lg font-bold">{match.similarity}%</span>
                </div>

                {/* Similarity bar */}
                <div className="w-full h-3 bg-gray-200 brutal-border overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${match.similarity}%` }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    className={`h-full ${similarityColor(match.similarity)}`}
                  />
                </div>

                <p className="text-xs text-gray-600">{match.explanation}</p>
              </motion.div>
            ))}

            {results.matches.length === 0 && (
              <p className="text-center text-gray-500 py-4">No duplicates found. This appears to be a unique issue.</p>
            )}
          </div>
        )}

        {/* Fallback raw text */}
        {content && !results && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="brutal-border brutal-shadow bg-white p-6"
          >
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {content}
            </pre>
          </motion.div>
        )}
      </div>
    </div>
  );
}
