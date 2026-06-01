"use client";

import { motion } from "framer-motion";
import { Briefcase, ChevronRight } from "lucide-react";

export function TrackPerformance() {
  const tracks = [
    { name: "Frontend Engineer", applications: 18, interviews: 4, ats: 94 },
    { name: "Data Analyst", applications: 8, interviews: 1, ats: 87 },
  ];

  return (
    <div className="bg-surface border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary leading-tight">Track Performance</h2>
            <p className="text-xs text-text-muted mt-0.5">Which roles are converting best?</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {tracks.map((track, i) => (
          <motion.div
            key={track.name}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group cursor-pointer"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-white text-sm group-hover:text-primary transition-colors">{track.name}</h3>
              <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white">{track.applications}</span>
                <span className="text-[10px] text-text-muted uppercase tracking-wider">Applied</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-emerald-400">{track.interviews}</span>
                <span className="text-[10px] text-text-muted uppercase tracking-wider">Interviews</span>
              </div>
              <div className="flex flex-col border-l border-white/10 pl-2">
                <span className="text-lg font-bold text-blue-400">{track.ats}</span>
                <span className="text-[10px] text-text-muted uppercase tracking-wider">Avg ATS</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
