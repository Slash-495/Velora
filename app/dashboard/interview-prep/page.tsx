"use client";

import { motion } from "framer-motion";
import { Mic, FileText, Briefcase, ChevronRight, Loader2, Play } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { mockResumes } from "@/lib/mock-data";

export default function InterviewPrepPage() {
  const router = useRouter();
  const [selectedResumeId, setSelectedResumeId] = useState<string>(mockResumes[0].id);
  const [role, setRole] = useState<string>("");
  const [jdText, setJdText] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleStartInterview = async () => {
    if (!role || !jdText || !selectedResumeId) return;

    setIsGenerating(true);

    try {
      const selectedResume = mockResumes.find(r => r.id === selectedResumeId);
      
      const res = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeContent: selectedResume?.content,
          jdText,
          role
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate questions');
      }

      // In a real app, we would save the session and questions to Supabase here,
      // and redirect to the generated sessionId.
      // For now, we will store the generated questions in localStorage to simulate state transfer
      // and redirect to a mock session ID.
      localStorage.setItem('mock_interview_questions', JSON.stringify(data.questions));
      localStorage.setItem('mock_interview_context', JSON.stringify({ role, jdText, resumeId: selectedResumeId }));
      
      const mockSessionId = `session-${Math.random().toString(36).substring(7)}`;
      router.push(`/dashboard/interview-prep/${mockSessionId}`);
      
    } catch (error: any) {
      console.error('Error starting interview:', error);
      alert(`Failed to generate interview. Please try again.\nError: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 border border-orange-500/30">
            <Mic className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Interview Prep</h1>
        </div>
        <p className="text-text-muted">Configure your AI mock interview to match your target role.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Setup */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-white/10 p-6 rounded-3xl shadow-2xl flex flex-col gap-6 relative overflow-hidden">
            
            {isGenerating && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <h3 className="text-lg font-bold text-white">Generating Questions...</h3>
                <p className="text-sm text-text-muted text-center max-w-xs mt-2">
                  Our AI is analyzing your resume and the job description to craft the perfect personalized questions.
                </p>
              </div>
            )}

            <h2 className="text-xl font-bold text-text-primary">Configure Session</h2>

            {/* Resume Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4" /> Base Resume
              </label>
              <select 
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
              >
                {mockResumes.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Target Role
              </label>
              <input 
                type="text"
                placeholder="e.g. Senior Frontend Engineer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Job Description */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Job Description</label>
              <textarea 
                placeholder="Paste the job description here..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                className="w-full h-48 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors resize-none custom-scrollbar"
              />
            </div>

            <button
              onClick={handleStartInterview}
              disabled={!role || !jdText || isGenerating}
              className="w-full py-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold transition-all disabled:opacity-50 disabled:hover:bg-primary flex items-center justify-center gap-2 mt-2 shadow-glow-primary"
            >
              <Play className="w-5 h-5 fill-current" /> Start Mock Interview
            </button>
          </div>
        </div>

        {/* Right Col: History */}
        <div className="space-y-6">
          <div className="bg-surface border border-white/10 p-6 rounded-3xl shadow-lg">
            <h2 className="text-lg font-bold text-text-primary mb-4">Recent Sessions</h2>
            
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-sm text-text-primary group-hover:text-primary transition-colors">Frontend Developer</h3>
                    <span className="text-[10px] text-text-muted">Yesterday</span>
                  </div>
                  <p className="text-xs text-text-secondary">Google</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                    <span className="text-xs font-medium text-emerald-400">Score: 85/100</span>
                    <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
                  </div>
                </div>
              ))}

              <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl">
                <p className="text-sm text-text-muted">Your past interviews will appear here.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
