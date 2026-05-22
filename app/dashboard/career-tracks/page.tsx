"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { CareerTracks } from "@/components/dashboard/widgets/CareerTracks";

export default function CareerTracksPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight">Career Tracks</h1>
          <p className="text-text-muted mt-1">Organized resume workspaces by career path.</p>
        </div>
        
        <button className="btn-glow shrink-0 px-6 py-2.5 rounded-xl flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Track
        </button>
      </motion.div>

      <div className="pt-4">
        <CareerTracks />
      </div>
    </div>
  );
}
