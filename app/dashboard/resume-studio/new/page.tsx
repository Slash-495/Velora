"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Briefcase, LayoutTemplate, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { mockTracks } from "@/lib/mock-data";

import { availableTemplates } from "@/lib/templates";

type Step = "TRACK" | "TEMPLATE" | "FINISH";

export default function NewResumeFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("TRACK");
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleNext = () => {
    if (step === "TRACK" && selectedTrack) setStep("TEMPLATE");
    else if (step === "TEMPLATE" && selectedTemplate) {
      // In a real app, we would make an API call to Supabase to insert a new row
      // using the default JSON structure, then get the new ID and redirect.
      // For now, we mock the creation and redirect to a mock editor route.
      router.push(`/dashboard/resume-studio/new-mock-id`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <Link href="/dashboard/resume-studio" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-12">
        <ArrowLeft className="w-4 h-4" /> Cancel & Return
      </Link>

      <div className="flex flex-col items-center justify-center text-center mb-12">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
          <FileText className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">Create New Resume</h1>
        <p className="text-text-secondary mt-2">Let's set up your new career document.</p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-4 mb-12">
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
            {mockTracks.map(track => (
              <button
                key={track.id}
                onClick={() => setSelectedTrack(track.id)}
                className={`p-6 rounded-2xl border text-left transition-all ${
                  selectedTrack === track.id 
                    ? "bg-primary/5 border-primary/50 shadow-[0_0_20px_rgba(var(--primary),0.1)]" 
                    : "bg-surface border-white/10 hover:border-white/20 hover:bg-white/5"
                }`}
              >
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
                className={`p-4 rounded-2xl border text-left flex flex-col h-full transition-all group overflow-hidden ${
                  selectedTemplate === tmpl.id 
                    ? "bg-primary/5 border-primary/50 shadow-[0_0_20px_rgba(var(--primary),0.1)]" 
                    : "bg-surface border-white/10 hover:border-white/20 hover:bg-white/5"
                }`}
              >
                <div className="w-full aspect-[1/1.4] rounded-xl bg-black/40 mb-4 overflow-hidden relative border border-white/5">
                  <img src={tmpl.thumbnail} alt={tmpl.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
                    {tmpl.category}
                  </div>
                </div>
                <h3 className="font-bold text-text-primary mb-1 text-sm">{tmpl.name}</h3>
                <p className="text-xs text-text-muted line-clamp-2">{tmpl.description}</p>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Navigation Controls */}
      <div className="flex justify-between items-center mt-12 pt-8 border-t border-white/10">
        <button 
          onClick={() => step === "TEMPLATE" ? setStep("TRACK") : router.push("/dashboard/resume-studio")}
          className="px-6 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          {step === "TEMPLATE" ? "Back" : "Cancel"}
        </button>

        <button 
          onClick={handleNext}
          disabled={(step === "TRACK" && !selectedTrack) || (step === "TEMPLATE" && !selectedTemplate)}
          className="btn-glow px-8 py-2.5 rounded-xl flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {step === "TEMPLATE" ? "Create Resume" : "Continue"} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
