"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Download, Loader2, Code, FileJson, Settings2 } from "lucide-react";
import { useState } from "react";
import { ResumeContent } from "@/lib/mock-data";
import { generateDefaultLatex } from "@/lib/latex-templates";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportPDF: () => Promise<void>;
  content: ResumeContent;
  templateId: string;
}

export function ExportModal({ isOpen, onClose, onExportPDF, content, templateId }: ExportModalProps) {
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handlePDFExport = async () => {
    setIsExportingPDF(true);
    await onExportPDF();
    setIsExportingPDF(false);
  };

  const handleJSONExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(content, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "resume.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleLatexExport = () => {
    const latexStr = generateDefaultLatex(content, templateId);
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(latexStr);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "resume.tex");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-xl bg-surface border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/30 shadow-glow-primary">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-primary leading-tight">Export Document</h2>
                  <p className="text-xs text-text-muted mt-0.5">Select your preferred export format and settings.</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col gap-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* PDF Export */}
                <button 
                  onClick={handlePDFExport}
                  disabled={isExportingPDF}
                  className="flex flex-col items-start gap-4 p-5 rounded-2xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-left group relative overflow-hidden"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    {isExportingPDF ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary mb-1">Standard PDF</h3>
                    <p className="text-xs text-text-muted leading-relaxed">High-quality A4 rendering. Best for job applications and ATS parsing.</p>
                  </div>
                </button>

                <div className="flex flex-col gap-4">
                  {/* JSON Export */}
                  <button 
                    onClick={handleJSONExport}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <FileJson className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-text-primary">Raw JSON Data</h3>
                      <p className="text-[10px] text-text-muted">Export structured resume data</p>
                    </div>
                  </button>

                  {/* LaTeX Export */}
                  <button 
                    onClick={handleLatexExport}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                      <Code className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-text-primary">LaTeX Source</h3>
                      <p className="text-[10px] text-text-muted">Export pure LaTeX code</p>
                    </div>
                  </button>
                </div>

              </div>

              {/* Export Settings */}
              <div className="mt-2 border-t border-white/10 pt-6">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-4">
                  <Settings2 className="w-4 h-4 text-text-muted" /> Document Settings
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-text-muted">Paper Size</span>
                    <select className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50">
                      <option>A4 (Standard)</option>
                      <option>US Letter</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-text-muted">Margins</span>
                    <select className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50">
                      <option>Normal</option>
                      <option>Compact (Narrow)</option>
                      <option>Spacious (Wide)</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
