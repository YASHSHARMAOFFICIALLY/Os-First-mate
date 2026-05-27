"use client";

import { RepoInfo, HealthVerdict } from "@/lib/types";

interface HealthCardProps {
  repo: RepoInfo;
}

// TODO [YASH]: Implement this function!
// Given a RepoInfo, return a HealthVerdict with score + reasons.
//
// Scoring guidance:
// - "great": active (last commit < 7 days), has CONTRIBUTING.md, many stars
// - "good": active (< 30 days), decent stars, some positive signals
// - "caution": somewhat stale (< 90 days), or missing CONTRIBUTING.md
// - "avoid": stale (> 90 days), or very few issues
//
// reasons: array of strings explaining the verdict
// e.g., ["Last commit 2 days ago", "Has CONTRIBUTING.md", "12.4k stars"]
//
// Think about: what signals would YOU check before contributing to a repo?
function getHealthVerdict(repo: RepoInfo): HealthVerdict {
  // YOUR CODE HERE (5-10 lines)
  return { score: "good", reasons: ["Not yet implemented"] };
}

const VERDICT_STYLES = {
  great: { bg: "bg-lime-300", label: "Great for contributors!" },
  good: { bg: "bg-cyan-300", label: "Good to contribute" },
  caution: { bg: "bg-orange-300", label: "Proceed with caution" },
  avoid: { bg: "bg-pink-300", label: "Not recommended" },
};

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function timeAgo(dateStr: string): string {
  const days = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export function HealthCard({ repo }: HealthCardProps) {
  const verdict = getHealthVerdict(repo);
  const style = VERDICT_STYLES[verdict.score];

  return (
    <div className="brutal-border brutal-shadow bg-white">
      <div className={`${style.bg} px-4 py-2 border-b-3 border-black`}>
        <p className="font-bold text-sm uppercase">{style.label}</p>
      </div>
      <div className="p-4 space-y-3">
        <h3 className="font-bold text-lg truncate">{repo.fullName}</h3>
        {repo.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{repo.description}</p>
        )}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1">
            <span>&#9733;</span>
            <span className="font-bold">{formatStars(repo.stars)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>&#128196;</span>
            <span className="font-bold">{repo.language || "N/A"}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>&#128197;</span>
            <span>{timeAgo(repo.lastCommit)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>&#9888;</span>
            <span>{repo.openIssuesCount} issues</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {repo.hasContributingMd && (
            <span className="px-2 py-1 text-xs font-bold bg-lime-200 brutal-border">
              CONTRIBUTING.md
            </span>
          )}
          {repo.license && (
            <span className="px-2 py-1 text-xs font-bold bg-cyan-200 brutal-border">
              {repo.license}
            </span>
          )}
        </div>
        <div className="pt-2 border-t-2 border-black">
          <ul className="text-xs space-y-1">
            {verdict.reasons.map((r, i) => (
              <li key={i}>&#8226; {r}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
