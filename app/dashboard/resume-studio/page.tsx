"use client";

import { motion } from "framer-motion";
import { Plus, Search } from "lucide-react";
import { RecentResumes } from "@/components/dashboard/widgets/RecentResumes";

export default function ResumeStudioPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight">Resume Studio</h1>
          <p className="text-text-muted mt-1">A clean workspace for managing your tailored resumes.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search resumes..."
              className="w-full bg-black/20 border border-white/10 rounded-xl px-9 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <button className="btn-glow shrink-0 px-5 py-2.5 rounded-xl flex items-center gap-2 h-[42px]">
            <Plus className="w-4 h-4" /> New Resume
          </button>
        </div>
      </motion.div>

      <div className="pt-4">
        <RecentResumes />
      </div>
    </div>
  );
}
