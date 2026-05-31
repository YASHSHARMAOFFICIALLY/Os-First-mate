"use client";

import { useState } from "react";

interface RepoSelectorProps {
  onSubmit: (owner: string, repo: string) => void;
  currentRepo?: string;
}

export function RepoSelector({ onSubmit, currentRepo }: RepoSelectorProps) {
  const [url, setUrl] = useState(currentRepo ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const match = url.match(
      /(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s#?]+)|^([^/\s]+)\/([^/\s]+)$/
    );
    if (!match) return;
    const owner = match[1] || match[3];
    const repo = (match[2] || match[4]).replace(/\.git$/, "");
    onSubmit(owner, repo);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="owner/repo"
        className="px-3 py-2 brutal-border bg-white font-mono text-sm w-56 focus:outline-none focus:ring-2 focus:ring-yellow-600"
      />
      <button
        type="submit"
        disabled={!url.trim()}
        className="px-4 py-2 bg-black text-yellow-400 font-bold text-sm uppercase brutal-hover disabled:opacity-50"
      >
        Load
      </button>
      {currentRepo && (
        <span className="text-sm font-mono font-bold">{currentRepo}</span>
      )}
    </form>
  );
}
