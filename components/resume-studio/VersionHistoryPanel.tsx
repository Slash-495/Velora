"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, History, Copy, RefreshCcw, Clock } from "lucide-react";

interface VersionHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  resumeId: string;
}

export function VersionHistoryPanel({ isOpen, onClose, resumeId }: VersionHistoryPanelProps) {
  // Mock versions for now until Supabase integration
  const versions = [
    { id: "v1", name: "Current Version", date: new Date(), isCurrent: true, atsScore: 92 },
    { id: "v2", name: "Amazon Tailored", date: new Date(Date.now() - 86400000), isCurrent: false, atsScore: 88 },
    { id: "v3", name: "Original Draft", date: new Date(Date.now() - 172800000), isCurrent: false, atsScore: 65 },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-sm h-full bg-surface border-l border-white/10 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-primary leading-tight">History</h2>
                  <p className="text-xs text-text-muted mt-0.5">Manage and restore versions.</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              
              <div className="mb-4">
                <button className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-text-primary hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                  <Copy className="w-4 h-4" />
                  Save Current as Snapshot
                </button>
              </div>

              <div className="flex flex-col gap-4 relative">
                {/* Timeline line */}
                <div className="absolute left-[15px] top-4 bottom-4 w-px bg-white/10" />

                {versions.map((v, i) => (
                  <div key={v.id} className="relative flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-surface border-4 border-[#121212] flex items-center justify-center z-10 shrink-0 mt-1">
                      <div className={`w-2.5 h-2.5 rounded-full ${v.isCurrent ? 'bg-primary shadow-glow-primary' : 'bg-white/20'}`} />
                    </div>
                    
                    <div className={`flex-1 p-4 rounded-2xl border ${v.isCurrent ? 'bg-primary/5 border-primary/30' : 'bg-white/5 border-white/10'} flex flex-col gap-3 group transition-colors hover:bg-white/10 hover:border-white/20`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-text-primary">{v.name}</h4>
                          <p className="text-[10px] text-text-muted flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" /> {v.date.toLocaleString()}
                          </p>
                        </div>
                        {v.atsScore > 0 && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                            {v.atsScore} ATS
                          </span>
                        )}
                      </div>

                      {!v.isCurrent && (
                        <div className="flex gap-2 pt-2 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-medium text-text-secondary flex items-center justify-center gap-1">
                            <RefreshCcw className="w-3 h-3" /> Restore
                          </button>
                          <button className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-medium text-text-secondary flex items-center justify-center gap-1">
                            <Copy className="w-3 h-3" /> Duplicate
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
