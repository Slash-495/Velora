"use client";

import { motion } from "framer-motion";
import { Activity, ShieldCheck } from "lucide-react";
import Link from "next/link";

export function ResumeHealth() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Overall Health
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
          {/* Mock circular progress SVG */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-white/5"
              strokeWidth="3"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]"
              strokeDasharray="89, 100"
              strokeWidth="3"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-text-primary leading-none">89</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-text-primary flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Good Standing
          </p>
          <p className="text-xs text-text-muted">
            Your ATS scores are in the top 15% of candidates. Keep iterating!
          </p>
        </div>
      </div>
      
      <Link href="/dashboard/resume-studio" className="btn-glow w-full py-2.5 rounded-xl text-xs flex justify-center mt-2">
        View Analytics
      </Link>
    </div>
  );
}
