"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Feature {
  cardColor: string;
  title: string;
  bullets: string[];
  mockup: ReactNode;
  reverse?: boolean;
}

function Section({ cardColor, title, bullets, mockup, reverse }: Feature) {
  return (
    <section className="bg-white border-b-3 border-black py-20 px-6">
      <div
        className={`max-w-5xl mx-auto flex flex-col ${
          reverse ? "md:flex-row-reverse" : "md:flex-row"
        } items-center gap-12`}
      >
        <motion.div
          initial={{ opacity: 0, x: reverse ? 40 : -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="flex-1 space-y-4"
        >
          <h3 className="text-2xl md:text-3xl font-black font-display">{title}</h3>
          <ul className="space-y-2">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2 text-gray-700">
                <span className="mt-1 font-bold">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: reverse ? -40 : 40, rotate: 3 }}
          whileInView={{ opacity: 1, x: 0, rotate: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex-1 w-full"
        >
          <div className={`${cardColor} border-3 border-black p-1`} style={{ boxShadow: "6px 6px 0 #000" }}>
            {mockup}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TriageMockup() {
  return (
    <div className="bg-white p-3 space-y-3">
      <div className="border-3 border-black p-3">
        <div className="flex justify-between items-start">
          <div>
            <span className="font-mono text-xs text-gray-500">#4521</span>
            <p className="font-bold text-sm">Fix hydration mismatch in RSC</p>
          </div>
          <span className="bg-red-500 text-white px-2 py-0.5 text-xs font-bold border-2 border-black">P0</span>
        </div>
        <div className="flex gap-1 mt-2">
          <span className="bg-lime-300 border-2 border-black px-2 py-0.5 text-[10px] font-bold">bug</span>
          <span className="bg-blue-200 border-2 border-black px-2 py-0.5 text-[10px] font-bold">react-server</span>
        </div>
        <p className="text-[10px] text-gray-400 mt-1">Similar to #4100, #3950</p>
      </div>
      <div className="border-3 border-black p-3">
        <div className="flex justify-between items-start">
          <div>
            <span className="font-mono text-xs text-gray-500">#4519</span>
            <p className="font-bold text-sm">Add dark mode toggle to settings</p>
          </div>
          <span className="bg-yellow-400 px-2 py-0.5 text-xs font-bold border-2 border-black">P2</span>
        </div>
        <div className="flex gap-1 mt-2">
          <span className="bg-purple-200 border-2 border-black px-2 py-0.5 text-[10px] font-bold">feature</span>
        </div>
      </div>
    </div>
  );
}

function ContributorsMockup() {
  return (
    <div className="bg-white p-3 space-y-3">
      <div className="bg-red-50 border-3 border-black p-3">
        <div className="flex justify-between items-center">
          <p className="font-bold text-sm">Bus Factor</p>
          <span className="bg-red-500 text-white px-2 py-0.5 text-xs font-bold border-2 border-black">HIGH RISK</span>
        </div>
        <div className="flex items-end gap-3 mt-2">
          <span className="text-3xl font-black">2</span>
          <div className="flex-1">
            <p className="text-xs text-gray-600">@alice handles 72% of PRs</p>
            <div className="mt-1 h-2.5 bg-gray-200 border-2 border-black overflow-hidden">
              <div className="h-full bg-red-400" style={{ width: "72%" }} />
            </div>
          </div>
        </div>
      </div>
      <div className="border-3 border-black p-3">
        <p className="font-bold text-xs mb-2">Top Contributors</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold w-5">#1</span>
            <span className="text-xs font-bold flex-1">@alice</span>
            <div className="w-16 h-2 bg-gray-200 border border-black overflow-hidden">
              <div className="h-full bg-orange-400" style={{ width: "100%" }} />
            </div>
            <span className="text-[10px] font-mono">45 PRs</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold w-5">#2</span>
            <span className="text-xs font-bold flex-1">@bob</span>
            <div className="w-16 h-2 bg-gray-200 border border-black overflow-hidden">
              <div className="h-full bg-orange-400" style={{ width: "40%" }} />
            </div>
            <span className="text-[10px] font-mono">18 PRs</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReleaseNotesMockup() {
  return (
    <div className="bg-white p-3 space-y-3">
      <div className="flex justify-between items-center">
        <p className="font-bold text-sm">Release Notes v2.4.0</p>
        <span className="bg-yellow-400 border-2 border-black px-2 py-0.5 text-[10px] font-bold">Copy Markdown</span>
      </div>
      <div className="font-mono text-xs space-y-2 bg-gray-50 border-2 border-black p-3">
        <p className="font-bold">## Features</p>
        <p>- Add dark mode support (#4519) @devuser</p>
        <p>- New dashboard analytics (#4502) @contributor</p>
        <p className="font-bold mt-2">## Bug Fixes</p>
        <p>- Fix hydration mismatch (#4521) @maintainer</p>
        <p>- Resolve memory leak (#4518) @devuser</p>
      </div>
    </div>
  );
}

function BriefMockup() {
  return (
    <div className="bg-white p-3 space-y-3">
      <div className="flex items-center gap-3 border-3 border-black p-3">
        <div className="w-12 h-12 bg-yellow-400 border-2 border-black flex items-center justify-center">
          <span className="text-2xl font-black">B</span>
        </div>
        <div>
          <p className="font-bold text-sm">Repo Health: 72/100</p>
          <p className="text-[10px] text-gray-500">5 untriaged issues, bus factor risk</p>
        </div>
      </div>
      <div className="border-3 border-black p-3 bg-yellow-50">
        <p className="font-bold text-xs mb-1">What To Do Now</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-yellow-400 border border-black flex items-center justify-center text-[8px] font-bold">1</span>
            <span className="text-[10px]">Triage 5 unlabeled issues</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-yellow-400 border border-black flex items-center justify-center text-[8px] font-bold">2</span>
            <span className="text-[10px]">Close duplicate #4521</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-yellow-400 border border-black flex items-center justify-center text-[8px] font-bold">3</span>
            <span className="text-[10px]">Cut release v2.4.0</span>
          </div>
        </div>
      </div>
      <div className="bg-gray-900 text-gray-100 border-2 border-black p-2">
        <p className="text-[8px] font-bold text-cyan-400 mb-1">CORAL EVIDENCE</p>
        <p className="text-[9px] font-mono text-gray-400">8 queries / 142 rows / github.issues, github.pulls</p>
      </div>
    </div>
  );
}

export function FeatureSections() {
  return (
    <div id="features">
      <Section
        cardColor="bg-yellow-300"
        title="Daily Maintainer Brief"
        bullets={[
          "One-click repo health score with actionable next steps",
          "Duplicate cluster detection across open issues",
          "Contributor risk analysis and rising star spotting",
          "Release readiness check with gh CLI commands",
          "Powered by 8 parallel Coral SQL queries — visible in UI",
        ]}
        mockup={<BriefMockup />}
      />
      <Section
        cardColor="bg-lime-300"
        title="Smart Issue Triage"
        bullets={[
          "Auto-suggests labels from your repo's actual label set",
          "Assigns priority (P0-P3) with evidence from past issues",
          "Maintainer-ready suggested comments to post immediately",
          "Every card answers: what should I do next?",
        ]}
        mockup={<TriageMockup />}
        reverse
      />
      <Section
        cardColor="bg-orange-300"
        title="Project Health"
        bullets={[
          "Bus factor analysis — who owns too much of your repo?",
          "Review bottleneck detection and burnout risk signals",
          "Rising star contributors ready for promotion",
          "Coral SQL evidence panel proves every insight",
        ]}
        mockup={<ContributorsMockup />}
      />
      <Section
        cardColor="bg-pink-300"
        title="One-Click Release Notes"
        bullets={[
          "Auto-categorizes merged PRs into Features, Fixes, etc.",
          "Copy-ready markdown for GitHub releases",
          "Slack-formatted summary for team announcements",
          "Actionable: tells you exactly when to cut a release",
        ]}
        mockup={<ReleaseNotesMockup />}
        reverse
      />
    </div>
  );
}
