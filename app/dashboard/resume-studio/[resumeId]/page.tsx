"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Save, Cloud, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { mockResumes, ResumeContent } from "@/lib/mock-data";
import { EditorSidebar } from "@/components/resume-studio/EditorSidebar";
import { LivePreview } from "@/components/resume-studio/LivePreview";

export default function ResumeEditorPage() {
  const params = useParams();
  const resumeId = params.resumeId as string;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(new Date());
  
  // Load mock data
  const initialResume = mockResumes.find(r => r.id === resumeId) || mockResumes[0]; // fallback if 'new-mock-id'
  const [content, setContent] = useState<ResumeContent>(initialResume.content);

  // Mock Debounced Autosave
  useEffect(() => {
    setIsSaving(true);
    const timer = setTimeout(() => {
      // Mock API save
      setLastSaved(new Date());
      setIsSaving(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [content]);

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-h-screen overflow-hidden -mt-4">
      
      {/* Editor Topbar */}
      <div className="flex items-center justify-between py-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/resume-studio" className="w-10 h-10 rounded-xl bg-surface border border-white/10 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary tracking-tight leading-none">{initialResume.name || "Untitled Resume"}</h1>
            <p className="text-xs text-text-muted mt-1 font-medium flex items-center gap-1.5">
              {isSaving ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-primary" /> Saving changes...
                </>
              ) : (
                <>
                  <Cloud className="w-3 h-3 text-emerald-400" /> Saved at {lastSaved?.toLocaleTimeString()}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-5 py-2 rounded-xl text-sm font-medium bg-surface border border-white/10 text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
            Export PDF
          </button>
          <button className="btn-glow px-5 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>

      {/* Split Screen Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        
        {/* Left Side: Editor Form */}
        <div className="lg:w-1/2 w-full h-full flex flex-col min-h-0">
          <EditorSidebar content={content} onChange={setContent} />
        </div>

        {/* Right Side: Live Preview */}
        <div className="lg:w-1/2 w-full h-full min-h-0 hidden md:block">
          <LivePreview content={content} template={initialResume.template} />
        </div>

      </div>
    </div>
  );
}
