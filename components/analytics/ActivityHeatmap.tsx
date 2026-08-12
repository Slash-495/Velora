"use client";

import { motion } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import { Activity } from "lucide-react";
import { useUserApplications, useUserResumes } from "@/lib/user-data-store";

type EventType = 'none' | 'applied' | 'oa' | 'interview' | 'offer';

interface DayData {
  date: Date;
  dateStr: string;
  type: EventType;
  intensity: number; // For 'applied', 1-4
  details: string[];
}

export function ActivityHeatmap() {
  const daysCount = 546; // 78 weeks (1.5 years)
  const applications = useUserApplications();
  const resumes = useUserResumes();
  const [focusTasks, setFocusTasks] = useState<any[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("velora_todays_focus");
      if (saved) setFocusTasks(JSON.parse(saved));
    } catch (e) {}

    const handleStorage = () => {
      try {
        const saved = localStorage.getItem("velora_todays_focus");
        if (saved) setFocusTasks(JSON.parse(saved));
      } catch (e) {}
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const { grid, monthLabels, totalContributions } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today.getTime() - (daysCount - 1) * 86400000);
    const startDayOfWeek = startDate.getDay(); // 0 = Sun, 6 = Sat

    // Helper to format YYYY-MM-DD
    const toKey = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const eventMap: Record<string, { type: EventType; intensity: number; details: string[] }> = {};
    let count = 0;

    // Process real user applications
    applications.forEach((app) => {
      const rawDate = app.applicationDate || app.deadline || new Date().toISOString();
      const dateObj = new Date(rawDate);
      if (isNaN(dateObj.getTime())) return;
      dateObj.setHours(0, 0, 0, 0);
      const key = toKey(dateObj);

      if (!eventMap[key]) {
        eventMap[key] = { type: 'none', intensity: 0, details: [] };
      }

      count++;
      if (app.status === 'offer') {
        eventMap[key].type = 'offer';
        eventMap[key].details.push(`Offer: ${app.companyName} (${app.roleTitle})`);
      } else if (app.status === 'interview' && eventMap[key].type !== 'offer') {
        eventMap[key].type = 'interview';
        eventMap[key].details.push(`Interview: ${app.companyName} (${app.roleTitle})`);
      } else if (app.status === 'oa' && eventMap[key].type !== 'offer' && eventMap[key].type !== 'interview') {
        eventMap[key].type = 'oa';
        eventMap[key].details.push(`OA: ${app.companyName} (${app.roleTitle})`);
      } else if (eventMap[key].type === 'none' || eventMap[key].type === 'applied') {
        eventMap[key].type = 'applied';
        eventMap[key].intensity = Math.min(eventMap[key].intensity + 1, 4);
        eventMap[key].details.push(`Applied: ${app.companyName} (${app.roleTitle})`);
      }
    });

    // Process real user resumes
    resumes.forEach((res) => {
      const dateObj = new Date(res.updatedAt);
      if (isNaN(dateObj.getTime())) return;
      dateObj.setHours(0, 0, 0, 0);
      const key = toKey(dateObj);

      if (!eventMap[key]) {
        eventMap[key] = { type: 'none', intensity: 0, details: [] };
      }

      count++;
      if (eventMap[key].type === 'none') {
        eventMap[key].type = 'applied';
        eventMap[key].intensity = Math.min(eventMap[key].intensity + 1, 4);
      }
      eventMap[key].details.push(`Resume Updated: ${res.name}`);
    });

    // Process completed focus items
    const todayKey = toKey(today);
    focusTasks.filter((t) => t.completed).forEach((task) => {
      if (!eventMap[todayKey]) {
        eventMap[todayKey] = { type: 'none', intensity: 0, details: [] };
      }
      count++;
      if (eventMap[todayKey].type === 'none') {
        eventMap[todayKey].type = 'applied';
        eventMap[todayKey].intensity = Math.min(eventMap[todayKey].intensity + 1, 4);
      }
      eventMap[todayKey].details.push(`Completed Focus: ${task.title}`);
    });

    const data: DayData[] = [];
    for (let i = 0; i < daysCount; i++) {
      const date = new Date(startDate.getTime() + i * 86400000);
      date.setHours(0, 0, 0, 0);
      const key = toKey(date);
      const entry = eventMap[key] || { type: 'none', intensity: 0, details: [] };

      data.push({
        date,
        dateStr: date.toLocaleDateString(),
        type: entry.type,
        intensity: entry.intensity,
        details: entry.details,
      });
    }

    const totalCells = startDayOfWeek + daysCount;
    const cols = Math.ceil(totalCells / 7);

    const grid: (DayData | null)[][] = Array.from({ length: cols }, () => Array(7).fill(null));
    const monthLabels: { label: string; colIndex: number }[] = [];
    let lastMonth = -1;

    let dataIndex = 0;
    for (let c = 0; c < cols; c++) {
      let firstDayInCol: Date | null = null;
      for (let r = 0; r < 7; r++) {
        if (c === 0 && r < startDayOfWeek) continue;
        if (dataIndex >= daysCount) break;

        const cellData = data[dataIndex++];
        grid[c][r] = cellData;

        if (!firstDayInCol) firstDayInCol = cellData.date;
      }

      if (firstDayInCol) {
        const month = firstDayInCol.getMonth();
        if (month !== lastMonth) {
          monthLabels.push({
            label: firstDayInCol.toLocaleString('default', { month: 'short' }),
            colIndex: c
          });
          lastMonth = month;
        }
      }
    }

    return { grid, monthLabels, totalContributions: count };
  }, [applications, resumes, focusTasks]);

  const getColor = (type: EventType, intensity: number) => {
    switch (type) {
      case 'offer': return "bg-[#FF69B4] border border-[#FF69B4]/50 shadow-[0_0_10px_rgba(255,105,180,0.6)]";
      case 'interview': return "bg-orange-500 border border-orange-400/50 shadow-[0_0_8px_rgba(249,115,22,0.5)]";
      case 'oa': return "bg-yellow-400 border border-yellow-300/50 shadow-[0_0_6px_rgba(250,204,21,0.4)]";
      case 'applied':
        switch (intensity) {
          case 1: return "bg-emerald-900/60 border border-emerald-800/50";
          case 2: return "bg-emerald-700/80 border border-emerald-600/50";
          case 3: return "bg-emerald-500 border border-emerald-400/50";
          case 4: return "bg-emerald-400 border border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.4)]";
          default: return "bg-white/5 border border-white/5";
        }
      default: return "bg-white/5 border border-white/5";
    }
  };

  const getTooltip = (data: DayData) => {
    if (data.details && data.details.length > 0) {
      return `${data.details.join(" • ")} on ${data.dateStr}`;
    }
    switch (data.type) {
      case 'offer': return `Job Offer on ${data.dateStr}`;
      case 'interview': return `Interview on ${data.dateStr}`;
      case 'oa': return `Online Assessment on ${data.dateStr}`;
      case 'applied': return `${data.intensity} action(s) on ${data.dateStr}`;
      default: return `No activity on ${data.dateStr}`;
    }
  };

  return (
    <div className="bg-surface border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-text-primary leading-tight">
            {totalContributions} career action{totalContributions === 1 ? '' : 's'} tracked
          </h2>
          <p className="text-xs text-text-muted mt-0.5">Your real career activity timeline over the last {daysCount} days.</p>
        </div>
      </div>

      <div className="flex-1 w-full overflow-x-auto custom-scrollbar pb-4">
        <div className="min-w-max">
          {/* Month Labels */}
          <div className="flex relative h-6 mb-1 text-[10px] text-text-muted font-medium ml-8">
            {monthLabels.map((ml, i) => (
              <div 
                key={i} 
                className="absolute" 
                style={{ left: `${ml.colIndex * (12 + 4)}px` }}
              >
                {ml.label}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            {/* Day Labels (Mon, Wed, Fri) */}
            <div className="flex flex-col gap-1 text-[10px] text-text-muted font-medium w-6 pt-1">
              <div className="h-3"></div>
              <div className="h-3 leading-[12px]">Mon</div>
              <div className="h-3"></div>
              <div className="h-3 leading-[12px]">Wed</div>
              <div className="h-3"></div>
              <div className="h-3 leading-[12px]">Fri</div>
              <div className="h-3"></div>
            </div>

            {/* Calendar Grid */}
            <div className="flex gap-1">
              {grid.map((col, colIndex) => (
                <div key={colIndex} className="flex flex-col gap-1">
                  {col.map((cell, rowIndex) => {
                    if (!cell) {
                      return <div key={rowIndex} className="w-3 h-3" />;
                    }
                    return (
                      <motion.div
                        key={rowIndex}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: (colIndex * 7 + rowIndex) * 0.001 }}
                        className={`w-3 h-3 rounded-[2px] ${getColor(cell.type, cell.intensity)}`}
                        title={getTooltip(cell)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center justify-between gap-4 mt-6 text-[10px] text-text-muted font-medium border-t border-white/5 pt-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-[2px] bg-white/5" />
            <span>None</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-900/60" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400" />
            </div>
            <span>Applied (Density)</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-[2px] bg-yellow-400" />
            <span>OA</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-[2px] bg-orange-500" />
            <span>Interview</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-[2px] bg-[#FF69B4]" />
            <span>Job Offer</span>
          </div>
        </div>
      </div>
    </div>
  );
}
