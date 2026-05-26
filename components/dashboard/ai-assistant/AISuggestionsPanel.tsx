"use client";

import { motion } from "framer-motion";
import { Download, Save, Sparkles, ArrowRight, Wand2 } from "lucide-react";
import { useState } from "react";
import { mockResumes, ResumeContent, Resume } from "@/lib/mock-data";
import { LivePreview } from "@/components/resume-studio/LivePreview";

interface AISuggestionsPanelProps {
  resumeId: string | null;
  analysisResult: any;
  jdData?: { text: string; company: string; role: string };
}

export function AISuggestionsPanel({ resumeId, analysisResult, jdData }: AISuggestionsPanelProps) {
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailoredContent, setTailoredContent] = useState<ResumeContent | null>(null);
  const [changesMade, setChangesMade] = useState<string[]>([]);

  if (!analysisResult) return null;

  const handleTailor = async () => {
    if (!resumeId) return;
    setIsTailoring(true);
    
    try {
      const selectedResume = mockResumes.find(r => r.id === resumeId);
      
      const response = await fetch('/api/ai/tailor-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeContent: selectedResume?.content,
          jdText: jdData?.text || "Not specified",
          company: jdData?.company || "",
          role: jdData?.role || ""
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to tailor resume");
      }
      
      const data = await response.json();
      console.log("Tailored Output:", data);
      if (data.tailoredContent) {
        // Merge the AI output with the original resume to prevent missing fields (e.g. personalInfo)
        const mergedContent = {
          ...selectedResume?.content,
          ...data.tailoredContent,
          personalInfo: {
            ...selectedResume?.content.personalInfo,
            ...(data.tailoredContent.personalInfo || {})
          },
          education: data.tailoredContent.education || selectedResume?.content.education || [],
          skills: data.tailoredContent.skills || selectedResume?.content.skills || [],
          projects: data.tailoredContent.projects || selectedResume?.content.projects || [],
          experience: data.tailoredContent.experience || selectedResume?.content.experience || [],
        };
        setTailoredContent(mergedContent);
        setChangesMade(data.changesMade || []);

        // Automatically save to Resume Studio (in-memory)
        const newResume: Resume = {
          id: `res-${Date.now()}`,
          title: `${jdData?.role || "Tailored"} - ${jdData?.company || "Company"}`,
          atsScore: data.score || 85,
          updatedAt: new Date().toISOString(),
          content: mergedContent,
          isAIGenerated: true,
        };
        mockResumes.push(newResume);
      }
    } catch (error: any) {
      console.error(error);
      alert(`Failed to tailor resume: ${error.message}`);
    } finally {
      setIsTailoring(false);
    }
  };

  const suggestions = [
    {
      id: 1,
      title: "Optimize Summary for keywords",
      description: "Inject missing keywords like 'GraphQL' and 'Agile' into your professional summary naturally.",
    },
    {
      id: 2,
      title: "Strengthen impact metrics",
      description: "Your recent experience lacks measurable impact. Consider adding percentage improvements.",
    },
    {
      id: 3,
      title: "Align Job Title",
      description: "Change 'Software Engineer' to 'Backend Engineer' to match the JD exactly.",
    }
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-text-primary">AI Optimization Suggestions</h2>
      </div>

      <div className="flex flex-col gap-3">
        {suggestions.map((s, i) => (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            key={s.id} 
            className="flex items-start justify-between bg-white/5 border border-white/5 p-4 rounded-xl hover:bg-white/10 transition-colors group"
          >
            <div className="flex flex-col gap-1 pr-4">
              <h4 className="font-semibold text-sm text-text-primary">{s.title}</h4>
              <p className="text-xs text-text-muted leading-relaxed">{s.description}</p>
            </div>
            <button className="shrink-0 p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-6 border-t border-white/10">
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-text-primary">Auto-Tailor Resume</h3>
            <p className="text-xs text-text-muted max-w-sm">
              Let AI rewrite your bullet points and inject keywords to match the JD. This creates a duplicate version and preserves your original.
            </p>
          </div>
          <button 
            onClick={handleTailor}
            disabled={isTailoring}
            className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${
              isTailoring 
                ? 'bg-white/10 text-text-muted cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary/90 shadow-glow-primary active:scale-[0.98]'
            }`}
          >
            <Wand2 className={`w-4 h-4 ${isTailoring ? 'animate-spin' : ''}`} />
            {isTailoring ? 'Generating Version...' : 'Tailor Resume'}
          </button>
        </div>
      </div>

      {/* Tailored Output Display */}
      {tailoredContent && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 border-t border-white/10 pt-6 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Your Tailored Resume
            </h3>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-text-primary rounded-xl text-sm font-semibold transition-colors"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 rounded-xl text-sm font-semibold border border-green-500/20">
                <Save className="w-4 h-4" />
                Saved to Studio
              </div>
            </div>
          </div>
          {changesMade.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-text-primary mb-2">Key Changes Made:</h4>
                <ul className="text-sm text-text-muted space-y-1 pl-4 list-disc marker:text-primary">
                  {changesMade.map((change, idx) => (
                    <li key={idx}>{change}</li>
                  ))}
                </ul>
              </div>
            )}
          
          <div className="h-[700px] w-full rounded-2xl overflow-hidden border border-white/10 relative shadow-2xl">
            <LivePreview content={tailoredContent} template="Modern" />
          </div>
        </motion.div>
      )}

    </div>
  );
}
