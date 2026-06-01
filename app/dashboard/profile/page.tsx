"use client";

import { motion } from "framer-motion";
import { UserCircle, MapPin, Link as LinkIcon, Building } from "lucide-react";
import { ActivityHeatmap } from "@/components/analytics/ActivityHeatmap";
import { ATSProgressChart } from "@/components/analytics/ATSProgressChart";
import { CareerOverview } from "@/components/analytics/CareerOverview";
import { TrackPerformance } from "@/components/analytics/TrackPerformance";
import { ResumePerformance } from "@/components/analytics/ResumePerformance";
import { CareerMilestones } from "@/components/analytics/CareerMilestones";

export default function ProfilePage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      
      {/* Top Section: User Profile (GitHub/LeetCode Style) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-8 items-center md:items-start"
      >
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 opacity-30 blur-3xl" />
        
        <div className="relative z-10 w-32 h-32 shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center p-1">
          <div className="w-full h-full rounded-full bg-surface overflow-hidden flex items-center justify-center border-4 border-surface shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <UserCircle className="w-20 h-20 text-text-muted" strokeWidth={1} />
          </div>
        </div>
        
        <div className="relative z-10 flex-1 text-center md:text-left space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">John Doe</h1>
            <p className="text-primary font-medium text-sm tracking-widest uppercase mt-1">Full Stack Developer</p>
          </div>
          
          <p className="text-sm text-text-secondary max-w-2xl leading-relaxed">
            Passionate software engineer building modern web applications. Specialized in React, Node.js, and Cloud Infrastructure. Actively looking for Senior roles in product-led companies.
          </p>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-medium text-text-muted">
            <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
              <MapPin className="w-4 h-4" /> San Francisco, CA
            </div>
            <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
              <Building className="w-4 h-4" /> Open to Remote
            </div>
            <div className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer">
              <LinkIcon className="w-4 h-4" /> github.com/johndoe
            </div>
          </div>
        </div>
        
        <div className="relative z-10 shrink-0 flex flex-col gap-2 w-full md:w-auto">
          <button className="w-full btn-glow px-6 py-2.5 rounded-xl font-medium text-sm">
            Edit Profile
          </button>
          <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors">
            Share Profile
          </button>
        </div>
      </motion.div>

      {/* Analytics Grid Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white tracking-tight px-2">Career Intelligence</h2>
        
        <CareerOverview />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ATSProgressChart />
          </div>
          <div>
            <CareerMilestones />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrackPerformance />
          <ResumePerformance />
        </div>

        <div>
          <ActivityHeatmap />
        </div>
      </div>

    </div>
  );
}
