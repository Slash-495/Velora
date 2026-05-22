"use client";

import { motion } from "framer-motion";
import { Plus, Search, FileText, CheckCircle2, MoreHorizontal, ArrowRight, Edit3, Download, Copy, Trash2, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { mockResumes, mockTracks } from "@/lib/mock-data";

const TABS = ["All Resumes", "Recent", "High ATS Score"];

export default function ResumeStudioPage() {
  const [activeTab, setActiveTab] = useState("All Resumes");
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filteredResumes = mockResumes.filter(resume => {
    const matchesSearch = resume.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesTab = true;
    if (activeTab === "High ATS Score") matchesTab = resume.atsScore >= 90;
    // For "Recent", we could sort or filter by date. Assuming all are recent for mock.

    return matchesSearch && matchesTab;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight">Resume Studio</h1>
          <p className="text-text-muted mt-1">Manage, tailor, and optimize your career documents.</p>
        </div>
        
        <Link href="/dashboard/resume-studio/new" className="btn-glow shrink-0 px-6 py-2.5 rounded-xl flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Resume
        </Link>
      </motion.div>

      {/* Toolbar (Search & Filters) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex bg-surface border border-white/5 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab 
                  ? "bg-white/10 text-text-primary shadow-sm" 
                  : "text-text-secondary hover:text-text-primary hover:bg-white/5"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search resumes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-xl px-9 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Resumes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {filteredResumes.map((resume, index) => {
          const track = mockTracks.find(t => t.id === resume.trackId);
          
          return (
            <motion.div
              key={resume.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card-premium p-5 rounded-2xl border border-white/10 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 group relative"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary text-lg leading-tight">{resume.name}</h3>
                    <p className="text-xs text-text-muted font-medium mt-0.5">{track?.name || 'Unassigned Track'}</p>
                  </div>
                </div>
                
                {/* Context Menu */}
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
                        <Link href={`/dashboard/resume-studio/${resume.id}`} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors text-left">
                          <Edit3 className="w-4 h-4" /> Edit Resume
                        </Link>
                        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors text-left">
                          <LayoutTemplate className="w-4 h-4" /> Change Template
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors text-left">
                          <Copy className="w-4 h-4" /> Duplicate
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors text-left">
                          <Download className="w-4 h-4" /> Export PDF
                        </button>
                        <div className="h-px bg-white/5 my-1 mx-2" />
                        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left">
                          <Trash2 className="w-4 h-4" /> Delete Resume
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Stats/Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                  <span className="block text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-1">ATS Score</span>
                  <span className={`text-sm font-bold flex items-center gap-1.5 ${resume.atsScore >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {resume.atsScore} <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                  <span className="block text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-1">Template</span>
                  <span className="text-sm font-bold text-text-primary truncate">
                    {resume.template}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-4 border-t border-white/5">
                <span className="text-text-secondary font-medium">
                  Updated {new Date(resume.updatedAt).toLocaleDateString()}
                </span>
                <Link 
                  href={`/dashboard/resume-studio/${resume.id}`}
                  className="flex items-center gap-1 text-primary hover:text-primary-glow transition-colors font-semibold"
                >
                  Open Editor <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          );
        })}

        {/* Empty State / Add New Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: filteredResumes.length * 0.1 }}
        >
          <Link 
            href="/dashboard/resume-studio/new"
            className="w-full h-full min-h-[220px] card-premium border border-dashed border-white/20 hover:border-primary/50 hover:bg-primary/5 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all group block"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:bg-primary/20 group-hover:text-primary">
              <Plus className="w-6 h-6 text-text-muted group-hover:text-primary transition-colors" />
            </div>
            <span className="text-sm font-medium text-text-secondary group-hover:text-primary transition-colors">Create Blank Resume</span>
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
