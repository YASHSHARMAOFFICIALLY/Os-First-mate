"use client";

import { motion } from "framer-motion";
import { signIn } from "next-auth/react";

export function Navbar() {
  return (
    <motion.nav
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 bg-white text-gray-900 px-6 py-3 flex items-center justify-between border-b-3 border-black"
    >
      <div className="font-black text-lg tracking-tight">
        <span className="font-display">⚓ OS First Mate</span>
      </div>
      <div className="flex items-center gap-6 text-sm">
        <a
          href="#features"
          className="font-bold opacity-70 hover:opacity-100 transition-opacity hidden sm:block"
        >
          Features
        </a>
        <a
          href="#how-it-works"
          className="font-bold opacity-70 hover:opacity-100 transition-opacity hidden sm:block"
        >
          How it works
        </a>
        <button
          type="button"
          onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
          className="bg-yellow-400 text-black px-4 py-2 font-bold border-2 border-black brutal-hover"
        >
          Sign in with GitHub
        </button>
      </div>
    </motion.nav>
  );
}
