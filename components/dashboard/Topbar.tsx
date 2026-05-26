"use client";

import { Bell, Search, Plus, User, FileText } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { mockResumes } from "@/lib/mock-data";

export function Topbar({ user }: { user: any }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredResumes = mockResumes.filter(r => 
    (r.title || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    (r.content?.roleTitle || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 md:px-8">
      {/* Mobile Spacer (for menu button) */}
      <div className="w-8 md:hidden" />

      {/* Career Pulse (Replaced Search) */}
      <div className="flex-1 max-w-2xl hidden md:flex items-center gap-6 px-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-inner">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium text-text-secondary"><strong className="text-text-primary">12</strong> Active Apps</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-inner">
          <span className="text-orange-400 text-xs">🔥</span>
          <span className="text-xs font-medium text-text-secondary"><strong className="text-text-primary">5 Day</strong> Streak</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-inner">
          <span className="text-primary text-xs">🎯</span>
          <span className="text-xs font-medium text-text-secondary"><strong className="text-text-primary">3</strong> Interviews</span>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4 ml-auto">
        <button 
          onClick={() => router.push('/dashboard/resume-studio/new')}
          className="hidden sm:flex items-center gap-2 btn-glow py-1.5 px-3 text-sm rounded-lg"
        >
          <Plus className="w-4 h-4" />
          <span>New Resume</span>
        </button>

        <div className="w-px h-6 bg-white/10 hidden sm:block mx-1" />

        <button className="relative p-2 text-text-muted hover:text-text-primary transition-colors rounded-lg hover:bg-white/5">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
        </button>

        <button className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition-colors">
          {user?.email ? (
            <span className="text-xs font-medium uppercase">
              {user.email.charAt(0)}
            </span>
          ) : (
            <User className="w-4 h-4" />
          )}
        </button>
      </div>
    </header>
  );
}
