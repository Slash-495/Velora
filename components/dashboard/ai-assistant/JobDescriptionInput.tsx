"use client";

import { useState } from "react";
import { Building2, Briefcase, FileText, Sparkles } from "lucide-react";

interface JobDescriptionInputProps {
  onAnalyze: (jd: { text: string; company: string; role: string }) => void;
  isAnalyzing: boolean;
  canAnalyze: boolean;
}

export function JobDescriptionInput({ onAnalyze, isAnalyzing, canAnalyze }: JobDescriptionInputProps) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [text, setText] = useState("");

  return (
    <div className="flex flex-col gap-4 bg-surface/50 border border-white/5 rounded-2xl p-5 shadow-lg backdrop-blur-xl">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-md bg-secondary/20 text-secondary">
          <FileText className="w-4 h-4" />
        </div>
        <h3 className="font-semibold text-text-primary">Target Job Description</h3>
      </div>

      {/* Optional Metadata */}
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input 
            type="text" 
            placeholder="Company (Optional)"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <div className="relative">
          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input 
            type="text" 
            placeholder="Role (Optional)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      {/* JD Textarea */}
      <div className="flex-1 min-h-[250px] flex flex-col">
        <textarea
          placeholder="Paste the full job description here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors resize-none custom-scrollbar"
        />
      </div>

      <button
        onClick={() => onAnalyze({ text, company, role })}
        disabled={!canAnalyze || !text.trim() || isAnalyzing}
        className={`mt-2 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-300 ${
          canAnalyze && text.trim() && !isAnalyzing
            ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-glow-primary hover:opacity-90 active:scale-[0.98]'
            : 'bg-white/5 text-text-muted cursor-not-allowed border border-white/5'
        }`}
      >
        <Sparkles className={`w-5 h-5 ${isAnalyzing ? 'animate-pulse' : ''}`} />
        {isAnalyzing ? "Analyzing ATS Match..." : "Analyze Match"}
      </button>

    </div>
  );
}
