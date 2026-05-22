"use client";

import { motion } from "framer-motion";
import { QuickActions } from "@/components/dashboard/widgets/QuickActions";
import { ActivityTimeline } from "@/components/dashboard/widgets/ActivityTimeline";

export default function DashboardPage() {
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Welcome Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight">Welcome back</h1>
        <p className="text-text-muted mt-1">{date}</p>
      </motion.div>

      {/* Clean Dashboard Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        
        {/* Left Column: Quick Actions */}
        <div className="space-y-8">
          <div className="card-premium p-6 rounded-2xl border border-white/5 bg-surface/50">
            <QuickActions />
          </div>
        </div>

        {/* Right Column: Activity Timeline */}
        <div className="space-y-8">
          <div className="card-premium p-6 rounded-2xl border border-white/5 bg-surface/50">
            <ActivityTimeline />
          </div>
        </div>

      </div>
    </div>
  );
}
