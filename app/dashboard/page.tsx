"use client";

import { motion } from "framer-motion";
import { QuickActions } from "@/components/dashboard/widgets/QuickActions";
import { ActivityTimeline } from "@/components/dashboard/widgets/ActivityTimeline";
import { TodaysFocus } from "@/components/dashboard/widgets/TodaysFocus";
import { Upcoming } from "@/components/dashboard/widgets/Upcoming";

export default function DashboardPage() {
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Welcome Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight">Welcome back</h1>
        <p className="text-text-muted mt-1">{date}</p>
      </motion.div>

      {/* Balanced Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        
        {/* Left Column */}
        <div className="space-y-6">
          <div className="card-premium p-5 rounded-2xl border border-white/5 bg-surface/50">
            <QuickActions />
          </div>

          <div className="card-premium p-5 rounded-2xl border border-white/5 bg-surface/30">
            <TodaysFocus />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="card-premium p-6 rounded-2xl border border-white/5 bg-surface/50 h-full">
            <ActivityTimeline />
          </div>
        </div>

      </div>

      {/* Bottom Full-Width Section */}
      <div className="pt-2">
        <div className="card-premium p-5 rounded-2xl border border-white/5 bg-surface/30">
          <Upcoming />
        </div>
      </div>
    </div>
  );
}
