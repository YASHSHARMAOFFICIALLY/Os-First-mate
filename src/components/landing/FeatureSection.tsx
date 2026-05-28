"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Feature {
  bg: string;
  title: string;
  bullets: string[];
  mockup: ReactNode;
  reverse?: boolean;
}

function Section({ bg, title, bullets, mockup, reverse }: Feature) {
  return (
    <section className={`${bg} border-b-3 border-black py-20 px-6`}>
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
          <h3 className="text-2xl md:text-3xl font-black">{title}</h3>
          <ul className="space-y-2">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2 text-gray-800">
                <span className="mt-1 font-bold">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: reverse ? -40 : 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex-1 w-full"
        >
          {mockup}
        </motion.div>
      </div>
    </section>
  );
}

function TriageMockup() {
  return (
    <div className="bg-white border-3 border-black p-4 space-y-3" style={{ boxShadow: "6px 6px 0 #000" }}>
      <div className="border-3 border-black p-3">
        <div className="flex justify-between items-start">
          <div>
            <span className="font-mono text-xs text-gray-500">#4521</span>
            <p className="font-bold text-sm">Fix hydration mismatch in RSC</p>
          </div>
          <span className="bg-red-500 text-white px-2 py-0.5 text-xs font-bold border-2 border-black">P0</span>
        </div>
        <div className="flex gap-1 mt-2">
          <span className="bg-lime-200 border-2 border-black px-2 py-0.5 text-[10px] font-bold">bug</span>
          <span className="bg-blue-200 border-2 border-black px-2 py-0.5 text-[10px] font-bold">react-server</span>
        </div>
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

function DuplicatesMockup() {
  return (
    <div className="bg-white border-3 border-black p-4 space-y-3" style={{ boxShadow: "6px 6px 0 #000" }}>
      <p className="font-bold text-sm">Potential Duplicates</p>
      <div className="bg-amber-50 border-3 border-black p-3">
        <div className="flex justify-between">
          <span className="font-bold text-sm">#1842 ↔ #1790</span>
          <span className="bg-red-500 text-white px-2 text-xs font-bold border-2 border-black">94%</span>
        </div>
        <p className="text-xs text-gray-600 mt-1">Memory leak in useEffect cleanup</p>
        <div className="mt-2 h-2.5 bg-gray-200 border-2 border-black overflow-hidden">
          <div className="h-full bg-red-400" style={{ width: "94%" }} />
        </div>
      </div>
      <div className="bg-amber-50 border-3 border-black p-3">
        <div className="flex justify-between">
          <span className="font-bold text-sm">#1838 ↔ #1695</span>
          <span className="bg-orange-400 px-2 text-xs font-bold border-2 border-black">78%</span>
        </div>
        <p className="text-xs text-gray-600 mt-1">SSR hydration mismatch with Suspense</p>
        <div className="mt-2 h-2.5 bg-gray-200 border-2 border-black overflow-hidden">
          <div className="h-full bg-orange-400" style={{ width: "78%" }} />
        </div>
      </div>
    </div>
  );
}

function ReleaseNotesMockup() {
  return (
    <div className="bg-white border-3 border-black p-4 space-y-3" style={{ boxShadow: "6px 6px 0 #000" }}>
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

export function FeatureSections() {
  return (
    <div id="features">
      <Section
        bg="bg-lime-400"
        title="Smart Issue Triage"
        bullets={[
          "Auto-suggests labels from your repo's actual label set",
          "Assigns priority (P0–P3) based on impact analysis",
          "Recommends assignees by matching expertise patterns",
        ]}
        mockup={<TriageMockup />}
      />
      <Section
        bg="bg-orange-400"
        title="Duplicate Radar"
        bullets={[
          "Semantic similarity detection across all open issues",
          "Percentage-based confidence scores",
          "Explains why two issues are related",
        ]}
        mockup={<DuplicatesMockup />}
        reverse
      />
      <Section
        bg="bg-pink-300"
        title="One-Click Release Notes"
        bullets={[
          "Auto-categorizes merged PRs into Features, Fixes, etc.",
          "Generates markdown-ready changelogs",
          "Includes PR numbers and author attribution",
        ]}
        mockup={<ReleaseNotesMockup />}
      />
    </div>
  );
}
