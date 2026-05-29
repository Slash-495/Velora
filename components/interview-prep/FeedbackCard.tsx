"use client";

import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, TrendingUp, Lightbulb } from "lucide-react";

interface FeedbackCardProps {
  score: number;
  feedback: string;
  missingConcepts: string[];
}

export function FeedbackCard({ score, feedback, missingConcepts }: FeedbackCardProps) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (s >= 60) return "text-orange-400 bg-orange-500/10 border-orange-500/20";
    return "text-red-400 bg-red-500/10 border-red-500/20";
  };

  const getScoreIcon = (s: number) => {
    if (s >= 80) return <CheckCircle className="w-6 h-6 text-emerald-400" />;
    if (s >= 60) return <TrendingUp className="w-6 h-6 text-orange-400" />;
    return <AlertCircle className="w-6 h-6 text-red-400" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
    >
      <div className="flex items-start justify-between gap-6 mb-6">
        <div>
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-2">
            <Lightbulb className="w-5 h-5 text-primary" /> AI Evaluation
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
            {feedback}
          </p>
        </div>
        
        <div className={`flex flex-col items-center justify-center p-4 rounded-2xl border min-w-[100px] ${getScoreColor(score)}`}>
          {getScoreIcon(score)}
          <span className="text-2xl font-bold mt-2">{score}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">Score</span>
        </div>
      </div>

      {missingConcepts && missingConcepts.length > 0 && (
        <div className="pt-4 border-t border-white/10">
          <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Key Concepts Missed</h4>
          <div className="flex flex-wrap gap-2">
            {missingConcepts.map((concept, idx) => (
              <span key={idx} className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-medium">
                {concept}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
