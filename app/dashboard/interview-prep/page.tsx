"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Mic, 
  Video, 
  CheckCircle2, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  Play, 
  UserCircle, 
  Settings2,
  Clock
} from "lucide-react";
import { AudioCameraModal } from "@/components/interview-prep/AudioCameraModal";
import { VeloraInterviewRoom } from "@/components/interview-prep/VeloraInterviewRoom";

import { useUserResumes } from "@/lib/user-data-store";

import { useDebouncedSubmit } from "@/hooks/use-debounced-submit";

export default function TechnicalScreenPage() {
  const userResumes = useUserResumes();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [inActiveInterview, setInActiveInterview] = useState(false);

  const [roleTitle, setRoleTitle] = useState("Senior Full Stack Engineer");
  const [jdText, setJdText] = useState("");
  const [selectedResumeId, setSelectedResumeId] = useState(userResumes[0]?.id || "res-1");

  const { execute: handleStartClick, isPending: isStartPending } = useDebouncedSubmit(async () => {
    setIsSettingsOpen(true);
  }, { debounceMs: 1000 });

  const handleStartInterviewFromModal = () => {
    setIsSettingsOpen(false);
    setInActiveInterview(true);
  };

  const selectedResume = userResumes.find(r => r.id === selectedResumeId) || userResumes[0];

  if (inActiveInterview) {
    return (
      <VeloraInterviewRoom 
        roleTitle={roleTitle}
        jdText={jdText}
        resumeContent={selectedResume?.content}
        userName="Arush"
        onEnd={() => setInActiveInterview(false)} 
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-16 pt-4">
      
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Technical Screen
        </h1>
        <p className="text-lg text-text-muted mt-2 font-normal">
          Practice with AI-powered voice interviews
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Feature Highlights & Banner */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Green Credit Badge */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between text-emerald-400">
            <span className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> You have 1 mock interview available
            </span>
            <span className="text-xs bg-emerald-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              PRO ACCESS
            </span>
          </div>

          {/* Customization Inputs (Role, Resume, JD) */}
          <div className="space-y-4 bg-surface/50 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" /> Target Position Context
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Target Role Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-muted">Target Role</label>
                <input 
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. Senior Full Stack Engineer"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              {/* Resume Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-muted">Base Resume</label>
                <select 
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                >
                  {userResumes.map((r) => (
                    <option key={r.id} value={r.id} className="bg-background text-white">
                      {r.name} {r.isDemo ? "(DEMO)" : "(REAL)"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Job Description Textarea */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-text-muted">Job Description (Optional)</label>
              <textarea 
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                rows={3}
                placeholder="Paste the target job description here to tailor questions..."
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-colors resize-none custom-scrollbar"
              />
            </div>
          </div>

          {/* Feature Checklist matching Screenshot 1 */}
          <div className="space-y-6 bg-surface/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
            
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-primary shrink-0 mt-0.5">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-tight">Personalized interviews for your job hunt</h3>
                <p className="text-sm text-text-muted mt-1 leading-relaxed">
                  Practice with pre-built interviewers for popular roles or create a custom interview by sharing a job description.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 pt-4 border-t border-white/5">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-emerald-400 shrink-0 mt-0.5">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-tight">A realistic, voice-based interview</h3>
                <p className="text-sm text-text-muted mt-1 leading-relaxed">
                  Build confidence by speaking naturally with an AI recruiter as you would in a real recruiter call.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 pt-4 border-t border-white/5">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-purple-400 shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-tight">Work on behavioral & technical questions that matter</h3>
                <p className="text-sm text-text-muted mt-1 leading-relaxed">
                  Refine how you tell stories about your experiences and demonstrate technical thinking in a way interviewers expect.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 pt-4 border-t border-white/5">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-orange-400 shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-tight">Improve with clear, actionable feedback</h3>
                <p className="text-sm text-text-muted mt-1 leading-relaxed">
                  Build an action plan to improve with specific feedback on your clarity, confidence, and technical skills.
                </p>
              </div>
            </div>

          </div>

          {/* Action Trigger Button */}
          <div className="pt-2">
            <button
              onClick={handleStartClick}
              disabled={isStartPending}
              className="px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-extrabold text-base transition-all shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center gap-3 cursor-pointer"
            >
              Start Interview <Play className="w-5 h-5 fill-current" />
            </button>
          </div>

        </div>

        {/* Right Column: HackerRank Preview Card matching Screenshot 1 */}
        <div className="lg:col-span-5">
          <div className="bg-[#161a23] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
            
            {/* Timer Badge */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                AI Interviewer Online
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-text-secondary">
                <Clock className="w-3.5 h-3.5" /> 30:00
              </div>
            </div>

            {/* Split Screen Cards (User & AI Listening) matching Screenshot 1 */}
            <div className="grid grid-cols-2 gap-3 h-52">
              
              {/* Left User Preview */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center relative group">
                <div className="w-12 h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-text-muted mb-4">
                  <UserCircle className="w-8 h-8" />
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-text-muted hover:text-white transition-colors">
                    <Mic className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-text-muted hover:text-white transition-colors">
                    <Video className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Right AI Listening Preview */}
              <div className="bg-primary/20 border border-primary/40 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-inner">
                <div className="w-12 h-12 rounded-full bg-primary/30 border border-primary/50 flex items-center justify-center text-white mb-3 relative">
                  <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                  <Mic className="w-6 h-6 relative z-10" />
                </div>
                
                <span className="text-xs font-extrabold tracking-widest uppercase text-white">
                  LISTENING...
                </span>
              </div>

            </div>

            {/* Setup Settings Trigger */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors"
            >
              <Settings2 className="w-4 h-4" /> Audio & Camera Settings
            </button>

          </div>
        </div>

      </div>

      {/* Audio & Camera Modal */}
      <AudioCameraModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onStart={handleStartInterviewFromModal}
      />

    </div>
  );
}
