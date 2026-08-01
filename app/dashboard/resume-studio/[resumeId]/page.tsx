"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Save, Cloud, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { mockResumes, ResumeContent } from "@/lib/mock-data";
import { useDebounce } from "@/hooks/use-debounce";
import { EditorSidebar } from "@/components/resume-studio/EditorSidebar";
import { LivePreview } from "@/components/resume-studio/LivePreview";
import { LatexEditor } from "@/components/resume-studio/LatexEditor";
import { EditorTopbar } from "@/components/resume-studio/EditorTopbar";
import { ExportModal } from "@/components/resume-studio/ExportModal";
import { ShareModal } from "@/components/resume-studio/ShareModal";
import { VersionHistoryPanel } from "@/components/resume-studio/VersionHistoryPanel";
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

  const [showExport, setShowExport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Load mock data
  const initialResume = mockResumes.find(r => r.id === resumeId) || mockResumes[0]; // fallback if 'new-mock-id'
  const [content, setContent] = useState<ResumeContent>(initialResume.content);
  const [themeConfig, setThemeConfig] = useState<ResumeThemeConfig>(initialResume.themeConfig || defaultThemeConfig);
  const [templateId, setTemplateId] = useState<string>(queryTemplateId || initialResume.template || "velora-professional");
  
  // Compile LaTeX back into the preview
  const handleLatexCompile = useCallback((compiledLatex: string) => {
    // Parse the customized LaTeX back into the JSON structure
    const updatedContent = parseLatexToJSON(compiledLatex, content);
    setContent(updatedContent);
    console.log("LaTeX compiled and preview updated.");
  }, [content]);

  const debouncedContent = useDebounce(content, 1000);

  // Debounced Autosave
  useEffect(() => {
    setIsSaving(true);
    const timer = setTimeout(() => {
      // Mock API save
      setLastSaved(new Date());
      setIsSaving(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [debouncedContent]);

  const handleDownloadPDF = useCallback(async () => {
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
  }, [initialResume.name]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden">
      
      <EditorTopbar
        resumeName={initialResume.name || "Untitled Resume"}
        isSaving={isSaving}
        lastSaved={lastSaved}
        editorMode={editorMode}
        onModeChange={setEditorMode}
        onSave={() => {}} // Autosaves anyway
        onOpenExport={() => setShowExport(true)}
        onOpenShare={() => setShowShare(true)}
        onOpenHistory={() => setShowHistory(true)}
      />

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

      <ExportModal 
        isOpen={showExport} 
        onClose={() => setShowExport(false)} 
        onExportPDF={handleDownloadPDF} 
        content={content}
        templateId={templateId}
      />
      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        resumeId={resumeId}
      />
      <VersionHistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        resumeId={resumeId}
      />
    </div>
  );
}
