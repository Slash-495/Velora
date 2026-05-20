"use client";

import { motion } from "framer-motion";
import { Briefcase, FileText, CheckCircle2, TrendingUp, Clock, Sparkles } from "lucide-react";
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

export default function DashboardPage() {
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Welcome Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight">Welcome back</h1>
          <p className="text-text-muted mt-1">{date}</p>
        </div>
        
        <div className="flex items-center gap-4 bg-surface/50 border border-white/5 p-3 rounded-2xl backdrop-blur-md">
          <div className="flex flex-col px-3 border-r border-white/5">
            <span className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">Total Resumes</span>
            <span className="text-xl font-bold text-text-primary leading-none">6</span>
          </div>
          <div className="flex flex-col px-3">
            <span className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">Avg ATS Score</span>
            <span className="text-xl font-bold text-primary leading-none flex items-center gap-2">
              89 <TrendingUp className="w-4 h-4 text-primary-glow" />
            </span>
          </div>
        </div>
      </motion.div>

      {/* Career Tracks Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-text-secondary" />
            Active Career Tracks
          </h2>
          <Link href="/dashboard/tracks" className="text-sm font-medium text-primary hover:text-primary-glow transition-colors">
            View all
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 shadow-sm">
                      <FileText className={`w-5 h-5 ${track.text}`} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-background/50 rounded-lg p-2.5 border border-white/5">
                      <span className="block text-[10px] text-text-muted uppercase font-medium mb-1">Resumes</span>
                      <span className="text-sm font-bold text-text-primary">{track.resumes} variants</span>
                    </div>
                    <div className="bg-background/50 rounded-lg p-2.5 border border-white/5">
                      <span className="block text-[10px] text-text-muted uppercase font-medium mb-1">ATS Score</span>
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

      {/* Quick Start / AI Suggestion Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mt-8"
      >
        <motion.div variants={itemVariants} className="card-glass p-1 rounded-2xl bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 border border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-noise opacity-20" />
          <div className="bg-surface/90 backdrop-blur-xl rounded-xl p-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 shadow-glow-primary">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary mb-1">Optimize your Product Manager resume</h3>
                <p className="text-sm text-text-secondary max-w-xl">
                  Your Product Manager resume has an ATS score of 76. Velora AI has identified 3 missing keywords for recent job postings in your area.
                </p>
              </div>
            </div>
            <button className="btn-glow shrink-0 w-full md:w-auto px-6 py-2.5 rounded-xl">
              Fix with AI
            </button>
          </div>
        </motion.div>
      </motion.section>
    </div>
  );
}
