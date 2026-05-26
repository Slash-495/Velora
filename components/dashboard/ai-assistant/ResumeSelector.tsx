"use client";

import { useState } from "react";
import { mockResumes } from "@/lib/mock-data";
import { ChevronDown, FileText, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ResumeSelectorProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ResumeSelector({ selectedId, onSelect }: ResumeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedResume = mockResumes.find(r => r.id === selectedId);

  return (
    <div className="flex flex-col gap-2 relative">
      <label className="text-sm font-medium text-text-secondary">Select Baseline Resume</label>
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full bg-surface border border-white/10 rounded-xl p-4 hover:border-white/20 hover:bg-white/5 transition-all text-left group"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${selectedResume ? 'bg-primary/20 text-primary' : 'bg-white/5 text-text-muted'}`}>
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className={`font-medium ${selectedResume ? 'text-text-primary' : 'text-text-muted'}`}>
              {selectedResume ? selectedResume.name : "Choose a resume..."}
            </h4>
            {selectedResume && (
              <p className="text-xs text-text-secondary mt-0.5">
                ATS Score: {selectedResume.atsScore} • Last updated {new Date(selectedResume.updatedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full left-0 right-0 mt-2 bg-surface border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto custom-scrollbar"
            >
              {mockResumes.map(resume => (
                <button
                  key={resume.id}
                  onClick={() => {
                    onSelect(resume.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between w-full p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 ${
                    selectedId === resume.id ? 'bg-white/5' : ''
                  }`}
                >
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-medium text-text-primary">{resume.name}</span>
                    <span className="text-xs text-text-muted">Template: {resume.template}</span>
                  </div>
                  {selectedId === resume.id && (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
