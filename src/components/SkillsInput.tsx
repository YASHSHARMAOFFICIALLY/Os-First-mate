"use client";

import { useState } from "react";

interface SkillsInputProps {
  skills: string[];
  onSkillsChange: (skills: string[]) => void;
}

export function SkillsInput({ skills, onSkillsChange }: SkillsInputProps) {
  const [input, setInput] = useState("");

  function addSkill(e: React.FormEvent) {
    e.preventDefault();
    const skill = input.trim();
    if (skill && !skills.includes(skill)) {
      onSkillsChange([...skills, skill]);
    }
    setInput("");
  }

  function removeSkill(skill: string) {
    onSkillsChange(skills.filter((s) => s !== skill));
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-bold uppercase tracking-wide">
        Your Skills
      </label>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <button
            key={skill}
            onClick={() => removeSkill(skill)}
            className="px-2 py-1 text-xs font-bold bg-yellow-200 brutal-border brutal-shadow-sm brutal-hover cursor-pointer"
            title="Click to remove"
          >
            {skill} &#10005;
          </button>
        ))}
      </div>
      <form onSubmit={addSkill} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. TypeScript"
          className="flex-1 px-3 py-2 brutal-border bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="px-3 py-2 bg-lime-300 brutal-border font-bold text-sm brutal-hover disabled:opacity-50"
        >
          +
        </button>
      </form>
    </div>
  );
}
