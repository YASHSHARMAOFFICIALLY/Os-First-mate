"use client";

import { Tab } from "@/lib/types";

interface TabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "brief", label: "Repo Brief", icon: "📊" },
  { id: "triage", label: "Triage", icon: "🏷" },
  { id: "health", label: "Project Health", icon: "🫀" },
  { id: "releases", label: "Release Notes", icon: "📋" },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="flex border-b-3 border-black bg-white">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 px-4 py-3 font-bold text-sm uppercase tracking-wide transition-colors ${
            activeTab === tab.id
              ? "bg-yellow-400 border-r-3 border-black last:border-r-0"
              : "hover:bg-yellow-100 border-r-3 border-black last:border-r-0"
          }`}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );
}
