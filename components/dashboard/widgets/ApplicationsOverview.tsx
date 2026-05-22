"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Send, Plus, X, Building2, ChevronDown, CheckCircle2 } from "lucide-react";
import { useState } from "react";

const STAGES = ["Applied", "OA", "Interview", "Offer Letter"];

const mockResumes = [
  "Senior Frontend Engineer",
  "Product Analytics focused",
  "Google SWE tailored"
];

// Initial mock data
const initialApplications = [
  { id: 1, company: "Stripe", role: "Frontend Engineer", stage: "Interview", resume: "Senior Frontend Engineer" },
  { id: 2, company: "Netflix", role: "UI Engineer", stage: "Applied", resume: "Senior Frontend Engineer" },
  { id: 3, company: "Google", role: "Software Engineer", stage: "OA", resume: "Google SWE tailored" },
];

export function ApplicationsOverview() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [applications, setApplications] = useState(initialApplications);
  
  // Form state
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [stage, setStage] = useState(STAGES[0]);
  const [resume, setResume] = useState(mockResumes[0]);

  const handleAddApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    const newApp = {
      id: Date.now(),
      company,
      role: role || "Software Engineer",
      stage,
      resume
    };
    
    setApplications([newApp, ...applications]);
    setIsModalOpen(false);
    
    // Reset form
    setCompany("");
    setRole("");
    setStage(STAGES[0]);
    setResume(mockResumes[0]);
  };

  // Group applications by stage to show counts
  const stageCounts = STAGES.map(s => ({
    name: s,
    count: applications.filter(a => a.stage === s).length
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Send className="w-5 h-5 text-text-secondary" />
          Applications Pipeline
        </h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="text-sm font-medium text-primary hover:text-primary-glow transition-colors flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      {/* Horizontal Pipeline View */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stageCounts.map((stageItem, index) => (
          <motion.div
            key={stageItem.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-surface border border-white/5 rounded-2xl p-4 flex flex-col justify-between h-24 relative overflow-hidden group"
          >
            {/* Subtle glow if there are applications in this stage */}
            {stageItem.count > 0 && (
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 blur-2xl rounded-full" />
            )}
            
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider relative z-10">
              {stageItem.name}
            </h3>
            <div className="flex items-end justify-between relative z-10">
              <span className="text-2xl font-bold text-text-primary">{stageItem.count}</span>
              {stageItem.count > 0 && <CheckCircle2 className="w-4 h-4 text-primary opacity-50" />}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Applications List Preview */}
      <div className="bg-surface/50 border border-white/5 rounded-2xl p-1 overflow-hidden mt-2">
        {applications.slice(0, 3).map((app, index) => (
          <div key={app.id} className={`flex items-center justify-between p-3 ${index !== 0 ? 'border-t border-white/5' : ''} hover:bg-white/5 transition-colors rounded-xl`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-text-secondary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text-primary">{app.company}</h4>
                <p className="text-[10px] text-text-muted">{app.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden md:inline-block text-[10px] text-text-muted max-w-[120px] truncate">
                {app.resume}
              </span>
              <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-white/10 text-text-secondary border border-white/5 whitespace-nowrap">
                {app.stage}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Application Modal (Overlay) */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <h3 className="text-lg font-semibold text-text-primary">Log Application</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-text-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddApplication} className="p-5 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary ml-1">Company Name</label>
                  <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="e.g. Google, Stripe"
                    autoFocus
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary ml-1">Role (Optional)</label>
                  <input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="e.g. Software Engineer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary ml-1">Resume Used</label>
                  <div className="relative">
                    <select
                      value={resume}
                      onChange={(e) => setResume(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    >
                      {mockResumes.map(r => (
                        <option key={r} value={r} className="bg-surface text-text-primary">{r}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-text-muted absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary ml-1">Current Stage</label>
                  <div className="relative">
                    <select
                      value={stage}
                      onChange={(e) => setStage(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    >
                      {STAGES.map(s => (
                        <option key={s} value={s} className="bg-surface text-text-primary">{s}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-text-muted absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <button type="submit" className="btn-glow w-full py-3 rounded-xl mt-2">
                  Save Application
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
