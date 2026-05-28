"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Save, Cloud, Loader2, Download, Share2, History } from "lucide-react";
import Link from "next/link";
import { Resume } from "@/lib/mock-data";

interface EditorTopbarProps {
  resumeName: string;
  isSaving: boolean;
  lastSaved: Date | null;
  editorMode: "VISUAL" | "LATEX";
  onModeChange: (mode: "VISUAL" | "LATEX") => void;
  onSave: () => void;
  onOpenExport: () => void;
  onOpenShare: () => void;
  onOpenHistory: () => void;
}

export function EditorTopbar({
  resumeName,
  isSaving,
  lastSaved,
  editorMode,
  onModeChange,
  onSave,
  onOpenExport,
  onOpenShare,
  onOpenHistory
}: EditorTopbarProps) {
  return (
    <div className="flex items-center justify-between py-4 shrink-0 relative">
      <div className="flex items-center gap-4 w-1/3">
        <Link href="/dashboard/resume-studio" className="w-10 h-10 rounded-xl bg-surface border border-white/10 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-text-primary tracking-tight leading-none truncate">{resumeName || "Untitled Resume"}</h1>
          <p className="text-xs text-text-muted mt-1 font-medium flex items-center gap-1.5">
            {isSaving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-primary" /> Saving...
              </>
            ) : (
              <>
                <Cloud className="w-3 h-3 text-emerald-400" /> Saved at {lastSaved?.toLocaleTimeString()}
              </>
            )}
          </p>
        </div>
      </div>

      {/* Editor Mode Toggle - CENTERED IN TOPBAR */}
      <div className="w-1/3 flex justify-center hidden lg:flex">
        <div className="bg-black/40 p-1 rounded-xl border border-white/10 flex backdrop-blur-md">
          <button 
            onClick={() => onModeChange("VISUAL")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              editorMode === "VISUAL" ? "bg-white/10 text-white shadow-sm" : "text-text-muted hover:text-text-primary hover:bg-white/5"
            }`}
          >
            Visual Editor
          </button>
          <button 
            onClick={() => onModeChange("LATEX")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              editorMode === "LATEX" ? "bg-white/10 text-white shadow-sm" : "text-text-muted hover:text-text-primary hover:bg-white/5"
            }`}
          >
            Code Editor
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 w-1/3 justify-end">
        <button 
          onClick={onOpenHistory}
          className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
          title="Version History"
        >
          <History className="w-5 h-5" />
        </button>
        <button 
          onClick={onOpenShare}
          className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors mr-2"
          title="Share"
        >
          <Share2 className="w-5 h-5" />
        </button>
        <button 
          onClick={onOpenExport}
          className="btn-glow px-5 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Export
        </button>
      </div>
    </div>
  );
}
