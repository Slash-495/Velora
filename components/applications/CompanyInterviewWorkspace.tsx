"use client";

import { useState, useEffect, useCallback } from "react";
import { Bot, Lightbulb, ShieldAlert, Zap, Loader2, Save, AlignLeft, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hooks/use-debounce";

export function CompanyInterviewWorkspace({ company }: { company: any }) {
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  // AI Insights State
  const [insights, setInsights] = useState<any>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  const debouncedNotes = useDebounce(notes, 1000);

  // Auto-save effect
  useEffect(() => {
    if (debouncedNotes) {
      setIsSaving(true);
      // Simulate API call
      const timer = setTimeout(() => setIsSaving(false), 800);
      return () => clearTimeout(timer);
    }
  }, [debouncedNotes]);

  const generateInsights = useCallback(async () => {
    if (!company) return;
    setIsGeneratingInsights(true);
    try {
      const res = await fetch("/api/ai/company-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          companyName: company.companyName || company.name, // Support both formats
          industry: company.industry || "Technology",
          notes: notes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInsights(data);
    } catch (err) {
      console.error(err);
      alert("Failed to generate insights.");
    } finally {
      setIsGeneratingInsights(false);
    }
  }, [company, notes]);

  const saveNotes = useCallback(() => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 800);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-8"
    >
      {/* Left Column: AI Insights Panel */}
      <div className="space-y-8">
        <section className="bg-gradient-to-br from-surface to-background border border-primary/20 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Bot className="w-24 h-24" />
          </div>
          
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 relative z-10">
            <Zap className="w-5 h-5 text-primary" />
            AI Prep Insights
          </h2>

          {!insights ? (
            <div className="relative z-10">
              <p className="text-sm text-text-secondary mb-6">
                Generate deep recruiter-level insights on {company.companyName || company.name}'s technical expectations, cultural focus, and interview red flags.
              </p>
              <button 
                onClick={generateInsights}
                disabled={isGeneratingInsights}
                className="w-full py-2.5 bg-primary text-background font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:shadow-glow-primary/20"
              >
                {isGeneratingInsights ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                {isGeneratingInsights ? "Analyzing Company..." : "Generate Insights"}
              </button>
            </div>
          ) : (
            <div className="relative z-10 space-y-6">
              <div>
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlignLeft className="w-3.5 h-3.5" /> Tech Stack Focus
                </h3>
                <div className="flex flex-wrap gap-2">
                  {insights.techStack.map((tech: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-white">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" /> Cultural Values
                </h3>
                <ul className="space-y-1.5">
                  {insights.culturalFocus.map((culture: string, i: number) => (
                    <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">•</span> {culture}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" /> Interview Red Flags
                </h3>
                <ul className="space-y-1.5">
                  {insights.redFlags.map((flag: string, i: number) => (
                    <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                      <span className="text-orange-400 mt-0.5">•</span> {flag}
                    </li>
                  ))}
                </ul>
              </div>
              
              <button 
                onClick={generateInsights}
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors border border-white/10"
              >
                <RefreshCw className="w-3 h-3" /> Refresh Insights
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Right Column: Research Notes Workspace */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-surface border border-white/5 rounded-3xl p-1 flex flex-col h-[700px]">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <AlignLeft className="w-5 h-5 text-text-muted" />
              Interview Notes
            </h2>
            <button 
              onClick={saveNotes}
              className="flex items-center gap-2 px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-colors text-white"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Save className="w-4 h-4 text-text-muted" />}
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
          
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={`Start typing your research, questions to ask the interviewer, and behavioral prep for ${company.companyName || company.name}...`}
            className="flex-1 w-full bg-transparent p-6 text-sm text-text-secondary leading-relaxed focus:outline-none resize-none placeholder:text-white/20 custom-scrollbar"
          />
        </div>
      </div>
    </motion.div>
  );
}
