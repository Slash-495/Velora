"use client";

import { VeloraProfessional } from "@/components/resume-studio/templates/VeloraProfessional";
import { DevTerminal } from "@/components/resume-studio/templates/DevTerminal";
import { CreativeAccent } from "@/components/resume-studio/templates/CreativeAccent";
import { ModernMinimalist } from "@/components/resume-studio/templates/ModernMinimalist";
import { mockResumes, defaultThemeConfig } from "@/lib/mock-data";
import { Download, Share2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function PublicResumePage() {
  const params = useParams();
  const shareId = params.shareId as string;
  const [isExporting, setIsExporting] = useState(false);

  // In a real app, this would fetch from `shared_resumes` using shareId to get the `resume_id`, then fetch the resume.
  // For now, we mock it by just taking the first mock resume.
  const resume = mockResumes[0];

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.querySelector<HTMLElement>('.resume-print-document');
      
      if (element) {
        const opt = {
          margin:       0,
          filename:     `${resume.name || 'resume'}.pdf`,
          image:        { type: 'jpeg' as const, quality: 1 },
          html2canvas:  { scale: 2, useCORS: true },
          jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
        };
        
        await html2pdf().set(opt).from(element).save();
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    }
    setIsExporting(false);
  };

  const renderTemplate = () => {
    switch(resume.template) {
      case 'dev-terminal':
        return <DevTerminal content={resume.content} themeConfig={resume.themeConfig || defaultThemeConfig} />;
      case 'creative-accent':
        return <CreativeAccent content={resume.content} themeConfig={resume.themeConfig || defaultThemeConfig} />;
      case 'modern-minimalist':
        return <ModernMinimalist content={resume.content} themeConfig={resume.themeConfig || defaultThemeConfig} />;
      case 'velora-professional':
      default:
        return <VeloraProfessional content={resume.content} themeConfig={resume.themeConfig || defaultThemeConfig} />;
    }
  };

  if (!resume) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary">Resume Not Found</h1>
          <p className="text-text-muted mt-2">This link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center">
      
      {/* Top Navbar */}
      <nav className="w-full max-w-5xl mx-auto flex items-center justify-between p-6">
        <Link href="/" className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary shadow-glow-primary">
            V
          </div>
          Velora
        </Link>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="btn-glow px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "Preparing PDF..." : "Download PDF"}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="w-full max-w-5xl mx-auto flex-1 flex flex-col items-center justify-center py-12 px-4">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 mb-4 text-text-primary">
            <Share2 className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
            {resume.content.personalInfo.fullName}'s Resume
          </h1>
          <p className="text-text-muted">
            Last updated on {new Date(resume.updatedAt).toLocaleDateString()}
          </p>
        </motion.div>

        {/* Scaled Preview Wrapper (Read-only) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative w-full overflow-hidden flex justify-center bg-white/5 rounded-3xl border border-white/10 p-4 md:p-12 shadow-2xl"
        >
          {/* We reuse LivePreview here, it renders the exact A4 document. We scale it down manually via CSS for mobile */}
          <div className="w-full overflow-x-auto flex justify-center custom-scrollbar">
            <div className="transform scale-[0.4] sm:scale-[0.6] md:scale-75 lg:scale-100 origin-top h-[450px] sm:h-[680px] md:h-[850px] lg:h-[1123px]">
              <div className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] resume-print-document overflow-hidden" style={{ width: '794px', height: '1123px' }}>
                {renderTemplate()}
              </div>
            </div>
          </div>
        </motion.div>

      </main>

    </div>
  );
}
