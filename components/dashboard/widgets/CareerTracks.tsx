"use client";

import { motion } from "framer-motion";
import { Briefcase, FileText, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";

const careerTracks = [
  {
    name: "SDE Track",
    role: "Backend / Fullstack",
    resumes: 3,
    avgScore: 94,
    lastUpdated: "2h ago",
    status: "Active",
    color: "from-blue-500/20 to-cyan-500/20",
    border: "group-hover:border-blue-500/30",
    text: "text-blue-400"
  },
  {
    name: "Data Analyst",
    role: "SQL / Python",
    resumes: 2,
    avgScore: 88,
    lastUpdated: "1d ago",
    status: "Active",
    color: "from-emerald-500/20 to-teal-500/20",
    border: "group-hover:border-emerald-500/30",
    text: "text-emerald-400"
  },
  {
    name: "Product Manager",
    role: "Tech / Strategy",
    resumes: 1,
    avgScore: 76,
    lastUpdated: "3d ago",
    status: "Needs Optimization",
    color: "from-orange-500/20 to-red-500/20",
    border: "group-hover:border-orange-500/30",
    text: "text-orange-400"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function CareerTracks() {
  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-text-secondary" />
          Career Tracks
        </h2>
        <Link href="/dashboard/tracks" className="text-sm font-medium text-primary hover:text-primary-glow transition-colors">
          View all
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {careerTracks.map((track) => (
          <motion.div key={track.name} variants={itemVariants}>
            <Link href="#" className={`block h-full card-premium p-5 rounded-2xl border border-white/10 transition-all duration-300 hover:-translate-y-1 ${track.border} group relative overflow-hidden`}>
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${track.color} blur-[50px] opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-text-primary text-lg leading-none mb-1">{track.name}</h3>
                    <p className="text-xs text-text-muted">{track.role}</p>
                  </div>
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 shadow-sm group-hover:scale-110 transition-transform">
                    <Briefcase className={`w-5 h-5 ${track.text}`} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-background/50 rounded-lg p-2.5 border border-white/5">
                    <span className="block text-[10px] text-text-muted uppercase font-medium mb-1">Resumes</span>
                    <span className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-text-secondary" /> {track.resumes}
                    </span>
                  </div>
                  <div className="bg-background/50 rounded-lg p-2.5 border border-white/5">
                    <span className="block text-[10px] text-text-muted uppercase font-medium mb-1">Avg Score</span>
                    <span className={`text-sm font-bold flex items-center gap-1 ${track.text}`}>
                      {track.avgScore} <CheckCircle2 className="w-3 h-3" />
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-4 border-t border-white/5">
                  <span className="flex items-center gap-1.5 text-text-muted">
                    <Clock className="w-3.5 h-3.5" />
                    Updated {track.lastUpdated}
                  </span>
                  <span className={`font-medium ${track.text}`}>
                    {track.status}
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
