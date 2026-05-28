"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Save, Cloud, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { mockResumes, ResumeContent } from "@/lib/mock-data";
import { EditorSidebar } from "@/components/resume-studio/EditorSidebar";
import { LivePreview } from "@/components/resume-studio/LivePreview";
import { LatexEditor } from "@/components/resume-studio/LatexEditor";
import { generateDefaultLatex, parseLatexToJSON } from "@/lib/latex-templates";
import { defaultThemeConfig, ResumeThemeConfig } from "@/lib/templates";

type EditorMode = "VISUAL" | "LATEX";

export default function ResumeEditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const resumeId = params.resumeId as string;
  const queryTemplateId = searchParams.get("template");

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(new Date());
  
  const [editorMode, setEditorMode] = useState<EditorMode>("VISUAL");
  
  // Load mock data
  const initialResume = mockResumes.find(r => r.id === resumeId) || mockResumes[0]; // fallback if 'new-mock-id'
  const [content, setContent] = useState<ResumeContent>(initialResume.content);
  const [themeConfig, setThemeConfig] = useState<ResumeThemeConfig>(initialResume.themeConfig || defaultThemeConfig);
  const [templateId, setTemplateId] = useState<string>(queryTemplateId || initialResume.template || "velora-professional");
  
  // Compile LaTeX back into the preview
  const handleLatexCompile = (compiledLatex: string) => {
    // Parse the customized LaTeX back into the JSON structure
    const updatedContent = parseLatexToJSON(compiledLatex, content);
    setContent(updatedContent);
    console.log("LaTeX compiled and preview updated.");
  };

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

  const handleDownloadPDF = async () => {
    setIsSaving(true);
    try {
      // @ts-ignore
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.querySelector('.resume-print-document');
      
      if (element) {
        const opt = {
          margin:       0,
          filename:     `${initialResume.name || 'resume'}.pdf`,
          image:        { type: 'jpeg', quality: 1 },
          html2canvas:  { scale: 2, useCORS: true },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        await html2pdf().set(opt).from(element).save();
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    }
    
    setLastSaved(new Date());
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden">
      
      {/* Editor Topbar */}
      <div className="flex items-center justify-between py-4 shrink-0 relative">
        <div className="flex items-center gap-4 w-1/3">
          <Link href="/dashboard/resume-studio" className="w-10 h-10 rounded-xl bg-surface border border-white/10 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-text-primary tracking-tight leading-none truncate">{initialResume.name || "Untitled Resume"}</h1>
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
              onClick={() => setEditorMode("VISUAL")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                editorMode === "VISUAL" ? "bg-white/10 text-white shadow-sm" : "text-text-muted hover:text-text-primary hover:bg-white/5"
              }`}
            >
              Visual Editor
            </button>
            <button 
              onClick={() => setEditorMode("LATEX")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                editorMode === "LATEX" ? "bg-white/10 text-white shadow-sm" : "text-text-muted hover:text-text-primary hover:bg-white/5"
              }`}
            >
              Code Editor
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 w-1/3 justify-end">
          <button 
            onClick={handleDownloadPDF}
            disabled={isSaving}
            className="btn-glow px-5 py-2 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
            {isSaving ? "Saving..." : "Save & Export"}
          </button>
        </div>
      </div>

      {/* Split Screen Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 pb-4">
        
        {/* Left Side: Editor Form / Code */}
        <div className="lg:w-1/2 w-full h-full flex flex-col min-h-0 pt-2 lg:pt-0">
          {editorMode === "VISUAL" ? (
            <EditorSidebar 
              content={content} 
              onChange={setContent} 
              themeConfig={themeConfig}
              onChangeTheme={setThemeConfig}
              templateId={templateId}
              onChangeTemplate={setTemplateId}
            />
          ) : (
            <div className="h-full">
              <LatexEditor 
                initialLatex={generateDefaultLatex(content, templateId)} 
                onCompile={handleLatexCompile} 
              />
            </div>
          )}
        </div>

        {/* Right Side: Live Preview */}
        <div className="lg:w-1/2 w-full h-full min-h-0 hidden md:block">
          <LivePreview content={content} templateId={templateId} themeConfig={themeConfig} />
        </div>

      </div>
    </div>
  );
}
