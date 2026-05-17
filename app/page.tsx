"use client";

import { Container } from "@/components/ui/Container";
import { motion } from "framer-motion";
import { Sparkles, FileText, Briefcase, CheckCircle2, ChevronRight, BarChart3, Bot, ArrowRight } from "lucide-react";
import { Features } from "@/components/Features";
import { CTA } from "@/components/CTA";

export default function Home() {
  return (
    <>
      <main className="min-h-screen flex items-center justify-center relative overflow-hidden pt-24 pb-16">
      {/* Decorative background blur elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] -z-10" />

      <Container className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">
          
          {/* Left Side: Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col gap-6 text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 w-fit backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-primary-glow" />
              <span className="text-sm font-medium text-text-secondary">Your AI Career Workspace</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-text-primary leading-[1.1]">
              Track jobs.<br />
              Build resumes.<br />
              <span className="text-gradient-primary">Get hired.</span>
            </h1>
            
            <p className="text-xl text-text-secondary max-w-lg leading-relaxed font-light mt-2">
              Everything you need for your job hunt in one elegant workspace. Organize applications, optimize ATS scores, and let AI guide your next move.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button className="btn-glow group">
                Build Your Resume
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </button>
              <button className="btn-secondary">
                Explore Templates
              </button>
            </div>

            {/* Small Trust Indicators */}
            <div className="flex items-center gap-6 mt-8 pt-8 border-t border-white/5">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-text-primary">92%</span>
                <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Avg ATS Score</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-text-primary">3x</span>
                <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Faster Hires</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-text-primary">10k+</span>
                <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Users</span>
              </div>
            </div>
          </motion.div>

          {/* Right Side: Dashboard Mockup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square pointer-events-none"
          >
            {/* Base Layer: Job Tracker Board */}
            <div className="absolute top-10 right-0 w-[85%] h-[80%] card-premium p-6 rotate-2 transform-origin-bottom-right opacity-80 scale-95">
              <div className="flex items-center gap-3 mb-6">
                <Briefcase className="w-5 h-5 text-secondary" />
                <h3 className="font-medium text-text-secondary">Job Tracker</h3>
              </div>
              <div className="flex gap-4 h-full">
                {/* Column 1 */}
                <div className="flex-1 bg-background/50 rounded-lg p-3 space-y-3 border border-white/5">
                  <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Applied</div>
                  <div className="bg-surface p-3 rounded border border-white/5 shadow-sm">
                    <div className="h-2 w-16 bg-white/20 rounded mb-2" />
                    <div className="h-2 w-24 bg-white/10 rounded" />
                  </div>
                  <div className="bg-surface p-3 rounded border border-white/5 shadow-sm">
                    <div className="h-2 w-20 bg-white/20 rounded mb-2" />
                    <div className="h-2 w-12 bg-white/10 rounded" />
                  </div>
                </div>
                {/* Column 2 */}
                <div className="flex-1 bg-background/50 rounded-lg p-3 space-y-3 border border-white/5 hidden sm:block">
                  <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Interviewing</div>
                  <div className="bg-surface p-3 rounded border border-primary/20 shadow-glow-primary/10">
                    <div className="h-2 w-16 bg-primary/50 rounded mb-2" />
                    <div className="h-2 w-20 bg-white/10 rounded" />
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Layer: Resume Preview */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute top-0 left-0 w-[65%] h-[90%] card-glass p-6 -rotate-2 bg-surface shadow-2xl border border-white/10"
            >
              <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-text-secondary" />
                  <span className="font-medium text-sm text-text-secondary">resume_frontend_2026.pdf</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="h-4 w-1/3 bg-white/20 rounded-sm" />
                  <div className="h-2 w-1/4 bg-white/10 rounded-sm" />
                </div>
                <div className="space-y-3">
                  <div className="h-2 w-full bg-white/5 rounded-sm" />
                  <div className="h-2 w-[90%] bg-white/5 rounded-sm" />
                  <div className="h-2 w-[95%] bg-white/5 rounded-sm" />
                </div>
                <div className="space-y-2 pt-4 border-t border-white/5">
                  <div className="h-3 w-1/4 bg-white/10 rounded-sm mb-3" />
                  <div className="flex gap-2">
                    <div className="px-2 py-1 rounded bg-primary/20 text-[10px] text-primary">React</div>
                    <div className="px-2 py-1 rounded bg-white/10 text-[10px] text-text-secondary">TypeScript</div>
                    <div className="px-2 py-1 rounded bg-white/10 text-[10px] text-text-secondary">Next.js</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Top Widget 1: ATS Score */}
            <motion.div 
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-[15%] left-[-10%] sm:left-[-5%] card-premium p-4 flex items-center gap-4 bg-surface/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl"
            >
              <div className="w-12 h-12 rounded-full border-4 border-primary border-t-primary-glow flex items-center justify-center bg-background/50">
                <span className="text-sm font-bold text-text-primary">94</span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text-primary flex items-center gap-1">
                  ATS Score <CheckCircle2 className="w-3 h-3 text-primary-glow" />
                </h4>
                <p className="text-xs text-text-muted mt-0.5">High match probability</p>
              </div>
            </motion.div>

            {/* Top Widget 2: Resume Workspace */}
            <motion.div 
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 2 }}
              className="absolute top-[12%] right-[-5%] sm:right-[-12%] card-premium p-4 w-[260px] bg-surface/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl"
            >
              <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/5">
                <div className="p-2 rounded-lg bg-primary/20 text-primary-glow shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-text-primary mb-0.5">Resume Workspace</h4>
                  <p className="text-[9px] text-text-muted leading-tight">Organize and manage tailored resumes</p>
                </div>
              </div>
              
              <div className="space-y-2">
                {/* SDE Track */}
                <div className="group flex items-center justify-between p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-default">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-7 bg-white/5 rounded border border-white/10 flex flex-col items-center justify-center gap-0.5 shadow-sm group-hover:border-primary/30 transition-colors">
                       <div className="w-3 h-0.5 bg-white/20 rounded-full" />
                       <div className="w-4 h-0.5 bg-white/20 rounded-full" />
                       <div className="w-3 h-0.5 bg-white/20 rounded-full" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-medium text-text-primary leading-none">SDE Track</span>
                      <span className="text-[9px] text-text-muted leading-none">Backend Resume</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-[9px] font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-md border border-green-400/20">98 ATS</span>
                  </div>
                </div>

                {/* Data Analyst Track */}
                <div className="group flex items-center justify-between p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-default">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-7 bg-white/5 rounded border border-white/10 flex flex-col items-center justify-center gap-0.5 shadow-sm group-hover:border-primary/30 transition-colors">
                       <div className="w-3 h-0.5 bg-white/20 rounded-full" />
                       <div className="w-4 h-0.5 bg-white/20 rounded-full" />
                       <div className="w-2 h-0.5 bg-white/20 rounded-full" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-medium text-text-primary leading-none">Data Analyst</span>
                      <span className="text-[9px] text-text-muted leading-none">SQL Resume</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-[9px] font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-md border border-green-400/20">92 ATS</span>
                  </div>
                </div>

                {/* Business Analyst Track */}
                <div className="group flex items-center justify-between p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-default">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-7 bg-white/5 rounded border border-white/10 flex flex-col items-center justify-center gap-0.5 shadow-sm group-hover:border-primary/30 transition-colors">
                       <div className="w-4 h-0.5 bg-white/20 rounded-full" />
                       <div className="w-3 h-0.5 bg-white/20 rounded-full" />
                       <div className="w-3 h-0.5 bg-white/20 rounded-full" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-medium text-text-primary leading-none">Business Analyst</span>
                      <span className="text-[9px] text-text-muted leading-none">Startup Resume</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-[9px] font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded-md border border-yellow-400/20">85 ATS</span>
                  </div>
                </div>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </Container>
    </main>
      <Features />
      <CTA />
    </>
  );
}


