"use client";

import { useState } from "react";
import { Tab } from "@/lib/types";
import { TabBar } from "@/components/TabBar";
import { RepoSelector } from "@/components/RepoSelector";
import { TriagePanel } from "@/components/triage/TriagePanel";
import { DuplicatePanel } from "@/components/duplicates/DuplicatePanel";
import { ReleasePanel } from "@/components/releases/ReleasePanel";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("triage");
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");

  const hasRepo = owner !== "" && repo !== "";

  function handleRepoSubmit(o: string, r: string) {
    setOwner(o);
    setRepo(r);
  }

  return (
    <main className="min-h-screen flex flex-col bg-amber-50">
      {/* Header */}
      <header className="px-6 py-4 border-b-3 border-black bg-yellow-400 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">OS First Mate</h1>
          <p className="text-sm">Maintainer command center</p>
        </div>
        <div className="flex items-center gap-4">
          <RepoSelector onSubmit={handleRepoSubmit} currentRepo={hasRepo ? `${owner}/${repo}` : undefined} />
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="px-3 py-2 bg-black text-yellow-400 font-bold text-sm uppercase brutal-hover"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* Tabs */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {!hasRepo ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3 p-8">
              <p className="text-5xl font-bold">Ahoy!</p>
              <p className="text-gray-600 max-w-md text-lg">
                Enter a GitHub repo above to start triaging issues,
                detecting duplicates, and generating release notes.
              </p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === "triage" && <TriagePanel owner={owner} repo={repo} />}
            {activeTab === "duplicates" && <DuplicatePanel owner={owner} repo={repo} />}
            {activeTab === "releases" && <ReleasePanel owner={owner} repo={repo} />}
          </>
        )}
      </div>
    </main>
  );
}
