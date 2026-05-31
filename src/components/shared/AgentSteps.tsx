"use client";

import { motion } from "framer-motion";
import { AgentStep } from "@/types/agent";

interface AgentStepsProps {
  steps: AgentStep[];
}

export function AgentSteps({ steps }: AgentStepsProps) {
  if (steps.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Agent Steps</p>
      {steps.map((step, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center gap-2 text-sm font-mono"
        >
          <span>{step.status === "done" ? "✓" : "⟳"}</span>
          <span className={step.status === "done" ? "text-gray-600" : "font-bold"}>
            {step.description}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
