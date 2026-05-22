"use client";

import { motion } from "framer-motion";
import { User, Briefcase, GraduationCap, Code, Sparkles, Plus, Trash2, GripVertical } from "lucide-react";
import { ResumeContent } from "@/lib/mock-data";

interface EditorSidebarProps {
  content: ResumeContent;
  onChange: (newContent: ResumeContent) => void;
}

export function EditorSidebar({ content, onChange }: EditorSidebarProps) {
  
  const updatePersonalInfo = (field: string, value: string) => {
    onChange({
      ...content,
      personalInfo: { ...content.personalInfo, [field]: value }
    });
  };

  const updateExperience = (index: number, field: string, value: string | boolean) => {
    const newExp = [...content.experience];
    newExp[index] = { ...newExp[index], [field]: value };
    onChange({ ...content, experience: newExp });
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pr-4 space-y-6 pb-20">
      
      {/* Personal Info Section */}
      <section className="bg-surface/50 border border-white/10 rounded-2xl p-5">
        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-primary" /> Personal Details
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Full Name</label>
            <input 
              type="text" 
              value={content.personalInfo.fullName}
              onChange={(e) => updatePersonalInfo("fullName", e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Email</label>
            <input 
              type="email" 
              value={content.personalInfo.email}
              onChange={(e) => updatePersonalInfo("email", e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Phone</label>
            <input 
              type="text" 
              value={content.personalInfo.phone}
              onChange={(e) => updatePersonalInfo("phone", e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Location</label>
            <input 
              type="text" 
              value={content.personalInfo.location}
              onChange={(e) => updatePersonalInfo("location", e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div className="col-span-full space-y-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Professional Summary</label>
            <textarea 
              value={content.personalInfo.summary}
              onChange={(e) => updatePersonalInfo("summary", e.target.value)}
              rows={4}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-colors resize-none"
            />
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="bg-surface/50 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-400" /> Experience
          </h2>
          <button className="text-sm font-medium text-primary hover:text-primary-glow flex items-center gap-1 transition-colors">
            <Plus className="w-4 h-4" /> Add Role
          </button>
        </div>

        <div className="space-y-6">
          {content.experience.map((exp, index) => (
            <div key={exp.id} className="relative bg-black/20 border border-white/5 rounded-xl p-4 group">
              {/* Drag Handle & Delete */}
              <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-text-muted hover:text-text-primary cursor-grab active:cursor-grabbing p-1">
                  <GripVertical className="w-4 h-4" />
                </button>
              </div>
              <button className="absolute top-3 right-3 text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="pl-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Company</label>
                  <input 
                    type="text" 
                    value={exp.company}
                    onChange={(e) => updateExperience(index, "company", e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Role</label>
                  <input 
                    type="text" 
                    value={exp.role}
                    onChange={(e) => updateExperience(index, "role", e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div className="col-span-full space-y-1.5">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Description (Bullets)</label>
                  <textarea 
                    value={exp.description}
                    onChange={(e) => updateExperience(index, "description", e.target.value)}
                    rows={4}
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/50 resize-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Similar sections for Education, Projects, Skills would go here... */}
      <section className="bg-surface/50 border border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
        <Sparkles className="w-6 h-6 text-text-muted mb-2" />
        <h3 className="text-sm font-bold text-text-primary">More Sections Available</h3>
        <p className="text-xs text-text-muted mt-1">Add Education, Projects, and Skills to complete your profile.</p>
        <button className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-text-primary transition-colors">
          Manage Sections
        </button>
      </section>

    </div>
  );
}
