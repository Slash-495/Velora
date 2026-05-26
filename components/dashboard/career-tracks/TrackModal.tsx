"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Target, Briefcase } from "lucide-react";
import { useState } from "react";
import { CareerTrack } from "@/lib/mock-data";

interface TrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (track: CareerTrack) => void;
}

const COLORS = [
  { id: "blue", class: "bg-blue-500" },
  { id: "emerald", class: "bg-emerald-500" },
  { id: "orange", class: "bg-orange-500" },
  { id: "purple", class: "bg-purple-500" },
  { id: "pink", class: "bg-pink-500" },
];

export function TrackModal({ isOpen, onClose, onSave }: TrackModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    color: "blue",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.role) {
      alert("Please fill in both Name and Target Role.");
      return;
    }

    const newTrack: CareerTrack = {
      id: `track-${Date.now()}`,
      name: formData.name,
      role: formData.role,
      status: "Active",
      color: formData.color,
    };

    onSave(newTrack);
    setFormData({ name: "", role: "", color: "blue" });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-surface border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
            <div>
              <h2 className="text-xl font-bold text-text-primary">Create Career Track</h2>
              <p className="text-sm text-text-muted mt-1">Define a new path for your job search.</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-text-muted hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-primary">Track Name *</label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Big Tech SWE"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-primary">Target Role *</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input 
                  type="text" 
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-primary">Accent Color</label>
              <div className="flex items-center gap-3">
                {COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setFormData(prev => ({ ...prev, color: color.id }))}
                    className={`w-8 h-8 rounded-full ${color.class} flex items-center justify-center transition-transform hover:scale-110 ${
                      formData.color === color.id ? 'ring-2 ring-white ring-offset-2 ring-offset-background' : ''
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-white/10 bg-white/5 flex items-center justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-semibold text-text-primary hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              className="px-5 py-2.5 rounded-xl font-semibold bg-primary text-white hover:bg-primary/90 shadow-glow-primary active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Track
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
