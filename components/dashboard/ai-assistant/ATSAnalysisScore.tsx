"use client";

import { motion } from "framer-motion";
import { Target, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

interface ATSAnalysisScoreProps {
  result: {
    score: number;
    matchPercentage: number;
    missingKeywords: string[];
    strongAreas: string[];
    weakAreas: string[];
  } | null;
}

export function ATSAnalysisScore({ result }: ATSAnalysisScoreProps) {
  if (!result) return null;

  const scoreColor = result.score >= 80 ? 'text-emerald-500' : result.score >= 60 ? 'text-amber-500' : 'text-red-500';
  const strokeColor = result.score >= 80 ? '#10b981' : result.score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top Section: Score & Radial Progress */}
      <div className="flex items-center justify-between bg-black/40 border border-white/5 p-6 rounded-2xl">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            ATS Match Score
          </h2>
          <p className="text-sm text-text-muted">
            Based on semantic keyword matching and formatting structure.
          </p>
        </div>

        {/* Circular Progress Indicator */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
            <motion.circle
              cx="48"
              cy="48"
              r="40"
              stroke={strokeColor}
              strokeWidth="6"
              fill="transparent"
              strokeDasharray="251.2"
              initial={{ strokeDashoffset: 251.2 }}
              animate={{ strokeDashoffset: 251.2 - (251.2 * result.score) / 100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className={`text-2xl font-bold ${scoreColor}`}>{result.score}</span>
            <span className="text-[10px] uppercase font-bold text-text-muted">/ 100</span>
          </div>
        </div>
      </div>

      {/* Grid: Missing vs Strong */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Missing Keywords */}
        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-5">
          <h3 className="font-semibold text-red-400 flex items-center gap-2 mb-3 text-sm">
            <XCircle className="w-4 h-4" />
            Missing Keywords
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.missingKeywords.map(kw => (
              <span key={kw} className="px-2.5 py-1 text-xs font-medium rounded-md bg-red-500/10 text-red-300 border border-red-500/20">
                {kw}
              </span>
            ))}
          </div>
        </div>

        {/* Strong Areas */}
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-5">
          <h3 className="font-semibold text-emerald-400 flex items-center gap-2 mb-3 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Strong Matches
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.strongAreas.map(area => (
              <span key={area} className="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                {area}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
