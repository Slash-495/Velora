"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Target, Plus, X, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

interface Task {
  id: number;
  title: string;
  tag: string;
  completed: boolean;
  color: string;
}

const TAG_OPTIONS = [
  { name: "High Priority", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  { name: "Optimization", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { name: "Communication", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { name: "Content", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
];

const initialTasks: Task[] = [
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
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedTag, setSelectedTag] = useState(TAG_OPTIONS[0].name);

  // Load from localStorage if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem("velora_todays_focus");
      if (saved) {
        setTasks(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  // Save to localStorage on change
  const updateTasks = (updated: Task[]) => {
    setTasks(updated);
    try {
      localStorage.setItem("velora_todays_focus", JSON.stringify(updated));
    } catch (e) {}
  };

  const toggleTask = (id: number) => {
    const updated = tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    updateTasks(updated);
  };

  const deleteTask = (id: number) => {
    const updated = tasks.filter(t => t.id !== id);
    updateTasks(updated);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const tagObj = TAG_OPTIONS.find(t => t.name === selectedTag) || TAG_OPTIONS[0];

    const newTask: Task = {
      id: Date.now(),
      title: newTitle.trim(),
      tag: tagObj.name,
      completed: false,
      color: tagObj.color
    };

    updateTasks([newTask, ...tasks]);
    setNewTitle("");
    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Today's Focus
        </h2>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/5 text-text-muted border border-white/5">
            {tasks.filter(t => t.completed).length}/{tasks.length} Done
          </span>
          
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-semibold transition-all cursor-pointer"
          >
            {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {isAdding ? "Cancel" : "Add Focus"}
          </button>
        </div>
      </div>

      {/* Inline Add Task Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddTask}
            className="bg-surface border border-primary/30 rounded-xl p-3.5 space-y-3 shadow-lg overflow-hidden"
          >
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Prepare System Design notes for Google..."
              autoFocus
              className="w-full bg-black/20 border border-white/10 rounded-lg px-3.5 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
            />

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                {TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag.name}
                    type="button"
                    onClick={() => setSelectedTag(tag.name)}
                    className={`text-[10px] uppercase font-semibold px-2 py-1 rounded border transition-all ${
                      selectedTag === tag.name 
                        ? `${tag.color} ring-1 ring-white/20 scale-105` 
                        : "bg-white/5 text-text-muted border-white/5 opacity-60 hover:opacity-100"
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-glow disabled:opacity-40 text-black font-bold text-xs transition-all shadow-glow-primary cursor-pointer ml-auto"
              >
                Save Focus Item
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Task List */}
      <div className="grid gap-2">
        {tasks.length === 0 ? (
          <div className="text-center py-6 text-xs text-text-muted bg-surface/30 rounded-xl border border-white/5">
            No focus items for today yet. Click "+ Add Focus" to create one!
          </div>
        ) : (
          tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 hover:shadow-lg ${
                task.completed 
                  ? "bg-surface/30 border-white/5 opacity-60" 
                  : "bg-surface border-white/5 hover:border-white/10 hover:-translate-y-0.5"
              }`}
            >
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => toggleTask(task.id)}
                  className="shrink-0 transition-transform active:scale-90 cursor-pointer"
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

              <button 
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-text-muted hover:text-red-400 transition-all cursor-pointer"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
