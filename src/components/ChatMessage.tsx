"use client";

import { motion } from "framer-motion";
import { ChatMessage as ChatMessageType } from "@/lib/types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] px-4 py-3 brutal-border brutal-shadow-sm ${
          isUser ? "bg-yellow-300" : "bg-white"
        }`}
      >
        {message.isLoading ? (
          <div className="flex items-center gap-2">
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="font-mono text-sm"
            >
              Thinking...
            </motion.span>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none font-sans whitespace-pre-wrap">
            {message.content}
          </div>
        )}
      </div>
    </motion.div>
  );
}
