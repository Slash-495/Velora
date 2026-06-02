"use client";

import { motion } from "framer-motion";
import { UserCircle, Shield, Camera } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { ActivityHeatmap } from "@/components/analytics/ActivityHeatmap";
import { CareerOverview } from "@/components/analytics/CareerOverview";
import { TrackPerformance } from "@/components/analytics/TrackPerformance";
import { ResumePerformance } from "@/components/analytics/ResumePerformance";
import { CareerMilestones } from "@/components/analytics/CareerMilestones";
import { EditProfileModal } from "@/components/analytics/EditProfileModal";

export default function ProfilePage() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userName, setUserName] = useState("John Doe");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from local storage on mount
  useEffect(() => {
    const storedName = localStorage.getItem("velora_user_name");
    const storedAvatar = localStorage.getItem("velora_user_avatar");
    if (storedName) setUserName(storedName);
    if (storedAvatar) setAvatarUrl(storedAvatar);
  }, []);

  const handleNameSave = (newName: string) => {
    setUserName(newName);
    localStorage.setItem("velora_user_name", newName);
    
    // Dispatch custom event to tell Topbar to update
    window.dispatchEvent(new Event("profileUpdated"));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatarUrl(base64String);
        localStorage.setItem("velora_user_avatar", base64String);
        
        // Dispatch custom event to tell Topbar to update
        window.dispatchEvent(new Event("profileUpdated"));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      
      {/* Main Grid matching the Wireframe */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ROW 1 */}
        {/* Profile Card (Left) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 bg-surface border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col items-center h-full"
        >
          {/* Avatar with Upload */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="relative w-full aspect-square max-w-[200px] mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group cursor-pointer hover:border-primary/50 transition-colors overflow-hidden shadow-inner"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <UserCircle className="w-24 h-24 text-text-muted" strokeWidth={1} />
            )}
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-white/10 px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-2">
                <Camera className="w-3 h-3" /> Upload Photo
              </span>
            </div>
          </div>
          
          <div className="text-center w-full mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight leading-tight">{userName}</h1>
            <p className="text-text-muted text-sm mt-1">@velora_user</p>
          </div>

          <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 mb-6 flex items-center gap-3 mt-auto">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Profile Strength</span>
              <span className="text-lg font-bold text-white leading-tight">Advanced</span>
            </div>
          </div>
          
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors"
          >
            Edit Profile
          </button>
        </motion.div>

        {/* Career Intelligence (Right) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="space-y-4">
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl font-bold text-white tracking-tight px-2"
            >
              Career Intelligence
            </motion.h2>
            <CareerOverview />
          </div>

          {/* Moved Milestones up here to fill the vertical gap next to the Profile Card */}
          <div className="flex-1">
            <CareerMilestones />
          </div>
        </div>

        {/* ROW 3: Track Performance & Top Resumes (Split Half/Half) */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          <TrackPerformance />
          <ResumePerformance />
        </div>

        {/* ROW 4: GitHub Chart (Full Width) */}
        <div className="lg:col-span-3">
          <ActivityHeatmap />
        </div>

      </div>

      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        currentName={userName}
        onSave={handleNameSave}
      />
    </div>
  );
}
