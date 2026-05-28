"use client";

import { motion } from "framer-motion";

const tech = ["Next.js", "OpenAI", "Coral SQL", "Tailwind CSS", "Framer Motion"];

export function BuiltWith() {
  return (
    <section className="bg-yellow-400 border-b-3 border-black py-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-black mb-8">Built with</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {tech.map((name, i) => (
            <motion.span
              key={name}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 300 }}
              className="bg-white px-4 py-2 font-bold text-sm border-3 border-black"
              style={{ boxShadow: "3px 3px 0 #000" }}
            >
              {name}
            </motion.span>
          ))}
        </div>
        <p className="mt-6 text-sm font-bold">Built for Pirates of the Coral-Bean Hackathon</p>
      </div>
    </section>
  );
}
