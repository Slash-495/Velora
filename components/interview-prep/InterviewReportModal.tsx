"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Award, CheckCircle, AlertCircle, FileText, Loader2, RefreshCw } from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleTitle: string;
  userName: string;
  history: { role: "ai" | "user"; text: string }[];
}

export function InterviewReportModal({ isOpen, onClose, roleTitle, userName, history }: ReportModalProps) {
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;

    async function evaluateSession() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/ai/evaluate-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: roleTitle,
            userName,
            history
          })
        });

        const data = await res.json();
        setReport(data);
      } catch (err) {
        console.error("Evaluation error:", err);
        const userResponses = history.filter(h => h.role === "user");
        if (userResponses.length === 0) {
          setReport({
            score: 0,
            status: "Incomplete / No Answers",
            summary: "The interview was ended before any answers were provided.",
            technicalDepth: 0,
            communication: 0,
            problemSolving: 0,
            strengths: ["No spoken responses recorded."],
            areasForImprovement: ["Attempt all screening questions to receive an evaluation."],
            isComplete: false
          });
        }
      } finally {
        setIsLoading(false);
      }
    }

    evaluateSession();
  }, [isOpen, history, roleTitle, userName]);

  if (!isOpen) return null;

  const handleDownloadReport = () => {
    if (!report) return;

    const reportData = {
      title: `Velora AI Technical Screen Performance Report`,
      candidate: userName,
      targetRole: roleTitle,
      date: new Date().toLocaleDateString(),
      overallScore: `${report.score}/100`,
      status: report.status,
      summary: report.summary,
      competencyBreakdown: {
        technicalDepth: `${report.technicalDepth}%`,
        communicationClarity: `${report.communication}%`,
        problemSolving: `${report.problemSolving}%`,
      },
      strengths: report.strengths || [],
      areasForImprovement: report.areasForImprovement || [],
      transcript: history
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Velora_AI_Interview_Report_${userName.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl max-h-[90vh] bg-[#12161f] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/20 border border-primary/30 text-primary">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Technical Screen Performance Evaluation</h2>
                <p className="text-xs text-text-muted">Candidate: {userName} • Role: {roleTitle}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-text-muted hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Report Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            
            {isLoading ? (
              <div className="h-64 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
                <p className="text-sm font-semibold text-text-muted">Analyzing your interview responses with Gemini AI...</p>
              </div>
            ) : report ? (
              <>
                {/* Score Card Banner */}
                <div className={`border rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl ${
                  report.score === 0 
                    ? 'bg-red-500/10 border-red-500/30' 
                    : report.score >= 80 
                    ? 'bg-gradient-to-r from-emerald-500/20 to-primary/20 border-emerald-500/30' 
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}>
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-widest text-text-muted">Overall Performance Rating</span>
                    <h3 className={`text-3xl font-extrabold mt-1 ${
                      report.score === 0 ? 'text-red-400' : report.score >= 80 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {report.status}
                    </h3>
                    <p className="text-xs text-text-muted mt-1 max-w-md">
                      {report.summary}
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-black/40 border border-white/10 rounded-2xl px-6 py-4 shrink-0 text-center min-w-[120px]">
                    <span className={`text-4xl font-black ${
                      report.score === 0 ? 'text-red-400' : report.score >= 80 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {report.score}
                    </span>
                    <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider mt-0.5">out of 100</span>
                  </div>
                </div>

                {/* Competency Ratings Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                    <span className="text-xs font-medium text-text-muted">Technical Depth</span>
                    <div className="text-xl font-bold text-white">{report.technicalDepth}%</div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-2">
                      <div className="bg-emerald-400 h-full transition-all duration-500" style={{ width: `${report.technicalDepth}%` }} />
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                    <span className="text-xs font-medium text-text-muted">Communication</span>
                    <div className="text-xl font-bold text-white">{report.communication}%</div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-2">
                      <div className="bg-primary h-full transition-all duration-500" style={{ width: `${report.communication}%` }} />
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                    <span className="text-xs font-medium text-text-muted">Problem Solving</span>
                    <div className="text-xl font-bold text-white">{report.problemSolving}%</div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-2">
                      <div className="bg-purple-400 h-full transition-all duration-500" style={{ width: `${report.problemSolving}%` }} />
                    </div>
                  </div>
                </div>

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Strengths Identified
                    </h4>
                    <ul className="text-xs text-text-secondary space-y-2 list-disc list-inside">
                      {report.strengths?.map((s: string, idx: number) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Areas to Refine
                    </h4>
                    <ul className="text-xs text-text-secondary space-y-2 list-disc list-inside">
                      {report.areasForImprovement?.map((a: string, idx: number) => (
                        <li key={idx}>{a}</li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* Full Interview Transcript */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Screening Transcript ({history.length} Messages)
                  </h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-2 pt-1 text-xs">
                    {history.map((item, idx) => (
                      <div key={idx} className={`p-3 rounded-xl ${item.role === 'ai' ? 'bg-black/40 border border-white/5 text-white/90' : 'bg-primary/10 border border-primary/20 text-primary-light'}`}>
                        <span className="font-bold text-[10px] uppercase block mb-1 opacity-60">
                          {item.role === 'ai' ? 'AI Recruiter' : userName}
                        </span>
                        {item.text}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}

          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between p-5 border-t border-white/10 bg-[#12161f] shrink-0">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-semibold text-text-muted hover:text-white transition-colors text-sm"
            >
              Close & Exit
            </button>
            <button 
              onClick={handleDownloadReport}
              disabled={isLoading || report?.score === 0}
              className="px-8 py-3 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all flex items-center gap-2 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" /> Download Performance Report
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
