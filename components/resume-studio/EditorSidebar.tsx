"use client";

import { motion } from "framer-motion";
import { User, Briefcase, GraduationCap, Code, Sparkles, Plus, Trash2, GripVertical, FileText, Palette } from "lucide-react";
import { ResumeContent } from "@/lib/mock-data";
import { useState } from "react";
import { ThemeCustomizer } from "./ThemeCustomizer";
import { ResumeThemeConfig } from "@/lib/templates";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";

interface EditorSidebarProps {
  content: ResumeContent;
  onChange: (newContent: ResumeContent) => void;
  themeConfig: ResumeThemeConfig;
  onChangeTheme: (newTheme: ResumeThemeConfig) => void;
  templateId: string;
  onChangeTemplate: (newTemplateId: string) => void;
}

export function EditorSidebar({ content, onChange, themeConfig, onChangeTheme, templateId, onChangeTemplate }: EditorSidebarProps) {
  const [activeTab, setActiveTab] = useState<"CONTENT" | "DESIGN">("CONTENT");
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClient();
  
  const updatePersonalInfo = (field: string, value: string) => {
    onChange({
      ...content,
      personalInfo: { ...content.personalInfo, [field]: value }
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `resumes/${fileName}`;

      const { data, error } = await supabase.storage
        .from('resume-photos')
        .upload(filePath, file);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('resume-photos')
        .getPublicUrl(filePath);

      if (publicUrlData) {
        updatePersonalInfo('photoUrl', publicUrlData.publicUrl);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const updateExperience = (index: number, field: string, value: string | boolean) => {
    const newExp = [...content.experience];
    newExp[index] = { ...newExp[index], [field]: value };
    onChange({ ...content, experience: newExp });
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const newEdu = [...content.education];
    newEdu[index] = { ...newEdu[index], [field]: value };
    onChange({ ...content, education: newEdu });
  };

  const updateSkill = (index: number, field: string, value: string) => {
    const newSkills = [...content.skills];
    newSkills[index] = { ...newSkills[index], [field]: value };
    onChange({ ...content, skills: newSkills });
  };

  const updateProject = (index: number, field: string, value: string) => {
    const newProj = [...content.projects];
    newProj[index] = { ...newProj[index], [field]: value };
    onChange({ ...content, projects: newProj });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tab Switcher */}
      <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 mb-4 shrink-0">
        <button 
          onClick={() => setActiveTab("CONTENT")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "CONTENT" ? "bg-white/10 text-white shadow-sm" : "text-text-muted hover:text-text-primary hover:bg-white/5"
          }`}
        >
          <FileText className="w-4 h-4" /> Content
        </button>
        <button 
          onClick={() => setActiveTab("DESIGN")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "DESIGN" ? "bg-white/10 text-white shadow-sm" : "text-text-muted hover:text-text-primary hover:bg-white/5"
          }`}
        >
          <Palette className="w-4 h-4" /> Design
        </button>
      </div>

      {activeTab === "DESIGN" ? (
        <ThemeCustomizer 
          themeConfig={themeConfig} 
          onChange={onChangeTheme} 
          templateId={templateId}
          onChangeTemplate={onChangeTemplate}
        />
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-6 pb-20">
          
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

        <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-text-primary block">Resume Photo</span>
            <span className="text-xs text-text-muted">Used in templates like Creative Accent.</span>
          </div>
          <label className="cursor-pointer relative overflow-hidden bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2">
            {isUploading ? (
              <><Loader2 className="w-4 h-4 animate-spin text-primary" /> Uploading...</>
            ) : (
              <>Upload Image</>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={isUploading} />
          </label>
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

      {/* Education Section */}
      <section className="bg-surface/50 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-400" /> Education
          </h2>
          <button className="text-sm font-medium text-primary hover:text-primary-glow flex items-center gap-1 transition-colors">
            <Plus className="w-4 h-4" /> Add Degree
          </button>
        </div>

        <div className="space-y-6">
          {content.education.map((edu, index) => (
            <div key={edu.id} className="relative bg-black/20 border border-white/5 rounded-xl p-4 group">
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
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">School</label>
                  <input 
                    type="text" 
                    value={edu.school}
                    onChange={(e) => updateEducation(index, "school", e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Degree</label>
                  <input 
                    type="text" 
                    value={edu.degree}
                    onChange={(e) => updateEducation(index, "degree", e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Field of Study</label>
                  <input 
                    type="text" 
                    value={edu.field}
                    onChange={(e) => updateEducation(index, "field", e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">GPA</label>
                  <input 
                    type="text" 
                    value={edu.gpa}
                    onChange={(e) => updateEducation(index, "gpa", e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Projects Section */}
      <section className="bg-surface/50 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Code className="w-5 h-5 text-purple-400" /> Projects
          </h2>
          <button className="text-sm font-medium text-primary hover:text-primary-glow flex items-center gap-1 transition-colors">
            <Plus className="w-4 h-4" /> Add Project
          </button>
        </div>

        <div className="space-y-6">
          {content.projects.map((proj, index) => (
            <div key={proj.id} className="relative bg-black/20 border border-white/5 rounded-xl p-4 group">
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
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Project Name</label>
                  <input 
                    type="text" 
                    value={proj.name}
                    onChange={(e) => updateProject(index, "name", e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Tech Stack</label>
                  <input 
                    type="text" 
                    value={proj.techStack}
                    onChange={(e) => updateProject(index, "techStack", e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div className="col-span-full space-y-1.5">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Description (Bullets)</label>
                  <textarea 
                    value={proj.description}
                    onChange={(e) => updateProject(index, "description", e.target.value)}
                    rows={4}
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/50 resize-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Skills Section */}
      <section className="bg-surface/50 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" /> Skills
          </h2>
          <button className="text-sm font-medium text-primary hover:text-primary-glow flex items-center gap-1 transition-colors">
            <Plus className="w-4 h-4" /> Add Skill Category
          </button>
        </div>

        <div className="space-y-4">
          {content.skills.map((skill, index) => (
            <div key={skill.id} className="relative bg-black/20 border border-white/5 rounded-xl p-4 group">
              <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-text-muted hover:text-text-primary cursor-grab active:cursor-grabbing p-1">
                  <GripVertical className="w-4 h-4" />
                </button>
              </div>
              <button className="absolute top-3 right-3 text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="pl-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Category</label>
                  <input 
                    type="text" 
                    value={skill.category}
                    onChange={(e) => updateSkill(index, "category", e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Skills (Comma separated)</label>
                  <input 
                    type="text" 
                    value={skill.items}
                    onChange={(e) => updateSkill(index, "items", e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

        </div>
      )}
    </div>
  );
}
