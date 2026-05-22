"use client";

import { motion } from "framer-motion";
import { Activity, FileEdit, Send, TrendingUp, Sparkles } from "lucide-react";

const activities = [
  {
    id: 1,
    title: "Tailored SDE Resume",
    description: "Matched to Google SWE JD",
    time: "2 hours ago",
    icon: Sparkles,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20"
  },
  {
    id: 2,
    title: "Applied to Stripe",
    description: "Frontend Engineer position",
    time: "5 hours ago",
    icon: Send,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20"
  },
  {
    id: 3,
    title: "ATS Score Improved",
    description: "Data Analyst track +8 pts",
    time: "1 day ago",
    icon: TrendingUp,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20"
  },
  {
    id: 4,
    title: "Updated Skills Section",
    description: "Added Next.js and Tailwind",
    time: "2 days ago",
    icon: FileEdit,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20"
  }
];

export function ActivityTimeline() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-text-secondary" />
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Activity</h2>
      </div>

      <div className="relative pl-3">
        {/* Vertical connecting line */}
        <div className="absolute left-[27px] top-4 bottom-4 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent" />

        <div className="space-y-6">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex gap-4 relative z-10"
            >
              <div className={`w-8 h-8 rounded-full ${activity.bg} ${activity.border} border flex items-center justify-center shrink-0`}>
                <activity.icon className={`w-3.5 h-3.5 ${activity.color}`} />
              </div>
              
              <div className="pt-1 flex-1">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="text-sm font-medium text-text-primary leading-none">{activity.title}</h4>
                  <span className="text-[10px] text-text-muted shrink-0 whitespace-nowrap">{activity.time}</span>
                </div>
                <p className="text-xs text-text-secondary mt-1.5">{activity.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
