"use client";

import { useState } from "react";
import { ApplicationStatus, JobApplication } from "@/lib/mock-data";
import { ApplicationCard } from "./ApplicationCard";
import { motion, AnimatePresence } from "framer-motion";

const COLUMNS: { id: ApplicationStatus; title: string; color: string }[] = [
  { id: 'wishlist', title: 'Wishlist', color: 'bg-gray-500' },
  { id: 'applied', title: 'Applied', color: 'bg-blue-500' },
  { id: 'oa', title: 'Online Assessment', color: 'bg-purple-500' },
  { id: 'interview', title: 'Interviewing', color: 'bg-orange-500' },
  { id: 'final_round', title: 'Final Round', color: 'bg-pink-500' },
  { id: 'offer', title: 'Offer', color: 'bg-green-500' },
  { id: 'rejected', title: 'Rejected', color: 'bg-red-500' },
];

interface KanbanBoardProps {
  applications: JobApplication[];
  onUpdateApplication: (id: string, updates: Partial<JobApplication>) => void;
  onEdit: (application: JobApplication) => void;
  onDelete: (id: string) => void;
}

export function KanbanBoard({ applications, onUpdateApplication, onEdit, onDelete }: KanbanBoardProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    // Set data for Firefox compatibility
    e.dataTransfer.setData('text/plain', id);
    // Slight delay to allow the drag image to generate before adding styles
    setTimeout(() => {
      // Could add a dragging class here if needed
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent, columnId: ApplicationStatus) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, columnId: ApplicationStatus) => {
    e.preventDefault();
    if (!draggedId) return;

    onUpdateApplication(draggedId, { status: columnId });
    setDraggedId(null);
  };

  return (
    <div className="flex h-[calc(100vh-200px)] gap-6 overflow-x-auto pb-6 custom-scrollbar snap-x">
      {COLUMNS.map((col) => {
        const columnApps = applications.filter((app) => app.status === col.id);

        return (
          <div 
            key={col.id} 
            className="flex-shrink-0 w-[320px] flex flex-col snap-center"
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${col.color}`}></div>
                <h2 className="font-bold text-text-primary">{col.title}</h2>
              </div>
              <span className="text-xs font-semibold bg-white/10 text-text-muted px-2 py-0.5 rounded-full">
                {columnApps.length}
              </span>
            </div>

            <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-3 overflow-y-auto custom-scrollbar flex flex-col gap-3 transition-colors duration-200">
              <AnimatePresence>
                {columnApps.map((app) => (
                  <ApplicationCard 
                    key={app.id} 
                    application={app} 
                    onDragStart={handleDragStart} 
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </AnimatePresence>
              
              {columnApps.length === 0 && (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl text-text-muted text-sm font-medium">
                  Drop here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
