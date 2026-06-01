"use client";

import { motion } from "framer-motion";
import { Trophy, CheckCircle2 } from "lucide-react";

export function CareerMilestones() {
  const milestones = [
    { title: "First Resume Created", date: "Jan 12, 2026", achieved: true },
    { title: "First ATS Score > 90", date: "Feb 05, 2026", achieved: true },
    { title: "First Interview Secured", date: "Mar 18, 2026", achieved: true },
    { title: "25 Applications Sent", date: "Apr 22, 2026", achieved: true },
    { title: "First Job Offer", date: "Locked", achieved: false },
  ];

  return (
    <div className="bg-surface border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400 border border-yellow-500/30">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary leading-tight">Career Milestones</h2>
            <p className="text-xs text-text-muted mt-0.5">Your unlocked achievements.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 relative">
        {/* Timeline Line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-white/5" />

        {milestones.map((milestone, i) => (
          <motion.div
            key={milestone.title}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-4 relative z-10"
          >
            <div className={`w-8 h-8 rounded-full bg-surface border-[3px] border-[#121212] flex items-center justify-center shrink-0 mt-0.5 ${milestone.achieved ? 'text-yellow-400' : 'text-white/20'}`}>
              <CheckCircle2 className="w-5 h-5 fill-current bg-surface rounded-full" />
            </div>
            
            <div className={`flex flex-col pt-1 ${milestone.achieved ? 'opacity-100' : 'opacity-40'}`}>
              <h3 className="font-semibold text-white text-sm">{milestone.title}</h3>
              <p className="text-xs text-text-muted">{milestone.date}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
