"use client";

import { motion } from "framer-motion";
import { Activity, Send, Clock, Video, Award, AlertCircle, Bookmark, CheckCircle2, FileText } from "lucide-react";
import { useUserApplications, useUserResumes } from "@/lib/user-data-store";
import { useEffect, useState } from "react";

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  time: string;
  timestamp: number;
  icon: any;
  color: string;
  bg: string;
  border: string;
}

export function ActivityTimeline() {
  const applications = useUserApplications();
  const resumes = useUserResumes();
  const [focusTasks, setFocusTasks] = useState<any[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("velora_todays_focus");
      if (saved) setFocusTasks(JSON.parse(saved));
    } catch (e) {}

    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem("velora_todays_focus");
        if (saved) setFocusTasks(JSON.parse(saved));
      } catch (e) {}
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const activityItems: ActivityItem[] = [];

  // 1. Applications Activity
  applications.forEach((app) => {
    const rawDate = app.applicationDate || app.deadline || new Date().toISOString();
    const dateObj = new Date(rawDate);
    const dateFormatted = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString() : "Recently";

    switch (app.status) {
      case "applied":
        activityItems.push({
          id: `app-applied-${app.id}`,
          title: `Applied to ${app.companyName}`,
          description: `${app.roleTitle} position • ${dateFormatted}`,
          time: dateFormatted,
          timestamp: !isNaN(dateObj.getTime()) ? dateObj.getTime() : Date.now(),
          icon: Send,
          color: "text-blue-400",
          bg: "bg-blue-500/10",
          border: "border-blue-500/20",
        });
        break;
      case "oa":
        activityItems.push({
          id: `app-oa-${app.id}`,
          title: `OA Scheduled: ${app.companyName}`,
          description: `${app.roleTitle} • Online Assessment ${app.deadline ? `due ${new Date(app.deadline).toLocaleDateString()}` : `on ${dateFormatted}`}`,
          time: dateFormatted,
          timestamp: !isNaN(dateObj.getTime()) ? dateObj.getTime() + 1000 : Date.now(),
          icon: Clock,
          color: "text-purple-400",
          bg: "bg-purple-500/10",
          border: "border-purple-500/20",
        });
        break;
      case "interview":
        activityItems.push({
          id: `app-interview-${app.id}`,
          title: `Interview Scheduled: ${app.companyName}`,
          description: `${app.roleTitle} • Interview round ${app.deadline ? `on ${new Date(app.deadline).toLocaleDateString()}` : `active`}`,
          time: dateFormatted,
          timestamp: !isNaN(dateObj.getTime()) ? dateObj.getTime() + 2000 : Date.now(),
          icon: Video,
          color: "text-emerald-400",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/20",
        });
        break;
      case "offer":
        activityItems.push({
          id: `app-offer-${app.id}`,
          title: `Offer Received: ${app.companyName}`,
          description: `${app.roleTitle} ${app.salaryRange ? `(${app.salaryRange})` : ''}`,
          time: dateFormatted,
          timestamp: !isNaN(dateObj.getTime()) ? dateObj.getTime() + 3000 : Date.now(),
          icon: Award,
          color: "text-yellow-400",
          bg: "bg-yellow-500/10",
          border: "border-yellow-500/20",
        });
        break;
      case "rejected":
        activityItems.push({
          id: `app-rejected-${app.id}`,
          title: `Application Update: ${app.companyName}`,
          description: `${app.roleTitle} • Status updated`,
          time: dateFormatted,
          timestamp: !isNaN(dateObj.getTime()) ? dateObj.getTime() : Date.now(),
          icon: AlertCircle,
          color: "text-red-400",
          bg: "bg-red-500/10",
          border: "border-red-500/20",
        });
        break;
      case "wishlist":
        activityItems.push({
          id: `app-wishlist-${app.id}`,
          title: `Saved Job: ${app.companyName}`,
          description: `${app.roleTitle} added to wishlist`,
          time: dateFormatted,
          timestamp: !isNaN(dateObj.getTime()) ? dateObj.getTime() : Date.now(),
          icon: Bookmark,
          color: "text-slate-400",
          bg: "bg-slate-500/10",
          border: "border-slate-500/20",
        });
        break;
    }
  });

  // 2. Completed Focus Items
  focusTasks.filter((t) => t.completed).forEach((task) => {
    activityItems.push({
      id: `focus-task-${task.id}`,
      title: `Completed Focus Item`,
      description: task.title,
      time: "Today",
      timestamp: Date.now() - 500,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    });
  });

  // 3. Resumes
  resumes.forEach((res) => {
    const resDate = new Date(res.updatedAt);
    const dateFormatted = !isNaN(resDate.getTime()) ? resDate.toLocaleDateString() : "Recently";
    activityItems.push({
      id: `resume-${res.id}`,
      title: res.name,
      description: `ATS Score: ${res.atsScore}/100 • Updated ${dateFormatted}`,
      time: dateFormatted,
      timestamp: !isNaN(resDate.getTime()) ? resDate.getTime() : Date.now(),
      icon: FileText,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    });
  });

  // Sort descending by timestamp
  activityItems.sort((a, b) => b.timestamp - a.timestamp);
  const displayItems = activityItems.slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-text-secondary" />
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Activity</h2>
      </div>

      <div className="relative pl-3">
        {/* Vertical connecting line */}
        <div className="absolute left-[27px] top-4 bottom-4 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent" />

        <div className="space-y-6">
          {displayItems.length === 0 ? (
            <div className="text-xs text-text-muted py-4">No recent activity yet. Add an application or focus item to start!</div>
          ) : (
            displayItems.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-4 relative z-10"
              >
                <div className={`w-8 h-8 rounded-full ${activity.bg} ${activity.border} border flex items-center justify-center shrink-0`}>
                  <activity.icon className={`w-3.5 h-3.5 ${activity.color}`} />
                </div>
                
                <div className="pt-1 flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-sm font-medium text-text-primary leading-none">{activity.title}</h4>
                    <span className="text-[10px] text-text-muted shrink-0 whitespace-nowrap">{activity.time}</span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1.5">{activity.description}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
