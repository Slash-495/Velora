"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Check, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { Resume, mockResumes } from "@/lib/mock-data";

interface AddResumeToTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (resume: Resume) => void;
  existingResumeIds: string[];
}

export function AddResumeToTrackModal({ isOpen, onClose, onSelect, existingResumeIds }: AddResumeToTrackModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const availableResumes = useMemo(() => {
    return mockResumes
      .filter(r => !existingResumeIds.includes(r.id))
      .filter(r => 
        (r.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
        (r.content?.roleTitle || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [searchQuery, existingResumeIds]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-surface border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]"
        >
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5 shrink-0">
            <div>
              <h2 className="text-xl font-bold text-text-primary">Add Resume</h2>
              <p className="text-sm text-text-muted mt-1">Select a resume from your studio to link to this track.</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-text-muted hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 border-b border-white/10 bg-surface shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search your resumes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-9 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>

          <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableResumes.map((resume) => (
                <button
                  key={resume.id}
                  onClick={() => onSelect(resume)}
                  className="flex flex-col text-left p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all group relative"
                >
                  <div className="flex items-start justify-between mb-3 w-full">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/20 transition-all">
                      <Check className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-text-primary text-sm line-clamp-1">{resume.name}</h3>
                  <p className="text-xs text-text-muted mt-1 line-clamp-1">{resume.content.roleTitle}</p>
                  
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5 w-full">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${resume.atsScore >= 90 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {resume.atsScore} ATS
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {new Date(resume.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))}

              {availableResumes.length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-xl">
                  <FileText className="w-8 h-8 text-text-muted mb-2 opacity-50" />
                  <p className="text-sm font-medium text-text-muted">No resumes found</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
