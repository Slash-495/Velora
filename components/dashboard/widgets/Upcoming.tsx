"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Video, Mail, FileText, Plus, X, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useUserApplications } from "@/lib/user-data-store";

interface EventItem {
  id: string | number;
  title: string;
  date: string;
  type: "deadline" | "interview" | "review" | "email";
}

const EVENT_TYPES = [
  { id: "interview", label: "Interview", icon: Video, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
  { id: "deadline", label: "Deadline / OA", icon: Clock, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  { id: "review", label: "Review", icon: FileText, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { id: "email", label: "Email / Follow-up", icon: Mail, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" }
];

export function Upcoming() {
  const applications = useUserApplications();
  const [customEvents, setCustomEvents] = useState<EventItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [selectedType, setSelectedType] = useState<"deadline" | "interview" | "review" | "email">("interview");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("velora_upcoming_events");
      if (saved) {
        setCustomEvents(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  const updateEvents = (updated: EventItem[]) => {
    setCustomEvents(updated);
    try {
      localStorage.setItem("velora_upcoming_events", JSON.stringify(updated));
    } catch (e) {}
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate.trim()) return;

    const newEvt: EventItem = {
      id: Date.now(),
      title: newTitle.trim(),
      date: newDate.trim(),
      type: selectedType
    };

    updateEvents([...customEvents, newEvt]);
    setNewTitle("");
    setNewDate("");
    setIsAdding(false);
  };

  const handleDeleteEvent = (id: string | number) => {
    const updated = customEvents.filter(e => e.id !== id);
    updateEvents(updated);
  };

  // Combine dynamic application events (OAs, Interviews) with custom events
  const appEvents: EventItem[] = [];
  applications.forEach((app) => {
    if (app.status === "oa") {
      const rawDate = app.deadline || app.applicationDate;
      const formatted = rawDate ? new Date(rawDate).toLocaleDateString() : "Due soon";
      appEvents.push({
        id: `app-oa-${app.id}`,
        title: `${app.companyName} OA`,
        date: formatted,
        type: "deadline"
      });
    } else if (app.status === "interview") {
      const rawDate = app.deadline || app.applicationDate;
      const formatted = rawDate ? new Date(rawDate).toLocaleDateString() : "Scheduled";
      appEvents.push({
        id: `app-int-${app.id}`,
        title: `Interview with ${app.companyName}`,
        date: formatted,
        type: "interview"
      });
    }
  });

  const allEvents = [...appEvents, ...customEvents];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-text-secondary" />
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Upcoming Schedule</h2>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-text-primary border border-white/10 text-xs font-semibold transition-all cursor-pointer"
        >
          {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 text-primary" />}
          {isAdding ? "Cancel" : "Add Event"}
        </button>
      </div>

      {/* Add Event Inline Modal / Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddEvent}
            className="bg-surface border border-white/10 rounded-2xl p-4 space-y-3 shadow-xl overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Event Title (e.g. System Design Interview)"
                autoFocus
                className="w-full bg-black/20 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                type="text"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                placeholder="Date & Time (e.g. Tomorrow, 4:00 PM)"
                className="w-full bg-black/20 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                {EVENT_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedType(t.id as any)}
                    className={`text-xs font-medium px-3 py-1 rounded-xl border flex items-center gap-1.5 transition-all ${
                      selectedType === t.id
                        ? `${t.bg} ${t.color} ${t.border} ring-1 ring-white/20`
                        : "bg-white/5 text-text-muted border-white/5 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={!newTitle.trim() || !newDate.trim()}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-glow disabled:opacity-40 text-black font-bold text-xs transition-all shadow-glow-primary cursor-pointer ml-auto"
              >
                Save Event
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Grid List */}
      <div className="bg-surface/50 border border-white/5 rounded-2xl p-4">
        {allEvents.length === 0 ? (
          <div className="text-center py-6 text-xs text-text-muted">
            No upcoming events scheduled. Click "+ Add Event" or set application deadlines to track them!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
            {allEvents.map((event, index) => {
              const config = EVENT_TYPES.find(t => t.id === event.type) || EVENT_TYPES[0];
              const Icon = config.icon;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start justify-between p-3.5 rounded-xl bg-surface border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all group relative"
                >
                  <div className="flex items-start gap-3 min-w-0 pr-2">
                    <div className={`w-8 h-8 rounded-lg ${config.bg} ${config.border} border flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-text-primary group-hover:text-white transition-colors truncate">
                        {event.title}
                      </span>
                      <span className="text-[11px] font-medium text-text-muted mt-0.5 truncate">
                        {event.date}
                      </span>
                    </div>
                  </div>

                  {typeof event.id === "number" && (
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/20 text-text-muted hover:text-red-400 transition-all shrink-0 cursor-pointer"
                      title="Remove event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
