"use client";

import { motion } from "framer-motion";
import { FileText, Star } from "lucide-react";

export function ResumePerformance() {
  const resumes = [
    { name: "Google Tailored Resume", ats: 97, used: 3 },
    { name: "Backend Core Resume", ats: 94, used: 10 },
    { name: "Frontend React Resume", ats: 88, used: 12 },
  ];

  return (
    <div className="bg-surface border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 border border-orange-500/30">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary leading-tight">Top Resumes</h2>
            <p className="text-xs text-text-muted mt-0.5">Your highest performing documents.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {resumes.map((resume, i) => (
          <motion.div
            key={resume.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-text-muted" />
              <div>
                <h3 className="font-semibold text-white text-sm">{resume.name}</h3>
                <p className="text-[10px] text-text-muted">Used in {resume.used} applications</p>
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-blue-400">{resume.ats}</span>
              <span className="text-[10px] text-text-muted uppercase tracking-wider">ATS Score</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
