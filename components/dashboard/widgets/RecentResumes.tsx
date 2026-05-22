"use client";

import { motion } from "framer-motion";
import { FileText, MoreHorizontal, Edit3, Download, Copy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const recentResumes = [
  {
    id: 1,
    name: "Senior Frontend Engineer",
    track: "SDE Track",
    score: 92,
    updated: "2 hours ago"
  },
  {
    id: 2,
    name: "Product Analytics focused",
    track: "Data Analyst",
    score: 88,
    updated: "1 day ago"
  },
  {
    id: 3,
    name: "Google SWE tailored",
    track: "SDE Track",
    score: 95,
    updated: "3 days ago"
  }
];

export function RecentResumes() {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <FileText className="w-5 h-5 text-text-secondary" />
          Recent Resumes
        </h2>
        <Link href="/resume" className="text-sm font-medium text-primary hover:text-primary-glow transition-colors">
          View all
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {recentResumes.map((resume, index) => (
          <motion.div
            key={resume.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative bg-surface border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary text-sm mb-1">{resume.name}</h3>
                  <div className="flex items-center gap-3 text-[11px] text-text-muted font-medium uppercase tracking-wider">
                    <span>{resume.track}</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span className={resume.score >= 90 ? "text-emerald-400" : "text-amber-400"}>
                      {resume.score} ATS
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <button 
                  onClick={() => setOpenMenuId(openMenuId === resume.id ? null : resume.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-text-muted transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                
                {/* Minimal Dropdown Menu */}
                {openMenuId === resume.id && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setOpenMenuId(null)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-40 bg-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 py-1 backdrop-blur-xl">
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors text-left">
                        <Edit3 className="w-3.5 h-3.5" /> Edit Resume
                      </button>
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors text-left">
                        <Copy className="w-3.5 h-3.5" /> Tailor to JD
                      </button>
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors text-left">
                        <Download className="w-3.5 h-3.5" /> Export PDF
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
