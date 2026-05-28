"use client";

import { motion } from "framer-motion";

const tech = [
  { name: "Next.js", role: "Framework" },
  { name: "OpenAI", role: "AI Engine" },
  { name: "Coral SQL", role: "Data Layer" },
  { name: "Tailwind CSS", role: "Styling" },
  { name: "Framer Motion", role: "Animation" },
];

export function BuiltWith() {
  return (
    <section className="bg-yellow-400 bg-noise border-b-3 border-black py-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-black font-display mb-8">Ship's Manifest</h2>
        <div className="flex justify-center items-end">
          {tech.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
              className={`bg-white px-4 py-3 border-3 border-black${i !== 0 ? " -ml-3" : ""}`}
              style={{
                boxShadow: "3px 3px 0 #000",
                rotate: `${(i - 2) * 6}deg`,
              }}
            >
              <p className="font-bold text-sm leading-tight">{item.name}</p>
              <p className="font-mono text-xs text-gray-500 mt-0.5">{item.role}</p>
            </motion.div>
          ))}
        </div>
        <p className="mt-6 text-sm font-bold">Built for Pirates of the Coral-Bean Hackathon</p>
      </div>
    </section>
  );
}
