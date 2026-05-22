"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, Video, Mail, FileText } from "lucide-react";

const events = [
  {
    id: 1,
    title: "Google OA Deadline",
    date: "Tomorrow, 11:59 PM",
    icon: Clock,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20"
  },
  {
    id: 2,
    title: "Interview with Stripe",
    date: "Friday, 2:00 PM EST",
    icon: Video,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20"
  },
  {
    id: 3,
    title: "Resume Review Pending",
    date: "Awaiting AI Analysis",
    icon: FileText,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20"
  },
  {
    id: 4,
    title: "Follow-up Recruiter Email",
    date: "Next Monday",
    icon: Mail,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20"
  }
];

export function Upcoming() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-text-secondary" />
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Upcoming</h2>
      </div>

      <div className="bg-surface/50 border border-white/5 rounded-2xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all group"
            >
              <div className={`w-8 h-8 rounded-lg ${event.bg} ${event.border} border flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform`}>
                <event.icon className={`w-4 h-4 ${event.color}`} />
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium text-text-primary group-hover:text-white transition-colors">
                  {event.title}
                </span>
                <span className="text-[11px] font-medium text-text-muted mt-0.5">
                  {event.date}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
