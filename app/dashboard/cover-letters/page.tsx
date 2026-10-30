"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useRef, useCallback, useMemo } from "react";
import { 
  FileText, 
  Wand2, 
  Download, 
  Save, 
  Settings2,
  Building2,
  Briefcase,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  XCircle,
  RefreshCw
} from "lucide-react";

type Tone = "Professional" | "Confident" | "Technical" | "Startup-Friendly" | "Formal Corporate";

export default function CoverLetterStudio() {
  const [content, setContent] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState<Tone>("Professional");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Mock Suggestions
  const [suggestions, setSuggestions] = useState([
    { id: 1, type: "impact", text: "Quantify your impact to make this stronger.", original: "I improved performance.", improved: "I improved rendering performance by 40%.", status: "pending" }
  ]);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch("/api/ai/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, role, jobDescription, tone })
      });
      
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error?.message || "Failed to generate cover letter");
      }
      
      setContent(payload.data.coverLetter);
      
      // Clear or update mock suggestions
      setSuggestions([
        { id: 2, type: "tailoring", text: "Add more specific references to the company's recent projects.", original: "", improved: "", status: "pending" }
      ]);
    } catch (error: any) {
      console.error(error);
      setGenerateError(error.message || "Failed to generate cover letter.");
    } finally {
      setIsGenerating(false);
    }
  }, [company, role, jobDescription, tone]);

  const handleSave = useCallback(async () => {
    try {
      // Dynamically import html2pdf to avoid SSR issues
      const html2pdf = (await import('html2pdf.js')).default;
      
      const htmlContent = `
        <div style="padding: 60px; font-family: Georgia, serif; font-size: 11pt; line-height: 1.6; white-space: pre-wrap; color: black; background: white;">${content}</div>
      `;
      
      const opt = {
        margin:       0,
        filename:     `${company || 'Cover_Letter'}_${role || 'Role'}.pdf`.replace(/\s+/g, '_'),
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const }
      };

      html2pdf().set(opt).from(htmlContent).save();
    } catch (error) {
      console.error("Failed to generate PDF", error);
      alert("Failed to download PDF.");
    }
  }, [company, role, content]);

  const applySuggestion = useCallback((id: number, improvedText: string) => {
    if (improvedText) {
      // In a real robust app, this would do a targeted replace.
      // For this textarea version, we just append or manually let user copy.
      setContent(prev => prev + "\n\n[Applied Suggestion]: " + improvedText);
    }
    setSuggestions(prev => prev.filter(s => s.id !== id));
  }, []);

  const dismissSuggestion = useCallback((id: number) => {
    setSuggestions(prev => prev.filter(s => s.id !== id));
  }, []);

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden print:h-auto print:block">
      
      {/* Left Configuration Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full shrink-0 border-r border-white/5 bg-surface/30 backdrop-blur-md overflow-y-auto custom-scrollbar flex flex-col print:hidden"
          >
            <div className="p-6 space-y-8">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                  <Settings2 className="w-5 h-5 text-primary" />
                  Configuration
                </h2>
                <p className="text-xs text-text-muted">Tailor your cover letter instantly.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4" /> Company Name
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder="e.g. Google"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> Target Role
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder="e.g. Senior Frontend Engineer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    Writing Tone
                  </label>
                  <select 
                    value={tone}
                    onChange={(e) => setTone(e.target.value as Tone)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
                  >
                    <option className="bg-background">Professional</option>
                    <option className="bg-background">Confident</option>
                    <option className="bg-background">Technical</option>
                    <option className="bg-background">Startup-Friendly</option>
                    <option className="bg-background">Formal Corporate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    Job Description
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full h-40 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-colors custom-scrollbar resize-none"
                    placeholder="Paste the JD here to deeply tailor your letter..."
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full btn-glow py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      Generate Letter
                    </>
                  )}
                </button>
                {generateError && (
                  <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                    {generateError}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Document Canvas */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-background print:bg-white relative flex flex-col">
        
        {/* Workspace Toolbar */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
            >
              <Settings2 className="w-4 h-4 text-text-secondary" />
            </button>
            <div className="h-4 w-px bg-white/10" />
            <input 
              type="text" 
              defaultValue="Untitled Version"
              className="bg-transparent text-lg font-bold text-white focus:outline-none placeholder-white/30 w-64"
            />
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary rounded-lg text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>

        {/* The A4 Document */}
        <div className="flex-1 p-8 md:p-12 flex justify-center print:p-0">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black shadow-2xl print:shadow-none p-12 md:p-20 outline-none"
          >
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Your cover letter content will appear here...&#10;&#10;You can also type directly to edit."
              className="w-full h-full min-h-[800px] resize-none focus:outline-none bg-transparent text-black text-[11pt] font-serif leading-relaxed"
              style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
            />
          </motion.div>
        </div>
      </div>

      {/* Right AI Suggestions Panel */}
      <div className="w-80 shrink-0 border-l border-white/5 bg-surface/30 backdrop-blur-md overflow-y-auto custom-scrollbar flex flex-col print:hidden">
        <div className="p-6 sticky top-0 bg-surface/80 backdrop-blur-xl border-b border-white/5 z-10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Suggestions
          </h2>
        </div>

        <div className="p-4 space-y-4">
          <AnimatePresence>
            {suggestions.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center p-6 border border-dashed border-white/10 rounded-2xl"
              >
                <MessageSquare className="w-8 h-8 text-white/20 mx-auto mb-3" />
                <p className="text-xs text-text-muted">No suggestions yet. Generate a letter to get AI feedback.</p>
              </motion.div>
            ) : (
              suggestions.map((s) => (
                <motion.div 
                  key={s.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 shadow-lg group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  <p className="text-sm font-medium text-white leading-snug mb-3 pl-1">
                    {s.text}
                  </p>
                  
                  {s.improved && (
                    <div className="bg-black/30 rounded-lg p-3 mb-4 text-xs font-serif text-white/80 italic border border-white/5">
                      "{s.improved}"
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    {s.improved && (
                      <button 
                        onClick={() => applySuggestion(s.id, s.improved)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Apply
                      </button>
                    )}
                    <button 
                      onClick={() => dismissSuggestion(s.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-white/5 hover:bg-white/10 text-text-muted hover:text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Dismiss
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
      
    </div>
  );
}
