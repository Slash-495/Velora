"use client";

import { motion } from "framer-motion";
import { FileText, Briefcase, CheckSquare, Target } from "lucide-react";

export function CareerOverview() {
  const stats = [
    { label: "Total Resumes", value: "4", icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { label: "Career Tracks", value: "2", icon: Briefcase, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    { label: "Applications Sent", value: "26", icon: CheckSquare, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { label: "Interviews", value: "5", icon: Target, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-surface border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col gap-4 relative overflow-hidden group hover:border-white/10 transition-colors`}
          >
            {/* Subtle background glow */}
            <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity ${stat.bg.replace('/10', '')}`} />
            
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg} ${stat.border} border`}>
              <Icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            
            <div>
              <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{stat.label}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
