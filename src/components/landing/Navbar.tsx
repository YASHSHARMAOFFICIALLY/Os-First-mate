"use client";

import { motion } from "framer-motion";

export function Navbar() {
  return (
    <motion.nav
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-50 bg-black text-white px-6 py-3 flex items-center justify-between border-b-3 border-black"
    >
      <div className="font-black text-lg tracking-tight">
        ⚓ OS First Mate
      </div>
      <div className="flex items-center gap-6 text-sm">
        <a href="#features" className="opacity-70 hover:opacity-100 transition-opacity hidden sm:block">
          Features
        </a>
        <a href="#how-it-works" className="opacity-70 hover:opacity-100 transition-opacity hidden sm:block">
          How it works
        </a>
        <a
          href="/api/auth/signin/github"
          className="bg-orange-400 text-black px-4 py-2 font-bold border-2 border-black brutal-hover"
        >
          Sign in →
        </a>
      </div>
    </motion.nav>
  );
}
