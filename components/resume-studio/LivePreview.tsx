"use client";

import { motion } from "framer-motion";
import { ResumeContent } from "@/lib/mock-data";
import { useState } from "react";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";

interface LivePreviewProps {
  content: ResumeContent;
  template: "Modern" | "Minimalist" | "Professional";
}

export function LivePreview({ content, template }: LivePreviewProps) {
  const [zoom, setZoom] = useState(0.85);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.1, 2));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.1, 0.5));
  const handleZoomFit = () => setZoom(0.85);
  
  // Aggressive helper to clean up any escaped or raw latex characters that sneaked into JSON
  const cleanStr = (str: string) => {
    if (!str) return "";
    let s = str;
    s = s.replace(/\\textbf{([^}]*)}/g, "$1");
    s = s.replace(/\\textit{([^}]*)}/g, "$1");
    s = s.replace(/\\underline{([^}]*)}/g, "$1");
    s = s.replace(/\\[a-zA-Z]+/g, "");
    s = s.replace(/[{}]/g, "");
    s = s.replace(/\\/g, "");
    return s.trim();
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
              className="bg-white text-black shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-black/20 resume-print-document"
              style={{ 
                fontFamily: '"Times New Roman", Times, serif', 
                lineHeight: 1.4,
                width: '794px', 
                height: '1123px', // Standard A4 at 96 DPI
              }}
            >
            {/* Page Margins / Padding (Standard 0.6in ~ 57px) */}
            <div className="px-[57px] py-[52px]">
              
              {/* Header */}
              <div className="text-center mb-5">
                <h1 className="text-[28px] font-bold mb-1.5">{cleanStr(content.personalInfo.fullName) || "Your Name"}</h1>
                <div className="text-[12px] flex flex-wrap items-center justify-center gap-1.5">
                  {content.personalInfo.phone && <span>{cleanStr(content.personalInfo.phone)} <span className="mx-1 text-gray-400">|</span></span>}
                  {content.personalInfo.email && <span>{cleanStr(content.personalInfo.email)} <span className="mx-1 text-gray-400">|</span></span>}
                  {content.personalInfo.linkedin && <span>LinkedIn <span className="mx-1 text-gray-400">|</span></span>}
                  {content.personalInfo.github && <span>GitHub</span>}
                </div>
              </div>

              {/* Summary */}
              {content.personalInfo.summary && (
                <div className="mb-4">
                  <h2 className="text-[15px] font-bold mb-1">Summary</h2>
                  <p className="text-[12.5px] leading-relaxed text-justify">
                    {cleanStr(content.personalInfo.summary)}
                  </p>
                </div>
              )}

              {/* Education */}
              {content.education.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-[15px] font-bold mb-1">Education</h2>
                  <div className="space-y-2">
                    {content.education.map((edu) => (
                      <div key={edu.id}>
                        <div className="flex justify-between items-baseline">
                          <h3 className="font-bold text-[13px]">{cleanStr(edu.school)}</h3>
                          <span className="text-[12.5px]">{cleanStr(edu.startDate)} {edu.endDate ? `-- ${cleanStr(edu.endDate)}` : ''}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-[12.5px]">{cleanStr(edu.degree)} {edu.field ? `in ${cleanStr(edu.field)}` : ''}</span>
                          {edu.gpa && <span className="text-[12.5px]">GPA: {cleanStr(edu.gpa)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Skills */}
              {content.skills.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-[15px] font-bold mb-1">Technical Skills</h2>
                  <div className="space-y-0.5">
                    {content.skills.map((skill) => (
                      <div key={skill.id} className="text-[12.5px]">
                        <span className="font-bold">{cleanStr(skill.category)}: </span>
                        <span>{cleanStr(skill.items)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {content.projects && content.projects.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-[15px] font-bold mb-1">Projects</h2>
                  <div className="space-y-3">
                    {content.projects.map((proj) => (
                      <div key={proj.id}>
                        <div className="flex justify-between items-baseline">
                          <h3 className="font-bold text-[13px]">{cleanStr(proj.name)}</h3>
                          <span className="italic text-[12.5px]">{cleanStr(proj.techStack)}</span>
                        </div>
                        <ul className="text-[12.5px] list-none pl-0 space-y-0.5 mt-1">
                          {proj.description.split('\n').map((b, i) => {
                            const cleaned = cleanStr(b.replace(/^-/, '').trim());
                            if (!cleaned) return null;
                            return (
                              <li key={i} className="flex">
                                <span className="mr-2.5">•</span>
                                <span className="text-justify">{cleaned}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {content.experience.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-[15px] font-bold mb-1">Experience</h2>
                  <div className="space-y-3">
                    {content.experience.map((exp) => (
                      <div key={exp.id}>
                        <div className="flex justify-between items-baseline">
                          <h3 className="font-bold text-[13px]">{cleanStr(exp.company)}</h3>
                          <span className="text-[12.5px]">{cleanStr(exp.startDate)} -- {exp.current ? 'Present' : cleanStr(exp.endDate)}</span>
                        </div>
                        <div className="italic text-[12.5px] mb-1">
                          {cleanStr(exp.role)}
                        </div>
                        <ul className="text-[12.5px] list-none pl-0 space-y-0.5">
                          {exp.description.split('\n').map((b, i) => {
                            const cleaned = cleanStr(b.replace(/^-/, '').trim());
                            if (!cleaned) return null;
                            return (
                              <li key={i} className="flex">
                                <span className="mr-2.5">•</span>
                                <span className="text-justify">{cleaned}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  </div>
  );
}
