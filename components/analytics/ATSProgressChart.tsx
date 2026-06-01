"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

export function ATSProgressChart() {
  // Mock data for ATS score progression
  const data = [
    { label: "Jan", score: 65 },
    { label: "Feb", score: 72 },
    { label: "Mar", score: 70 },
    { label: "Apr", score: 85 },
    { label: "May", score: 82 },
    { label: "Jun", score: 94 },
  ];

  const maxScore = 100;
  const minScore = 50; // Set a baseline for visual variation
  const chartHeight = 200;
  
  // Calculate coordinates
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100; // Percentage width
    const y = 100 - ((d.score - minScore) / (maxScore - minScore)) * 100; // Percentage height
    return { x, y, score: d.score, label: d.label };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="bg-surface border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary leading-tight">ATS Progression</h2>
            <p className="text-xs text-text-muted mt-0.5">Your highest scores over time.</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-blue-400">94</p>
          <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold">Peak Score</p>
        </div>
      </div>

      <div className="flex-1 relative min-h-[200px] mt-4">
        {/* Y-Axis Guides */}
        <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-text-muted font-mono">
          <div className="w-full border-t border-white/5 flex items-center justify-end pr-2 h-0 relative"><span className="absolute -top-2 right-0">100</span></div>
          <div className="w-full border-t border-white/5 flex items-center justify-end pr-2 h-0 relative"><span className="absolute -top-2 right-0">75</span></div>
          <div className="w-full border-t border-white/5 flex items-center justify-end pr-2 h-0 relative"><span className="absolute -top-2 right-0">50</span></div>
        </div>

        {/* SVG Chart */}
        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
          <motion.path
            d={linePath}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-blue-500"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          
          {points.map((p, i) => (
            <motion.circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="3"
              className="fill-surface stroke-blue-400"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1 + (i * 0.1), type: "spring" }}
            />
          ))}
        </svg>

        {/* X-Axis Labels */}
        <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-[10px] text-text-muted font-mono px-2">
          {data.map((d, i) => (
            <span key={i} className="-translate-x-1/2">{d.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
