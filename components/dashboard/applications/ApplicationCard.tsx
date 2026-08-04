"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Calendar, MapPin, MoreHorizontal, FileText, DollarSign, Edit, Trash2 } from "lucide-react";
import { JobApplication } from "@/lib/mock-data";
import { useRouter } from "next/navigation";

interface ApplicationCardProps {
  application: JobApplication;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onEdit: (application: JobApplication) => void;
  onDelete: (id: string) => void;
}

export function ApplicationCard({ application, onDragStart, onEdit, onDelete }: ApplicationCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleCardClick = (e: React.MouseEvent) => {
    if (menuRef.current && menuRef.current.contains(e.target as Node)) {
      return;
    }
    router.push(`/dashboard/applications/${application.id}`);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);
  
  // Format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div
      layout
      layoutId={application.id}
      draggable
      onDragStart={(e: any) => onDragStart(e, application.id)}
      onClick={handleCardClick}
      onMouseEnter={() => router.prefetch(`/dashboard/applications/${application.id}`)}
      className="bg-surface/80 border border-white/5 rounded-2xl p-4 cursor-pointer hover:bg-surface hover:border-white/10 transition-all shadow-sm hover:shadow-glow-sm group relative"
    >
      
      <div className="flex justify-between items-start mb-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-white/5 shadow-inner">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-1">{application.roleTitle}</h3>
            <p className="text-xs text-text-muted font-medium">{application.companyName}</p>
          </div>
        </div>
        
        <div className="relative" ref={menuRef}>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="text-text-muted hover:text-white transition-colors p-1 rounded-md hover:bg-white/5 relative z-20"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          
          <AnimatePresence>
            {menuOpen && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, transformOrigin: "top right" }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 mt-1 w-36 bg-surface border border-white/10 rounded-xl shadow-xl overflow-hidden z-30"
              >
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenuOpen(false);
                    onEdit(application);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <Edit className="w-4 h-4 text-text-muted" />
                  Edit
                </button>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDelete(application.id);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 border-t border-white/5"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="space-y-2 mb-4 relative z-10">
        {application.location && (
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{application.location}</span>
          </div>
        )}
        {application.salaryRange && (
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <DollarSign className="w-3.5 h-3.5" />
            <span>{application.salaryRange}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/5 relative z-10">
        <div className="flex items-center gap-2">
          {application.resumeId ? (
             <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-text-secondary">
               <FileText className="w-3 h-3 text-primary" />
               <span>Linked</span>
             </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-text-muted opacity-50">
               <FileText className="w-3 h-3" />
               <span>No Resume</span>
             </div>
          )}
        </div>
        
        {application.deadline ? (
          <div className="flex items-center gap-1.5 text-xs font-medium text-orange-400 bg-orange-400/10 px-2 py-1 rounded-md">
            <Calendar className="w-3 h-3" />
            <span>Due {formatDate(application.deadline)}</span>
          </div>
        ) : application.applicationDate ? (
           <div className="flex items-center gap-1.5 text-[11px] font-medium text-text-muted">
            <span>Applied {formatDate(application.applicationDate)}</span>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
