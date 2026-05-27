"use client";

import { useState } from "react";
import { RepoInfo } from "@/lib/types";
import { RepoInput } from "@/components/RepoInput";
import { HealthCard } from "@/components/HealthCard";
import { SkillsInput } from "@/components/SkillsInput";
import { ChatPanel } from "@/components/ChatPanel";
import { useChat } from "@/hooks/useChat";

export default function Home() {
  const [repo, setRepo] = useState<RepoInfo | null>(null);
  const [repoLoading, setRepoLoading] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const { messages, isLoading, sendMessage, clearMessages } = useChat();

  async function handleAnalyze(owner: string, repoName: string) {
    setRepoLoading(true);
    clearMessages();
    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}`,
        { headers: { Accept: "application/vnd.github.v3+json" } }
      );
      if (!res.ok) throw new Error("Repo not found");
      const data = await res.json();

      const contribRes = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/contents/CONTRIBUTING.md`,
        { headers: { Accept: "application/vnd.github.v3+json" } }
      );

      const repoInfo: RepoInfo = {
        name: data.name,
        fullName: data.full_name,
        description: data.description,
        stars: data.stargazers_count,
        language: data.language,
        lastCommit: data.pushed_at,
        hasContributingMd: contribRes.ok,
        openIssuesCount: data.open_issues_count,
        license: data.license?.spdx_id ?? null,
        defaultBranch: data.default_branch,
      };
      setRepo(repoInfo);

      // Auto-send first message to agent
      sendMessage(
        `I want to contribute to ${repoInfo.fullName}. Can you check this repo's health and find me some beginner-friendly issues?`,
        repoInfo.fullName,
        skills
      );
    } catch {
      alert("Could not find that repo. Check the URL and try again.");
    } finally {
      setRepoLoading(false);
    }
  }

  function handleSendMessage(content: string) {
    sendMessage(content, repo?.fullName, skills);
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b-3 border-black bg-yellow-400">
        <h1 className="text-2xl font-bold tracking-tight">OS First Mate</h1>
        <p className="text-sm">Your AI crew for open source contributions</p>
      </header>

      {/* Two-panel layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left panel — sidebar */}
        <aside className="w-full md:w-80 md:min-w-80 p-4 space-y-6 border-b-3 md:border-b-0 md:border-r-3 border-black bg-amber-50 overflow-y-auto">
          <RepoInput onAnalyze={handleAnalyze} isLoading={repoLoading} />
          {repo && <HealthCard repo={repo} />}
          <SkillsInput skills={skills} onSkillsChange={setSkills} />
        </aside>

        {/* Right panel — chat */}
        <section className="flex-1 flex flex-col min-h-[60vh] md:min-h-0">
          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </section>
      </div>
    </main>
  );
}
