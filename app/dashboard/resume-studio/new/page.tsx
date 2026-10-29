"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Briefcase, FileText, Upload, Sparkles, Check, FileCode, HardDriveUpload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { mockTracks } from "@/lib/mock-data";
import { availableTemplates } from "@/lib/templates";
import { importResumeFromText, saveUserResume, useUserTracks } from "@/lib/user-data-store";

type CreationMethod = "BUILD" | "IMPORT";
type Step = "TRACK" | "TEMPLATE";

export default function NewResumeFlow() {
  const router = useRouter();
  const userTracks = useUserTracks();

  const [method, setMethod] = useState<CreationMethod>("BUILD");
  const [step, setStep] = useState<Step>("TRACK");
  const [selectedTrack, setSelectedTrack] = useState<string | null>(userTracks[0]?.id || "track-1");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(availableTemplates[0]?.id || "velora-professional");
  
  // Import State
  const [importTitle, setImportTitle] = useState("");
  const [importRawText, setImportRawText] = useState("");
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string>("application/pdf");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    if (!importTitle) {
      setImportTitle(file.name.replace(/\.[^/.]+$/, ""));
    }

    const mime = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'text/plain');
    setFileMimeType(mime);

    if (file.name.endsWith('.pdf') || mime.includes('pdf') || mime.includes('word')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl && dataUrl.includes(";base64,")) {
          const base64 = dataUrl.split(";base64,")[1];
          setFileBase64(base64);
          setImportRawText(""); // Clear textarea so garbled binary PDF code is not displayed
        }
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setImportRawText(text || "");
        setFileBase64(null);
      };
      reader.readAsText(file);
    }
  };

  const handleNextBuild = () => {
    if (step === "TRACK" && selectedTrack) {
      setStep("TEMPLATE");
    } else if (step === "TEMPLATE" && selectedTemplate) {
      const trackObj = userTracks.find(t => t.id === selectedTrack);
      const newResume = importResumeFromText(
        "Professional Summary\nExperienced candidate seeking technological roles.",
        `${trackObj?.name || 'Career'} Resume`,
        selectedTrack || "track-1",
        selectedTemplate || "velora-professional"
      );
      router.push(`/dashboard/resume-studio/${newResume.id}`);
    }
  };

  const handleImportSubmit = async () => {
    if (!importRawText.trim() && !fileBase64) return;

    setIsParsing(true);
    setParseError(null);
    try {
      const res = await fetch("/api/ai/parse-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          rawText: importRawText,
          base64Data: fileBase64,
          mimeType: fileMimeType
        })
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error?.message || "Failed to parse resume.");
      }

      const preParsed = payload.data?.content;

      const importedResume = importResumeFromText(
        importRawText || "Imported Resume Content",
        importTitle.trim() || preParsed?.personalInfo?.fullName || "Imported Resume",
        selectedTrack || "track-1",
        selectedTemplate || "velora-professional",
        preParsed
      );

      setIsParsing(false);
      router.push(`/dashboard/resume-studio/${importedResume.id}`);
    } catch (err: any) {
      console.error("Resume parsing error:", err);
      setParseError(err.message || "Failed to parse resume.");
      setIsParsing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <Link href="/dashboard/resume-studio" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> Cancel & Return
      </Link>

      {/* Mode Switcher Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-surface border border-white/10 p-1.5 rounded-2xl flex gap-2">
          <button
            onClick={() => setMethod("BUILD")}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              method === "BUILD"
                ? "bg-primary text-black shadow-glow-primary font-extrabold"
                : "text-text-secondary hover:text-text-primary hover:bg-white/5"
            }`}
          >
            <FileText className="w-4 h-4" /> Build Step-by-Step
          </button>
          <button
            onClick={() => setMethod("IMPORT")}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              method === "IMPORT"
                ? "bg-primary text-black shadow-glow-primary font-extrabold"
                : "text-text-secondary hover:text-text-primary hover:bg-white/5"
            }`}
          >
            <Upload className="w-4 h-4" /> Import Existing Resume
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
          {method === "BUILD" ? <FileText className="w-8 h-8 text-primary" /> : <Upload className="w-8 h-8 text-primary" />}
        </div>
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">
          {method === "BUILD" ? "Create New Resume" : "Import & Parse Existing Resume"}
        </h1>
        <p className="text-text-secondary mt-2 max-w-md">
          {method === "BUILD" 
            ? "Choose your target career track and visual template."
            : "Upload your resume file (PDF, DOCX, TXT) or paste raw text to populate your real resume instantly."}
        </p>
      </div>

      {/* MODE 1: BUILD STEP BY STEP */}
      {method === "BUILD" && (
        <div>
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-4 mb-10">
            <div className={`flex items-center gap-2 ${step === 'TRACK' ? 'text-primary' : 'text-text-muted'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'TRACK' ? 'bg-primary/20 border border-primary/30' : 'bg-white/5 border border-white/10'}`}>1</div>
              <span className="text-sm font-medium">Career Track</span>
            </div>
            <div className="w-12 h-px bg-white/10" />
            <div className={`flex items-center gap-2 ${step === 'TEMPLATE' ? 'text-primary' : 'text-text-muted'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'TEMPLATE' ? 'bg-primary/20 border border-primary/30' : 'bg-white/5 border border-white/10'}`}>2</div>
              <span className="text-sm font-medium">Template</span>
            </div>
          </div>

          {/* Step 1: Career Track */}
          {step === "TRACK" && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <h2 className="text-xl font-bold text-text-primary mb-4 text-center">Which career track is this for?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userTracks.map(track => (
                  <button
                    key={track.id}
                    onClick={() => setSelectedTrack(track.id)}
                    className={`p-6 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                      selectedTrack === track.id 
                        ? "bg-primary/10 border-primary shadow-glow-primary" 
                        : "bg-surface border-white/10 hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    {track.isDemo && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded bg-white/10 border border-white/10 text-[10px] font-mono font-bold text-text-muted uppercase">
                        DEMO
                      </span>
                    )}
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        <Briefcase className="w-5 h-5 text-text-secondary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-text-primary">{track.name}</h3>
                        <p className="text-xs text-text-muted">{track.role}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Template */}
          {step === "TEMPLATE" && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <h2 className="text-xl font-bold text-text-primary mb-4 text-center">Choose a visual template</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {availableTemplates.map(tmpl => (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl.id)}
                    className={`p-4 rounded-2xl border text-left flex flex-col h-full transition-all group overflow-hidden cursor-pointer ${
                      selectedTemplate === tmpl.id 
                        ? "bg-primary/10 border-primary shadow-glow-primary" 
                        : "bg-surface border-white/10 hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    <div className="aspect-[1/1.4] relative rounded-xl overflow-hidden mb-4 border border-white/10 group-hover:border-primary/50 transition-colors bg-white/5">
                      <Image src={tmpl.thumbnail} alt={tmpl.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <h3 className="font-bold text-text-primary mb-1 text-sm">{tmpl.name}</h3>
                    <p className="text-xs text-text-muted line-clamp-2">{tmpl.description}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Controls */}
          <div className="flex justify-between items-center mt-12 pt-8 border-t border-white/10">
            <button 
              onClick={() => step === "TEMPLATE" ? setStep("TRACK") : router.push("/dashboard/resume-studio")}
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              {step === "TEMPLATE" ? "Back" : "Cancel"}
            </button>

            <button 
              onClick={handleNextBuild}
              disabled={(step === "TRACK" && !selectedTrack) || (step === "TEMPLATE" && !selectedTemplate)}
              className="btn-glow px-8 py-2.5 rounded-xl flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {step === "TEMPLATE" ? "Create & Open Studio" : "Continue"} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODE 2: IMPORT RESUME */}
      {method === "IMPORT" && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 bg-surface/50 border border-white/10 rounded-3xl p-6 sm:p-8">
          
          {/* Resume Title */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Resume Title</label>
            <input
              type="text"
              value={importTitle}
              onChange={(e) => setImportTitle(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer 2026"
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {/* File Upload Dropzone */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Upload File (PDF, DOCX, TXT)</label>
            <div className="border-2 border-dashed border-white/15 hover:border-primary/50 rounded-2xl p-6 text-center transition-all bg-black/20 relative group">
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-white/5 group-hover:bg-primary/20 flex items-center justify-center text-text-muted group-hover:text-primary transition-all">
                  <HardDriveUpload className="w-6 h-6" />
                </div>
                {fileName ? (
                  <span className="text-sm font-bold text-primary flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> {fileName}
                  </span>
                ) : (
                  <>
                    <span className="text-sm font-medium text-text-primary">Click or drag & drop resume file here</span>
                    <span className="text-xs text-text-muted">Supports PDF, DOCX, or TXT documents</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Or Paste Raw Text */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Or Paste Resume Content</label>
              {fileBase64 ? (
                <span className="text-[11px] text-emerald-400 font-mono font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" /> PDF Binary Stream Ready for AI Parsing
                </span>
              ) : importRawText ? (
                <span className="text-[11px] text-emerald-400 font-mono font-medium">{importRawText.length} characters loaded</span>
              ) : null}
            </div>
            <textarea
              rows={6}
              value={importRawText}
              onChange={(e) => {
                setImportRawText(e.target.value);
                setFileBase64(null);
              }}
              placeholder="Paste your full resume text here (Summary, Work Experience, Education, Skills)..."
              className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
            />
          </div>

          {/* Select Track & Template */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Target Career Track</label>
              <select
                value={selectedTrack || ""}
                onChange={(e) => setSelectedTrack(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              >
                {userTracks.map(t => (
                  <option key={t.id} value={t.id} className="bg-surface text-text-primary">
                    {t.name} {t.isDemo ? "(DEMO)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Visual Template</label>
              <select
                value={selectedTemplate || ""}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              >
                {availableTemplates.map(tmpl => (
                  <option key={tmpl.id} value={tmpl.id} className="bg-surface text-text-primary">
                    {tmpl.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Importer */}
          {parseError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400">
              {parseError}
            </div>
          )}
          <div className="pt-4 flex justify-end">
            <button
              onClick={handleImportSubmit}
              disabled={(!importRawText.trim() && !fileBase64) || isParsing}
              className="btn-glow px-8 py-3 rounded-xl flex items-center gap-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isParsing ? "Parsing & Saving..." : "Import & Save to Real Resumes"} <Sparkles className="w-4 h-4" />
            </button>
          </div>

        </motion.div>
      )}

    </div>
  );
}
