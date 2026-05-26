"use client";

import { motion } from "framer-motion";
import { ArrowLeft, FileText, CheckCircle2, MoreHorizontal, Edit3, Download, Copy, Plus, Briefcase } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { mockTracks, mockResumes, Resume } from "@/lib/mock-data";

export default function TrackDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const trackId = params.trackId as string;
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // Load track data
  const track = mockTracks.find(t => t.id === trackId);
  
  // Local state for resumes in this track
  const [trackResumes, setTrackResumes] = useState<Resume[]>([]);

  useEffect(() => {
    setTrackResumes(mockResumes.filter(r => r.trackId === trackId));
  }, [trackId]);

  if (!track) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-xl font-bold text-text-primary">Track Not Found</h2>
        <Link href="/dashboard/career-tracks" className="text-primary hover:text-primary-glow mt-4">
          Return to Tracks
        </Link>
      </div>
    );
  }

  const avgScore = trackResumes.length > 0 
    ? Math.round(trackResumes.reduce((acc, curr) => acc + curr.atsScore, 0) / trackResumes.length)
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Breadcrumb & Navigation */}
      <Link href="/dashboard/career-tracks" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Career Tracks
      </Link>

      {/* Track Workspace Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card-premium p-8 rounded-3xl border border-white/10 bg-surface/50 relative overflow-hidden"
      >
        {/* Subtle accent glow matching track color */}
        <div className={`absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-${track.color}-500/20 to-transparent blur-[80px] opacity-60`} />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg">
              <Briefcase className={`w-8 h-8 text-${track.color}-400`} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-1">{track.name}</h1>
              <p className="text-text-secondary font-medium">{track.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-black/20 p-3 rounded-2xl border border-white/5">
            <div className="px-4 border-r border-white/5">
              <span className="block text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-1">Total Resumes</span>
              <span className="text-xl font-bold text-text-primary">{trackResumes.length}</span>
            </div>
            <div className="px-4">
              <span className="block text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-1">Avg ATS Score</span>
              <span className={`text-xl font-bold flex items-center gap-1.5 text-${track.color}-400`}>
                {avgScore} <CheckCircle2 className="w-5 h-5" />
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Resumes Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary">Tailored Resumes</h2>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push(`/dashboard/resume-studio`)}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Import Resume
            </button>
            <button 
              onClick={() => router.push(`/dashboard/resume-studio/new`)}
              className="btn-glow px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Resume
            </button>
          </div>
        </div>

        {/* Resumes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {trackResumes.map((resume, index) => (
            <motion.div
              key={resume.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="card-premium p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all hover:-translate-y-1 group relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                
                <div className="relative">
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === resume.id ? null : resume.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-text-muted transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  
                  {openMenuId === resume.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                      <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 py-1 backdrop-blur-xl">
                        <button 
                          onClick={() => {
                            setOpenMenuId(null);
                            router.push(`/dashboard/resume-studio`);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors text-left"
                        >
                          <Edit3 className="w-4 h-4" /> Edit Resume
                        </button>
                        <button 
                          onClick={() => {
                            setOpenMenuId(null);
                            const copy = { ...resume, id: `res-${Date.now()}`, title: `${resume.title} (Copy)` };
                            setTrackResumes(prev => [...prev, copy]);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors text-left"
                        >
                          <Copy className="w-4 h-4" /> Duplicate
                        </button>
                        <div className="h-px bg-white/5 my-1 mx-2" />
                        <button 
                          onClick={() => {
                            setOpenMenuId(null);
                            setTrackResumes(prev => prev.filter(r => r.id !== resume.id));
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left"
                        >
                          Delete Resume
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-text-primary text-lg mb-1">{resume.name}</h3>
                <p className="text-xs text-text-muted">Template: {resume.template}</p>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                <span className={`text-sm font-bold flex items-center gap-1.5 ${
                  resume.atsScore >= 90 ? "text-emerald-400" : "text-amber-400"
                }`}>
                  {resume.atsScore} ATS
                </span>
                <span className="text-[10px] uppercase font-medium tracking-wider text-text-secondary">
                  Edited {new Date(resume.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          ))}

          {trackResumes.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-surface/30">
              <FileText className="w-12 h-12 text-text-muted mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-text-primary">No resumes yet</h3>
              <p className="text-sm text-text-muted mt-1">Create your first resume for this career track.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
