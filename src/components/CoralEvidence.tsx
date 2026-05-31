"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CoralTrace } from "@/lib/types";

interface CoralEvidenceProps {
  traces: CoralTrace[];
}

export function CoralEvidence({ traces }: CoralEvidenceProps) {
  const [expanded, setExpanded] = useState(false);

  if (traces.length === 0) return null;

  const tables = [...new Set(traces.map(t => t.table))];
  const totalRows = traces.reduce((sum, t) => sum + t.rowCount, 0);
  const allCoral = traces.every(t => t.source === "coral");

  return (
    <div className="brutal-border bg-gray-900 text-gray-100 p-3 space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
            Coral Evidence
          </span>
          <span className="text-[10px] text-gray-400">
            {traces.length} queries / {totalRows} rows / {tables.join(", ")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {allCoral && (
            <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 bg-cyan-900 text-cyan-300 border border-cyan-700">
              CORAL SQL
            </span>
          )}
          <span className="text-gray-500 text-xs">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {traces.map((trace, i) => (
              <div key={i} className="bg-gray-800 border border-gray-700 p-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-yellow-400">{trace.tool}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500">{trace.rowCount} rows</span>
                    <span className={`text-[8px] font-bold uppercase px-1 py-0.5 border ${
                      trace.source === "coral"
                        ? "text-cyan-300 border-cyan-700 bg-cyan-900/50"
                        : "text-amber-300 border-amber-700 bg-amber-900/50"
                    }`}>
                      {trace.source}
                    </span>
                  </div>
                </div>
                <pre className="text-[10px] font-mono text-gray-300 whitespace-pre-wrap break-all leading-relaxed">
                  {trace.sql}
                </pre>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
