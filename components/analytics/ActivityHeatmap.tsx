"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { Activity } from "lucide-react";

type EventType = 'none' | 'applied' | 'oa' | 'interview' | 'offer';

interface DayData {
  date: Date;
  type: EventType;
  intensity: number; // For 'applied', 1-4
}

export function ActivityHeatmap() {
  const daysCount = 365;
  
  const { grid, monthLabels, totalContributions } = useMemo(() => {
    const today = new Date();
    // Normalize today to start of day
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(today.getTime() - (daysCount - 1) * 86400000);
    const startDayOfWeek = startDate.getDay(); // 0 = Sun, 6 = Sat
    
    let contributions = 0;
    const data: DayData[] = [];
    
    // Generate data
    for (let i = 0; i < daysCount; i++) {
      const date = new Date(startDate.getTime() + i * 86400000);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      let type: EventType = 'none';
      let intensity = 0;
      
      const rand = Math.random();
      
      // Random mock probabilities
      if (rand > (isWeekend ? 0.8 : 0.6)) {
        // Did something today
        contributions++;
        
        const eventRand = Math.random();
        if (eventRand > 0.98) {
          type = 'offer';
        } else if (eventRand > 0.93) {
          type = 'interview';
        } else if (eventRand > 0.85) {
          type = 'oa';
        } else {
          type = 'applied';
          intensity = Math.floor(Math.random() * 4) + 1; // 1 to 4
        }
      }
      
      data.push({ date, type, intensity });
    }

    const totalCells = startDayOfWeek + daysCount;
    const cols = Math.ceil(totalCells / 7);
    
    // Build grid (column-major)
    const grid: (DayData | null)[][] = Array.from({ length: cols }, () => Array(7).fill(null));
    const monthLabels: { label: string; colIndex: number }[] = [];
    let lastMonth = -1;

    let dataIndex = 0;
    for (let c = 0; c < cols; c++) {
      let firstDayInCol: Date | null = null;
      for (let r = 0; r < 7; r++) {
        // Skip padding at start
        if (c === 0 && r < startDayOfWeek) continue;
        // Stop if we run out of data
        if (dataIndex >= daysCount) break;
        
        const cellData = data[dataIndex++];
        grid[c][r] = cellData;
        
        if (!firstDayInCol) firstDayInCol = cellData.date;
      }
      
      if (firstDayInCol) {
        const month = firstDayInCol.getMonth();
        if (month !== lastMonth) {
          // Add month label if it's not the very first column (unless it's the start of a month)
          // We'll just simplify and always add it, then filter out clustered ones if needed
          monthLabels.push({ 
            label: firstDayInCol.toLocaleString('default', { month: 'short' }), 
            colIndex: c 
          });
          lastMonth = month;
        }
      }
    }

    return { grid, monthLabels, totalContributions: contributions };
  }, []);

  const getColor = (type: EventType, intensity: number) => {
    switch (type) {
      case 'offer': return "bg-[#FF69B4] border border-[#FF69B4]/50 shadow-[0_0_10px_rgba(255,105,180,0.6)]"; // Pink
      case 'interview': return "bg-orange-500 border border-orange-400/50 shadow-[0_0_8px_rgba(249,115,22,0.5)]"; // Orange
      case 'oa': return "bg-yellow-400 border border-yellow-300/50 shadow-[0_0_6px_rgba(250,204,21,0.4)]"; // Yellow
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
    const dateStr = data.date.toLocaleDateString();
    switch (data.type) {
      case 'offer': return `Job Offer! on ${dateStr}`;
      case 'interview': return `Interview on ${dateStr}`;
      case 'oa': return `Online Assessment on ${dateStr}`;
      case 'applied': return `${data.intensity} application(s) on ${dateStr}`;
      default: return `No activity on ${dateStr}`;
    }
  };

  return (
    <div className="bg-surface border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-text-primary leading-tight">{totalContributions} career actions in the last year</h2>
          <p className="text-xs text-text-muted mt-0.5">Your career progress over the last 365 days.</p>
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
                style={{ left: `${ml.colIndex * (12 + 4)}px` }} // 12px width + 4px gap = 16px per col
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
                      return <div key={rowIndex} className="w-3 h-3" />; // Empty padding
                    }
                    return (
                      <motion.div
                        key={rowIndex}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: (colIndex * 7 + rowIndex) * 0.001 }} // Fast ripple
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
