"use client";

import { motion } from "framer-motion";
import { ResumeContent } from "@/lib/mock-data";
import { useState } from "react";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { ResumeThemeConfig } from "@/lib/templates";
import { VeloraProfessional } from "./templates/VeloraProfessional";
import { DevTerminal } from "./templates/DevTerminal";
import { CreativeAccent } from "./templates/CreativeAccent";
import { ModernMinimalist } from "./templates/ModernMinimalist";

interface LivePreviewProps {
  content: ResumeContent;
  templateId: string;
  themeConfig: ResumeThemeConfig;
}

export function LivePreview({ content, templateId, themeConfig }: LivePreviewProps) {
  const [zoom, setZoom] = useState(0.85);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.1, 2));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.1, 0.5));
  const handleZoomFit = () => setZoom(0.85);
  
  // Template Switcher
  const renderTemplate = () => {
    switch(templateId) {
      case 'dev-terminal':
        return <DevTerminal content={content} themeConfig={themeConfig} />;
      case 'creative-accent':
        return <CreativeAccent content={content} themeConfig={themeConfig} />;
      case 'modern-minimalist':
        return <ModernMinimalist content={content} themeConfig={themeConfig} />;
      case 'velora-professional':
      default:
        // For now, we fallback all other templates to the VeloraProfessional renderer,
        // which dynamically adapts to the passed themeConfig!
        return <VeloraProfessional content={content} themeConfig={themeConfig} />;
    }
  };

  return (
    <div className="h-full w-full bg-[#1e1e1e] rounded-2xl border border-white/10 overflow-hidden flex flex-col relative shadow-2xl">
      {/* Document Toolbar */}
      <div className="h-12 border-b border-white/10 bg-surface/80 flex items-center justify-between px-4 z-10 shrink-0">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Document Preview</span>
        <div className="flex items-center gap-4">
          
          {/* Zoom Controls */}
          <div className="flex items-center bg-black/40 rounded-lg border border-white/10 overflow-hidden shadow-inner">
            <button onClick={handleZoomOut} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/10 transition-colors" title="Zoom Out">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-medium text-text-secondary w-10 text-center font-mono">
              {Math.round(zoom * 100)}%
            </span>
            <button onClick={handleZoomIn} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/10 transition-colors" title="Zoom In">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-white/10 mx-1"></div>
            <button onClick={handleZoomFit} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/10 transition-colors" title="Fit to Screen">
              <Maximize className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="px-2.5 py-1 rounded-md bg-white/5 text-primary text-[10px] font-bold uppercase tracking-wider border border-white/10">
            A4 Page
          </span>
        </div>
      </div>

      {/* Document Workspace (Scrollable Dark Area) */}
      <div className="flex-1 overflow-auto custom-scrollbar flex flex-col items-center bg-[#0d0d0d] p-8">
        
        {/* Scaled Wrapper to maintain document dimensions within flex layout */}
        <div 
          className="relative shrink-0 transition-all duration-200"
          style={{ width: `${794 * zoom}px`, height: `${1123 * zoom}px` }}
        >
          {/* Native div handles the scaling to avoid Framer Motion transform conflicts */}
          <div 
            className="absolute top-0 left-0 origin-top-left transition-transform duration-200" 
            style={{ transform: `scale(${zoom})` }}
          >
            {/* The Actual A4 Paper Document */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white text-black shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-black/20 resume-print-document overflow-hidden"
              style={{ 
                width: '794px', 
                height: '1123px', // Standard A4 at 96 DPI
              }}
            >
              {renderTemplate()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
