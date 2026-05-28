"use client";

import { motion } from "framer-motion";

function AppPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40, rotate: -3 }}
      animate={{ opacity: 1, x: 0, rotate: -1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="bg-white border-3 border-black"
      style={{ boxShadow: "8px 8px 0 #000", transform: "rotate(-1deg)" }}
    >
      {/* Header bar */}
      <div className="bg-orange-400 px-3 py-2 border-b-3 border-black flex justify-between items-center">
        <span className="font-black text-xs">OS First Mate</span>
        <span className="font-mono text-[10px] bg-white border-2 border-black px-2 py-0.5">facebook/react</span>
      </div>
      {/* Tab bar */}
      <div className="flex border-b-2 border-black text-[10px]">
        <div className="px-3 py-1.5 border-r-2 border-black">🏷 Triage</div>
        <div className="px-3 py-1.5 bg-orange-400 font-bold border-r-2 border-black">🔍 Duplicates</div>
        <div className="px-3 py-1.5">📋 Releases</div>
      </div>
      {/* Content */}
      <div className="p-3 space-y-2 text-[10px]">
        <p className="font-bold text-xs">Potential Duplicates Found</p>
        {/* Match 1 */}
        <div className="bg-amber-50 border-3 border-black p-2">
          <div className="flex justify-between items-center">
            <span className="font-bold">#1842 ↔ #1790</span>
            <span className="bg-red-500 text-white px-1.5 text-[9px] font-bold border-2 border-black">94%</span>
          </div>
          <p className="text-[9px] text-gray-600 mt-1">Both report memory leak in useEffect cleanup</p>
        </div>
        {/* Match 2 */}
        <div className="bg-amber-50 border-3 border-black p-2">
          <div className="flex justify-between items-center">
            <span className="font-bold">#1838 ↔ #1695</span>
            <span className="bg-orange-400 px-1.5 text-[9px] font-bold border-2 border-black">78%</span>
          </div>
          <p className="text-[9px] text-gray-600 mt-1">SSR hydration mismatch with Suspense boundary</p>
        </div>
      </div>
    </motion.div>
  );
}

export function Hero() {
  return (
    <section className="bg-cyan-300 border-b-3 border-black">
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 flex flex-col md:flex-row items-center gap-12">
        {/* Left: Copy */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 space-y-6"
        >
          <span className="inline-block bg-yellow-400 border-2 border-black px-3 py-1 text-xs font-bold uppercase tracking-wide"
            style={{ boxShadow: "2px 2px 0 #000" }}
          >
            Hackathon Project ⚡
          </span>
          <h1 className="text-4xl md:text-5xl font-black leading-[1.05] tracking-tight">
            Your Repo&apos;s<br />AI First Mate.
          </h1>
          <p className="text-base md:text-lg text-gray-800 max-w-md leading-relaxed">
            Triage, duplicates, release notes — all from one command center.
            Powered by AI agents that actually read your issues.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="/api/auth/signin/github"
              className="bg-black text-cyan-300 px-6 py-3 font-bold text-sm border-3 border-black brutal-hover"
              style={{ boxShadow: "4px 4px 0 #000" }}
            >
              Sign in with GitHub
            </a>
            <a
              href="https://github.com/yashsharma/os-first-mate"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white px-6 py-3 font-bold text-sm border-3 border-black brutal-hover"
              style={{ boxShadow: "4px 4px 0 #000" }}
            >
              View on GitHub ↗
            </a>
          </div>
        </motion.div>

        {/* Right: App preview */}
        <div className="flex-1 max-w-md w-full">
          <AppPreview />
        </div>
      </div>
    </section>
  );
}
