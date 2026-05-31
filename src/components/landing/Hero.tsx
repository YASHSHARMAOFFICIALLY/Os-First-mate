"use client";

import { motion } from "framer-motion";
import { signIn } from "next-auth/react";

function AppPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40, rotate: -3 }}
      animate={{ opacity: 1, x: 0, rotate: -1 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="bg-white border-3 border-black"
      style={{ boxShadow: "8px 8px 0 #000", transform: "rotate(-1deg)" }}
    >
      {/* Header bar */}
      <div className="bg-orange-400 px-3 py-2 border-b-3 border-black flex justify-between items-center">
        <span className="font-black text-xs">OS First Mate</span>
        <span className="font-mono text-[10px] bg-white border-2 border-black px-2 py-0.5">
          facebook/react
        </span>
      </div>
      {/* Tab bar */}
      <div className="flex border-b-2 border-black text-[10px]">
        <div className="px-3 py-1.5 bg-orange-400 font-bold border-r-2 border-black">📊 Brief</div>
        <div className="px-3 py-1.5 border-r-2 border-black">🏷 Triage</div>
        <div className="px-3 py-1.5 border-r-2 border-black">🫀 Health</div>
        <div className="px-3 py-1.5">📋 Releases</div>
      </div>
      {/* Content */}
      <div className="p-3 space-y-2 text-[10px]">
        <div className="flex items-center gap-2 border-3 border-black p-2">
          <div className="w-8 h-8 bg-yellow-400 border-2 border-black flex items-center justify-center">
            <span className="text-sm font-black">B</span>
          </div>
          <div>
            <p className="font-bold text-xs">Health: 72/100</p>
            <p className="text-[9px] text-gray-500">5 issues, bus factor risk</p>
          </div>
        </div>
        {/* Actions */}
        <div className="bg-yellow-50 border-3 border-black p-2">
          <p className="font-bold text-[9px] mb-1">What To Do Now</p>
          <p className="text-[9px] text-gray-600">1. Triage 5 issues</p>
          <p className="text-[9px] text-gray-600">2. Close dup #4521</p>
          <p className="text-[9px] text-gray-600">3. Cut release v2.4.0</p>
        </div>
        {/* Coral */}
        <div className="bg-gray-900 text-gray-100 border-2 border-black p-1.5">
          <p className="text-[8px] font-bold text-cyan-400">CORAL EVIDENCE</p>
          <p className="text-[8px] font-mono text-gray-400">8 queries / 142 rows</p>
        </div>
      </div>
    </motion.div>
  );
}

export function Hero() {
  return (
    <section className="bg-yellow-400 bg-noise border-b-3 border-black">
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 flex flex-col md:flex-row items-center gap-12">
        {/* Left: Copy */}
        <div className="flex-1 space-y-6">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0 }}
            className="inline-block bg-black text-yellow-400 border-2 border-black px-3 py-1 text-xs font-bold uppercase tracking-wide"
            style={{ boxShadow: "2px 2px 0 #000" }}
          >
            Hackathon Project ⚡
          </motion.span>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="relative"
          >
            <div className="absolute -left-4 top-2 w-32 h-32 bg-black border-3 border-black -z-10 rotate-3" />
            <h1 className="text-4xl md:text-5xl font-black font-display leading-[1.05] tracking-tight">
              Your Repo&apos;s
              <br />
              AI First Mate.
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-base md:text-lg text-gray-800 max-w-md leading-relaxed"
          >
            Daily repo brief, smart triage, project health, release notes — all from one command center.
            Powered by Coral SQL queries you can see.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-wrap gap-3"
          >
            <button
              type="button"
              onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
              className="bg-black text-yellow-400 px-6 py-3 font-bold text-sm border-3 border-black brutal-hover"
              style={{ boxShadow: "4px 4px 0 #000" }}
            >
              Sign in with GitHub
            </button>
            <a
              href="https://github.com/yashsharma/os-first-mate"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white px-6 py-3 font-bold text-sm border-3 border-black brutal-hover"
              style={{ boxShadow: "4px 4px 0 #000" }}
            >
              View on GitHub ↗
            </a>
          </motion.div>
        </div>

        {/* Right: App preview */}
        <div className="flex-1 max-w-md w-full md:translate-y-12">
          <AppPreview />
        </div>
      </div>
    </section>
  );
}
