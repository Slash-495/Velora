"use client";

import { motion } from "framer-motion";
import { ResumeContent } from "@/lib/mock-data";

interface LivePreviewProps {
  content: ResumeContent;
  template: "Modern" | "Minimalist" | "Professional";
}

export function LivePreview({ content, template }: LivePreviewProps) {
  
  // A simple renderer for the "Modern" template
  return (
    <div className="h-full w-full bg-black/40 rounded-2xl border border-white/10 overflow-hidden flex flex-col relative">
      {/* Editor Toolbar (Preview controls) */}
      <div className="h-12 border-b border-white/10 bg-surface/80 backdrop-blur-md flex items-center justify-between px-4 z-10 shrink-0">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Live Preview</span>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/20">
            {template} Template
          </span>
        </div>
      </div>

      {/* Preview Canvas (Scrollable) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 flex justify-center">
        
        {/* The actual "Paper" Document */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[800px] bg-white text-black min-h-[1056px] shadow-2xl p-10 md:p-14 origin-top"
          style={{ 
            fontFamily: template === 'Modern' ? '"Inter", sans-serif' : 
                        template === 'Minimalist' ? '"Helvetica", sans-serif' : 
                        '"Times New Roman", serif'
          }}
        >
          {/* Header */}
          <div className="border-b-2 border-black/10 pb-6 mb-6">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">{content.personalInfo.fullName || "Your Name"}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
              {content.personalInfo.email && <span>{content.personalInfo.email}</span>}
              {content.personalInfo.phone && <span>• {content.personalInfo.phone}</span>}
              {content.personalInfo.location && <span>• {content.personalInfo.location}</span>}
              {content.personalInfo.linkedin && <span>• {content.personalInfo.linkedin}</span>}
            </div>
            {content.personalInfo.summary && (
              <p className="mt-4 text-sm text-slate-700 leading-relaxed">
                {content.personalInfo.summary}
              </p>
            )}
          </div>

          {/* Experience */}
          {content.experience.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-4">Experience</h2>
              <div className="space-y-5">
                {content.experience.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-bold text-slate-800">{exp.role}</h3>
                      <span className="text-sm text-slate-500 font-medium">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</span>
                    </div>
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-sm font-semibold text-slate-600">{exp.company}</span>
                      <span className="text-sm text-slate-500">{exp.location}</span>
                    </div>
                    <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {exp.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {content.education.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-4">Education</h2>
              <div className="space-y-4">
                {content.education.map((edu) => (
                  <div key={edu.id}>
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-bold text-slate-800">{edu.school}</h3>
                      <span className="text-sm text-slate-500 font-medium">{edu.startDate} - {edu.endDate}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-medium text-slate-700">{edu.degree} in {edu.field}</span>
                      {edu.gpa && <span className="text-sm text-slate-500">GPA: {edu.gpa}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {content.skills.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-4">Skills</h2>
              <div className="space-y-2">
                {content.skills.map((skill) => (
                  <div key={skill.id} className="text-sm leading-relaxed">
                    <span className="font-bold text-slate-800">{skill.category}: </span>
                    <span className="text-slate-700">{skill.items}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </div>
  );
}
