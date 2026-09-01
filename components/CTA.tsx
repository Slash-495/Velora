"use client";

import { Container } from "@/components/ui/Container";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Code, Cpu, Database, Layers } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

const architectureHighlights = [
  {
    id: 1,
    title: "AI Resume Studio",
    description: "Built-in real-time resume editor supporting custom LaTeX compilation, theme customization, and instant ATS scoring.",
    icon: Code,
    color: "from-blue-500/20 to-purple-500/20",
    badge: "Next.js App Router"
  },
  {
    id: 2,
    title: "Job Application Pipeline",
    description: "Kanban-style tracking board synchronized reactively with contribution activity heatmaps and application status logs.",
    icon: Layers,
    color: "from-emerald-500/20 to-teal-500/20",
    badge: "Reactive Store"
  },
  {
    id: 3,
    title: "Voice AI Mock Interviews",
    description: "Real-time technical interview room featuring Web Speech recognition, SpeechSynthesis voice selection, and Gemini AI evaluation.",
    icon: Cpu,
    color: "from-orange-500/20 to-red-500/20",
    badge: "Gemini AI + Speech"
  }
];

export function CTA() {
  const { navigateProtected } = useAuth();

  return (
    <div className="relative overflow-hidden">
      {/* Engineering & Architecture Highlights Section */}
      <section className="py-24 relative z-10">
        <Container>
          <div className="text-center mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 w-fit mb-4 backdrop-blur-md"
            >
              <Database className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Project Highlights</span>
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-bold text-text-primary tracking-tight mb-4"
            >
              Engineered for Speed & Usability
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-text-secondary font-light max-w-2xl mx-auto"
            >
              Built as a modern full-stack web application demonstrating AI integration, responsive design, and production-ready React architecture.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {architectureHighlights.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-premium p-8 rounded-3xl relative group hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center border border-white/10 shrink-0`}>
                      <item.icon className="w-6 h-6 text-text-primary" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-text-muted">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-3">{item.title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed mb-6 font-light">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 relative z-10 pb-32">
        {/* Background glow for CTA */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[800px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
        </div>

        <Container>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative card-premium border border-white/10 rounded-[3rem] p-8 sm:p-12 md:p-20 text-center overflow-hidden"
          >
            {/* Subtle inner glow top border */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            
            {/* Corner glowing accents */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary/20 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 w-fit mb-8 backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-primary-glow" />
                <span className="text-sm font-medium text-text-secondary">Explore the workspace</span>
              </div>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary tracking-tight mb-6 max-w-3xl mx-auto leading-[1.1]">
                Everything you need for your job hunt.
              </h2>
              
              <p className="text-xl text-text-secondary font-light mb-10 max-w-2xl mx-auto leading-relaxed">
                Start building resumes that stand out and organize your career journey with Velora today.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link 
                  href="/sign-up"
                  className="btn-glow group w-full sm:w-auto text-base px-8 py-4 rounded-xl cursor-pointer flex items-center justify-center"
                >
                  Build Your Resume
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link 
                  href="/sign-in"
                  className="btn-secondary w-full sm:w-auto text-base px-8 py-4 rounded-xl cursor-pointer flex items-center justify-center"
                >
                  Explore Workspace
                </Link>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>
    </div>
  );
}
