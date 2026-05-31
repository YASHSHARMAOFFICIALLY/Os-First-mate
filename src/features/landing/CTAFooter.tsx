"use client";

import { motion } from "framer-motion";
import { signIn } from "next-auth/react";

export function CTAFooter() {
  return (
    <footer className="bg-black text-white py-20 px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto text-center space-y-8"
      >
        <h2 className="text-3xl md:text-4xl font-black font-display">Ready to triage smarter?</h2>
        <button
          type="button"
          onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
          className="inline-block bg-cyan-300 text-black px-8 py-4 font-bold text-lg border-3 border-black brutal-hover"
          style={{ boxShadow: "6px 6px 0 #000" }}
        >
          Sign in with GitHub
        </button>
        <div>
          <a
            href="https://github.com/yashsharma/os-first-mate"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white underline opacity-70 hover:opacity-100 transition-opacity"
          >
            View source on GitHub ↗
          </a>
        </div>
        <p className="text-xs text-gray-500">© 2026 OS First Mate</p>
      </motion.div>
    </footer>
  );
}
