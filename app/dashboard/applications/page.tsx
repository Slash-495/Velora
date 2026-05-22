"use client";

import { motion } from "framer-motion";
import { ApplicationsOverview } from "@/components/dashboard/widgets/ApplicationsOverview";

export default function ApplicationsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight">Applications</h1>
          <p className="text-text-muted mt-1">A modern job application management workspace.</p>
        </div>
      </motion.div>

      <div className="pt-4">
        <ApplicationsOverview />
      </div>
    </div>
  );
}
