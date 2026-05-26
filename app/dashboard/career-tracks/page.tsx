"use client";

import { motion } from "framer-motion";
import { Plus, Search, Briefcase, FileText, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CareerTrack, mockTracks, mockResumes } from "@/lib/mock-data";
import { TrackModal } from "@/components/dashboard/career-tracks/TrackModal";

export default function CareerTracksPage() {
  const [tracks, setTracks] = useState<CareerTrack[]>(mockTracks);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate stats for each track
  const tracksWithStats = tracks.map(track => {
    const trackResumes = mockResumes.filter(r => r.trackId === track.id);
    const avgScore = trackResumes.length > 0 
      ? Math.round(trackResumes.reduce((acc, curr) => acc + curr.atsScore, 0) / trackResumes.length)
      : 0;

    // Map color strings to Tailwind classes
    const colorMap: Record<string, { bg: string, border: string, text: string }> = {
      blue: { bg: "from-blue-500/20 to-cyan-500/20", border: "group-hover:border-blue-500/30", text: "text-blue-400" },
      emerald: { bg: "from-emerald-500/20 to-teal-500/20", border: "group-hover:border-emerald-500/30", text: "text-emerald-400" },
      orange: { bg: "from-orange-500/20 to-red-500/20", border: "group-hover:border-orange-500/30", text: "text-orange-400" },
      purple: { bg: "from-purple-500/20 to-fuchsia-500/20", border: "group-hover:border-purple-500/30", text: "text-purple-400" },
      pink: { bg: "from-pink-500/20 to-rose-500/20", border: "group-hover:border-pink-500/30", text: "text-pink-400" },
    };

    return { ...track, resumesCount: trackResumes.length, avgScore, styles: colorMap[track.color] || colorMap.blue };
  });

  const filteredTracks = tracksWithStats.filter(track => {
    return track.name.toLowerCase().includes(searchQuery.toLowerCase()) || track.role.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSaveTrack = (newTrack: CareerTrack) => {
    mockTracks.push(newTrack);
    setTracks(prev => [newTrack, ...prev]);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight">Career Tracks</h1>
          <p className="text-text-muted mt-1">Organize and manage your targeted career paths.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-glow shrink-0 px-6 py-2.5 rounded-xl flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Track
        </button>
      </motion.div>

      {/* Toolbar (Search) */}
      <div className="flex flex-col justify-end items-end gap-4">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search tracks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-white/10 rounded-xl px-9 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
      </div>

      {/* Tracks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {filteredTracks.map((track, index) => (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link 
              href={`/dashboard/career-tracks/${track.id}`}
              className={`block h-full card-premium p-6 rounded-2xl border border-white/10 transition-all duration-300 hover:-translate-y-1 ${track.styles.border} group relative overflow-hidden`}
            >
              {/* Subtle accent glow */}
              <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${track.styles.bg} blur-[60px] opacity-40 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-bold text-text-primary text-xl tracking-tight mb-1">{track.name}</h3>
                    <p className="text-sm text-text-secondary font-medium">{track.role}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Briefcase className={`w-5 h-5 ${track.styles.text}`} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6 mt-auto">
                  <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                    <span className="block text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-1">Resumes</span>
                    <span className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-text-secondary" /> {track.resumesCount}
                    </span>
                  </div>
                  <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                    <span className="block text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-1">Avg Score</span>
                    <span className={`text-sm font-bold flex items-center gap-1 ${track.styles.text}`}>
                      {track.avgScore} <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end text-xs pt-4 border-t border-white/10 mt-auto">
                  <span className="flex items-center gap-1 text-text-secondary group-hover:text-white transition-colors font-medium">
                    Open Track <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}

        {/* Empty State / Add New Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: filteredTracks.length * 0.1 }}
        >
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full h-full min-h-[240px] card-premium border border-dashed border-white/20 hover:border-primary/50 hover:bg-primary/5 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:bg-primary/20 group-hover:text-primary">
              <Plus className="w-6 h-6 text-text-muted group-hover:text-primary transition-colors" />
            </div>
            <span className="text-sm font-medium text-text-secondary group-hover:text-primary transition-colors">Create New Track</span>
          </button>
        </motion.div>

      </div>

      <TrackModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTrack}
      />
    </div>
  );
}
