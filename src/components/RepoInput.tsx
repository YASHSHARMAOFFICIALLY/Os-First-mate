"use client";

import { useState } from "react";

interface RepoInputProps {
  onAnalyze: (owner: string, repo: string) => void;
  isLoading: boolean;
}

export function RepoInput({ onAnalyze, isLoading }: RepoInputProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const match = url.match(
      /(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s#?]+)|^([^/\s]+)\/([^/\s]+)$/
    );
    if (!match) {
      setError("Enter a valid GitHub repo URL or owner/repo");
      return;
    }
    const owner = match[1] || match[3];
    const repo = (match[2] || match[4]).replace(/\.git$/, "");
    onAnalyze(owner, repo);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block text-sm font-bold uppercase tracking-wide">
        GitHub Repo
      </label>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="github.com/vercel/next.js"
        className="w-full px-4 py-3 brutal-border brutal-shadow-sm bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        disabled={isLoading}
      />
      {error && <p className="text-red-600 text-sm font-bold">{error}</p>}
      <button
        type="submit"
        disabled={isLoading || !url.trim()}
        className="w-full px-4 py-3 bg-yellow-400 brutal-border brutal-shadow font-bold uppercase tracking-wide brutal-hover disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Analyzing..." : "Analyze"}
      </button>
    </form>
  );
}
