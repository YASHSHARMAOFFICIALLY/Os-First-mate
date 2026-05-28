"use client";

import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Paste any GitHub repo",
    description: "Enter an owner/repo and hit Load. Works with any public repository.",
    mockup: (
      <div className="bg-white border-3 border-black p-4" style={{ boxShadow: "4px 4px 0 #000" }}>
        <div className="flex gap-2">
          <div className="flex-1 border-3 border-black px-3 py-2 font-mono text-sm bg-gray-50">
            vercel/next.js
          </div>
          <div className="bg-black text-yellow-400 px-4 py-2 font-bold text-sm border-3 border-black">
            Load
          </div>
        </div>
      </div>
    ),
    direction: { initial: { opacity: 0, x: -60 }, animate: { opacity: 1, x: 0 } },
  },
  {
    number: "02",
    title: "AI agents get to work",
    description: "Agents query your repo, analyze patterns, and process every issue.",
    mockup: (
      <div className="bg-white border-3 border-black p-4 space-y-2" style={{ boxShadow: "4px 4px 0 #000" }}>
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Agent Steps</p>
        <div className="flex items-center gap-2 text-sm font-mono">
          <span>✓</span><span className="text-gray-600">Fetched 20 issues</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-mono">
          <span>✓</span><span className="text-gray-600">Analyzed label patterns</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-mono">
          <span>✓</span><span className="text-gray-600">Compared for duplicates</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-mono">
          <span className="animate-spin">⟳</span><span className="font-bold">Generating triage results...</span>
        </div>
      </div>
    ),
    direction: { initial: { opacity: 0, y: 60 }, animate: { opacity: 1, y: 0 } },
  },
  {
    number: "03",
    title: "Get actionable results",
    description: "Labels, priorities, duplicates, release notes — ready in seconds.",
    mockup: (
      <div className="bg-white border-3 border-black p-4 space-y-2" style={{ boxShadow: "4px 4px 0 #000" }}>
        <div className="border-3 border-black p-3 flex justify-between items-center">
          <div>
            <span className="font-mono text-xs text-gray-500">#4521</span>
            <p className="font-bold text-sm">Fix hydration mismatch in RSC</p>
          </div>
          <span className="bg-red-500 text-white px-2 py-0.5 text-xs font-bold border-2 border-black">P0</span>
        </div>
        <div className="border-3 border-black p-3 flex justify-between items-center">
          <div>
            <span className="font-mono text-xs text-gray-500">#4519</span>
            <p className="font-bold text-sm">Add dark mode toggle</p>
          </div>
          <span className="bg-yellow-400 px-2 py-0.5 text-xs font-bold border-2 border-black">P2</span>
        </div>
      </div>
    ),
    direction: { initial: { opacity: 0, x: 60 }, animate: { opacity: 1, x: 0 } },
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white border-b-3 border-black py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-16">How it works</h2>
        <div className="space-y-20">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={step.direction.initial}
              whileInView={step.direction.animate}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col md:flex-row items-center gap-8"
            >
              <div className="flex-1 space-y-3">
                <div
                  className="inline-flex items-center justify-center w-12 h-12 bg-cyan-300 border-3 border-black font-black text-lg"
                  style={{ boxShadow: "3px 3px 0 #000" }}
                >
                  {step.number}
                </div>
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
              <div className="flex-1 w-full">{step.mockup}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
