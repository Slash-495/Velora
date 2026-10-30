"use client";

import { motion, type Variants } from "framer-motion";
import { FileText, CheckCircle2, Briefcase, Send } from "lucide-react";
import { useUserResumes, useUserTracks, useUserApplications } from "@/lib/user-data-store";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function AnalyticsCards() {
  const resumes = useUserResumes();
  const tracks = useUserTracks();
  const applications = useUserApplications();

  const totalResumes = resumes.length;
  const totalTracks = tracks.length;
  const totalApplications = applications.length;
  const interviewingCount = applications.filter(a => a.status === "interview").length;

  const avgAtsScore = resumes.length > 0
    ? Math.round(resumes.reduce((acc, curr) => acc + (curr.atsScore || 0), 0) / resumes.length)
    : 0;

  const metrics = [
    {
      title: "Total Resumes",
      value: String(totalResumes),
      trend: resumes.length > 0 ? "Active Workspace" : "Create One",
      icon: FileText,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20"
    },
    {
      title: "Active Tracks",
      value: String(totalTracks),
      trend: "Career Focus",
      icon: Briefcase,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20"
    },
    {
      title: "Applications",
      value: String(totalApplications),
      trend: `${interviewingCount} interviewing`,
      icon: Send,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20"
    },
    {
      title: "Avg ATS Score",
      value: avgAtsScore > 0 ? `${avgAtsScore}%` : "N/A",
      trend: "Target: 90+",
      icon: CheckCircle2,
      color: "text-primary-glow",
      bg: "bg-primary/10",
      border: "border-primary/20"
    }
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {metrics.map((metric) => (
        <motion.div key={metric.title} variants={itemVariants}>
          <div className="card-premium p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden h-full flex flex-col justify-between">
            {/* Subtle background glow on hover */}
            <div className={`absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-0 group-hover:opacity-30 transition-opacity duration-500 ${metric.bg.replace('/10', '')}`} />
            
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${metric.bg} ${metric.border} border flex items-center justify-center`}>
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
              </div>
              <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-white/5 text-text-muted border border-white/5">
                {metric.trend}
              </span>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-text-primary mb-1">{metric.value}</h3>
              <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">{metric.title}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
