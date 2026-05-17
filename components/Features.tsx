"use client";

import { Container } from "@/components/ui/Container";
import { motion } from "framer-motion";
import { 
  FileText, 
  Target, 
  KanbanSquare, 
  Eye, 
  Sparkles, 
  LayoutTemplate,
  ChevronRight,
  Briefcase
} from "lucide-react";

const features = [
  {
    id: "resume-builder",
    title: "AI Resume Builder",
    description: "Generate professional, impact-driven resumes in minutes. Let AI improve your wording, structure, and formatting automatically.",
    icon: FileText,
    className: "md:col-span-2 md:row-span-2",
    content: (
      <div className="absolute right-0 bottom-0 w-[80%] h-[70%] bg-surface/50 border-t border-l border-white/5 rounded-tl-2xl p-4 overflow-hidden mask-image-b transform transition-transform group-hover:-translate-y-2 group-hover:-translate-x-2">
        <div className="flex items-center gap-2 mb-4 opacity-50">
          <div className="w-8 h-8 rounded-full bg-white/10" />
          <div className="space-y-1">
            <div className="w-24 h-2 bg-white/20 rounded" />
            <div className="w-16 h-2 bg-white/10 rounded" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="w-full h-3 bg-white/10 rounded-sm" />
          <div className="w-[90%] h-3 bg-white/10 rounded-sm" />
          <div className="w-[80%] h-3 bg-white/10 rounded-sm" />
          <div className="flex items-center gap-2 mt-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <div className="w-32 h-3 bg-primary/20 rounded-sm" />
          </div>
        </div>
      </div>
    )
  },
  {
    id: "ats-optimization",
    title: "ATS Optimization",
    description: "Score higher on ATS screens with keyword suggestions and formatting fixes.",
    icon: Target,
    className: "md:col-span-1 md:row-span-1",
    content: (
      <div className="absolute right-4 bottom-4 flex items-center justify-center transform transition-transform group-hover:scale-110">
        <div className="relative w-16 h-16 rounded-full border-4 border-white/5 flex items-center justify-center before:absolute before:inset-[-4px] before:rounded-full before:border-4 before:border-transparent before:border-t-primary before:border-r-primary before:rotate-45">
          <span className="text-lg font-bold text-text-primary">94</span>
        </div>
      </div>
    )
  },
  {
    id: "live-preview",
    title: "Live Preview",
    description: "See your changes in real-time as you type. What you see is what you export.",
    icon: Eye,
    className: "md:col-span-1 md:row-span-2",
    content: (
      <div className="absolute -right-4 -bottom-4 w-[120%] h-[60%] bg-white/5 border border-white/10 rounded-2xl rotate-[-5deg] p-4 transform transition-transform group-hover:rotate-0">
        <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-3">
          <div className="w-16 h-2 bg-white/20 rounded" />
          <div className="w-4 h-4 rounded-full bg-green-500/50" />
        </div>
        <div className="space-y-2">
          <div className="w-full h-2 bg-white/10 rounded" />
          <div className="w-[80%] h-2 bg-white/10 rounded" />
          <div className="w-[90%] h-2 bg-white/10 rounded" />
        </div>
      </div>
    )
  },
  {
    id: "resume-workspace",
    title: "Resume Workspace",
    description: "Organize and manage all your tailored resumes in one place.",
    icon: Briefcase,
    className: "md:col-span-1 md:row-span-1",
    content: (
      <div className="absolute -right-2 -bottom-2 w-[85%] bg-white/5 border border-white/10 p-3 rounded-tl-2xl rounded-tr-md rounded-bl-md backdrop-blur-md transform transition-transform group-hover:-translate-y-2 group-hover:-translate-x-2 shadow-2xl">
        <div className="space-y-2">
          {/* SDE Track Preview */}
          <div className="flex items-center justify-between bg-white/5 p-1.5 rounded-md">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-5 bg-white/10 rounded-sm border border-white/10 flex flex-col items-center justify-center gap-[1px]">
                 <div className="w-2 h-[1px] bg-white/20 rounded-full" />
                 <div className="w-2.5 h-[1px] bg-white/20 rounded-full" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-medium text-text-primary leading-none">SDE Track</span>
                <span className="text-[7px] text-text-muted leading-none mt-0.5">Backend Resume</span>
              </div>
            </div>
            <span className="text-[7px] font-bold text-green-400 bg-green-400/10 px-1 py-0.5 rounded border border-green-400/20">98 ATS</span>
          </div>
          {/* Data Analyst Preview */}
          <div className="flex items-center justify-between bg-white/5 p-1.5 rounded-md">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-5 bg-white/10 rounded-sm border border-white/10 flex flex-col items-center justify-center gap-[1px]">
                 <div className="w-2 h-[1px] bg-white/20 rounded-full" />
                 <div className="w-2 h-[1px] bg-white/20 rounded-full" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-medium text-text-primary leading-none">Data Analyst</span>
                <span className="text-[7px] text-text-muted leading-none mt-0.5">SQL Resume</span>
              </div>
            </div>
            <span className="text-[7px] font-bold text-green-400 bg-green-400/10 px-1 py-0.5 rounded border border-green-400/20">92 ATS</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "job-tracker",
    title: "Job Tracker",
    description: "Organize your job hunt visually. Track applications, interviews, and offers in one clean kanban board.",
    icon: KanbanSquare,
    className: "md:col-span-2 md:row-span-1",
    content: (
      <div className="absolute right-4 bottom-0 flex gap-2 h-[80%] transform transition-transform group-hover:-translate-y-2">
        <div className="w-24 bg-white/5 border-t border-l border-r border-white/10 rounded-t-lg p-2 space-y-2">
          <div className="w-10 h-2 bg-white/20 rounded mb-3" />
          <div className="w-full h-8 bg-white/10 rounded border border-white/5" />
          <div className="w-full h-8 bg-white/10 rounded border border-white/5" />
        </div>
        <div className="w-24 bg-white/5 border-t border-l border-r border-white/10 rounded-t-lg p-2 space-y-2">
          <div className="w-16 h-2 bg-primary/50 rounded mb-3" />
          <div className="w-full h-10 bg-primary/20 border border-primary/30 rounded" />
        </div>
      </div>
    )
  },
  {
    id: "templates",
    title: "Multiple Templates",
    description: "Choose from a collection of modern, ATS-friendly designs crafted by typography experts.",
    icon: LayoutTemplate,
    className: "md:col-span-2 md:row-span-1",
    content: (
      <div className="absolute right-8 bottom-0 flex transform transition-transform group-hover:-translate-y-2 group-hover:-translate-x-2">
        <div className="w-20 h-28 bg-surface border border-white/10 rounded-t-lg rotate-[-10deg] shadow-xl z-10" />
        <div className="w-20 h-32 bg-surface border border-primary/30 rounded-t-lg -ml-10 -mt-4 shadow-xl z-20" />
        <div className="w-20 h-28 bg-surface border border-white/10 rounded-t-lg rotate-[10deg] -ml-10 shadow-xl z-10" />
      </div>
    )
  }
];

export function Features() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
      
      <Container>
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 w-fit mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary-glow" />
            <span className="text-sm font-medium text-text-secondary">Powerful Features</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold text-text-primary tracking-tight mb-6"
          >
            Everything you need to land your dream job
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-text-secondary font-light"
          >
            Stop wrestling with formatting and tracking spreadsheets. Velora brings your entire job hunt into one beautifully designed workspace.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[280px] gap-4 md:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`group relative overflow-hidden rounded-3xl card-premium hover:border-white/[0.1] transition-colors p-6 sm:p-8 flex flex-col ${feature.className}`}
            >
              {/* Subtle background glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-transparent transition-colors duration-500 z-0" />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-white/5 text-text-primary group-hover:bg-primary/20 group-hover:text-primary-glow transition-colors">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary">{feature.title}</h3>
                </div>
                
                <p className="text-sm text-text-secondary leading-relaxed max-w-[80%]">
                  {feature.description}
                </p>
                
                {feature.content}
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
