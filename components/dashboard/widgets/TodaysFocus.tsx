"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, Target, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const initialTasks = [
  {
    id: 1,
    title: "Tailor SDE Resume for Microsoft",
    tag: "High Priority",
    completed: false,
    color: "bg-red-500/10 text-red-400 border-red-500/20"
  },
  {
    id: 2,
    title: "Follow up on Stripe application",
    tag: "Communication",
    completed: false,
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20"
  },
  {
    id: 3,
    title: "Improve ATS score for DA Resume",
    tag: "Optimization",
    completed: false,
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  },
  {
    id: 4,
    title: "Update React project section",
    tag: "Content",
    completed: true,
    color: "bg-white/5 text-text-muted border-white/5"
  }
];

export function TodaysFocus() {
  const [tasks, setTasks] = useState(initialTasks);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Today's Focus
        </h2>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/5 text-text-muted border border-white/5">
          {tasks.filter(t => t.completed).length}/{tasks.length} Done
        </span>
      </div>

      <div className="grid gap-2">
        {tasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 hover:shadow-lg ${
              task.completed 
                ? "bg-surface/30 border-white/5 opacity-60" 
                : "bg-surface border-white/5 hover:border-white/10 hover:-translate-y-0.5"
            }`}
          >
            <div className="flex items-center gap-4">
              <button 
                onClick={() => toggleTask(task.id)}
                className="shrink-0 transition-transform active:scale-90"
              >
                {task.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                ) : (
                  <Circle className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />
                )}
              </button>
              
              <div className="flex flex-col">
                <span className={`text-sm font-medium transition-colors ${
                  task.completed ? "text-text-muted line-through" : "text-text-primary group-hover:text-white"
                }`}>
                  {task.title}
                </span>
                <span className={`text-[10px] uppercase tracking-wider font-semibold mt-1 px-2 py-0.5 rounded border inline-flex w-fit ${
                  task.completed ? "bg-white/5 text-text-muted border-white/5" : task.color
                }`}>
                  {task.tag}
                </span>
              </div>
            </div>

            <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/10 text-text-muted hover:text-text-primary transition-all">
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
