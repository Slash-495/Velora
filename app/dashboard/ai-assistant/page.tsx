"use client";

import { useState } from "react";
import { ResumeSelector } from "@/components/dashboard/ai-assistant/ResumeSelector";
import { JobDescriptionInput } from "@/components/dashboard/ai-assistant/JobDescriptionInput";
import { ATSAnalysisScore } from "@/components/dashboard/ai-assistant/ATSAnalysisScore";
import { AISuggestionsPanel } from "@/components/dashboard/ai-assistant/AISuggestionsPanel";
import { motion, AnimatePresence } from "framer-motion";

import { mockResumes } from "@/lib/mock-data";

export default function AIAssistantPage() {
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [currentJdData, setCurrentJdData] = useState<{ text: string; company: string; role: string } | undefined>(undefined);

  const handleAnalyze = async (jd: { text: string; company: string; role: string }) => {
    if (!selectedResumeId || !jd.text) return;
    
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setAnalysisError(null);
    setCurrentJdData(jd);

    try {
      const selectedResume = mockResumes.find(r => r.id === selectedResumeId);
      
      const response = await fetch('/api/ai/analyze-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeContent: selectedResume?.content,
          jdText: jd.text,
          company: jd.company,
          role: jd.role
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message || "Failed to analyze resume");
      }
      
      setAnalysisResult(payload.data);
    } catch (error: any) {
      console.error(error);
      setAnalysisError(error.message || "Failed to analyze resume.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-1 shrink-0">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          AI Resume Optimization
        </h1>
        <p className="text-text-secondary text-sm">
          Tailor your resume precisely to job descriptions using intelligent ATS analysis.
        </p>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex flex-1 gap-6 min-h-0">
        
        {/* Left Column: Inputs & Selector */}
        <div className="w-1/3 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 pb-4">
          <ResumeSelector 
            selectedId={selectedResumeId} 
            onSelect={setSelectedResumeId} 
          />
          
          <JobDescriptionInput 
            onAnalyze={handleAnalyze} 
            isAnalyzing={isAnalyzing}
            canAnalyze={!!selectedResumeId}
          />
        </div>

        {/* Right Column: Analysis & Suggestions */}
        <div className="w-2/3 flex flex-col gap-6 overflow-hidden bg-surface/30 rounded-2xl border border-white/5 backdrop-blur-sm relative">
          
          <AnimatePresence mode="wait">
            {analysisError && !isAnalyzing ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center p-12"
              >
                <div className="max-w-md bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-red-400">
                  <h3 className="text-base font-semibold mb-2">ATS Analysis Failed</h3>
                  <p className="text-sm text-red-300/90">{analysisError}</p>
                </div>
              </motion.div>
            ) : !analysisResult && !isAnalyzing ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center p-12 text-text-muted"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                  <span className="text-2xl">✨</span>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Ready to Optimize</h3>
                <p className="max-w-xs text-sm">
                  Select a resume and paste a job description to generate intelligent ATS tailoring suggestions.
                </p>
              </motion.div>
            ) : isAnalyzing ? (
              <motion.div 
                key="analyzing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex-1 flex flex-col items-center justify-center"
              >
                {/* Premium Loading State */}
                <div className="relative w-24 h-24 mb-6">
                  <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin"></div>
                  <div className="absolute inset-2 rounded-full border-r-2 border-secondary animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                  <div className="absolute inset-0 flex items-center justify-center text-xl">🤖</div>
                </div>
                <h3 className="text-lg font-medium text-text-primary mb-2">Analyzing ATS Match</h3>
                <p className="text-text-muted text-sm animate-pulse">Cross-referencing keywords and impact statements...</p>
              </motion.div>
            ) : (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-6 gap-6"
              >
                <ATSAnalysisScore result={analysisResult} />
                <div className="h-px bg-white/10 w-full shrink-0" />
                <AISuggestionsPanel 
                  resumeId={selectedResumeId} 
                  analysisResult={analysisResult} 
                  jdData={currentJdData}
                />
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
