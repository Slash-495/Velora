"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { Activity } from "lucide-react";

export function ActivityHeatmap() {
  // Mock data for the last 90 days (approx 3 months)
  const days = 90;
  
  const mockData = useMemo(() => {
    const data = [];
    for (let i = 0; i < days; i++) {
      // Create some random clusters of activity
      const isWeekend = i % 7 === 0 || i % 7 === 6;
      let intensity = 0;
      
      if (Math.random() > (isWeekend ? 0.7 : 0.4)) {
        intensity = Math.floor(Math.random() * 4) + 1; // 1 to 4
      }
      
      data.push({ date: new Date(Date.now() - (days - i) * 86400000), intensity });
    }
    return data;
  }, []);

  const getColor = (intensity: number) => {
    switch (intensity) {
      case 0: return "bg-white/5 border border-white/5";
      case 1: return "bg-emerald-900/40 border border-emerald-800/50";
      case 2: return "bg-emerald-700/60 border border-emerald-600/50";
      case 3: return "bg-emerald-500/80 border border-emerald-400/50";
      case 4: return "bg-emerald-400 border border-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.4)]";
      default: return "bg-white/5 border border-white/5";
    }
  };

  return (
    <div className="bg-surface border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-text-primary leading-tight">Activity Consistency</h2>
          <p className="text-xs text-text-muted mt-0.5">Your career progress over the last 90 days.</p>
        </div>
      </div>

      <div className="flex-1 w-full overflow-x-auto custom-scrollbar pb-4">
        {/* We arrange in rows (7 days) and columns (weeks) similar to GitHub */}
        <div className="inline-flex gap-1.5 p-1">
          {Array.from({ length: Math.ceil(days / 7) }).map((_, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1.5">
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const dataIndex = weekIndex * 7 + dayIndex;
                if (dataIndex >= days) return <div key={dayIndex} className="w-3.5 h-3.5" />; // Empty slot
                
                const data = mockData[dataIndex];
                return (
                  <motion.div
                    key={dayIndex}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: dataIndex * 0.005 }}
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[3px] sm:rounded-sm ${getColor(data.intensity)}`}
                    title={`${data.intensity} activities on ${data.date.toLocaleDateString()}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-text-muted">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-[2px] bg-white/5" />
          <div className="w-3 h-3 rounded-[2px] bg-emerald-900/40" />
          <div className="w-3 h-3 rounded-[2px] bg-emerald-700/60" />
          <div className="w-3 h-3 rounded-[2px] bg-emerald-500/80" />
          <div className="w-3 h-3 rounded-[2px] bg-emerald-400" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
