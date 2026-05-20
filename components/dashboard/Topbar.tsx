"use client";

import { Bell, Search, Plus, User } from "lucide-react";
import { useState } from "react";

export function Topbar({ user }: { user: any }) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 md:px-8">
      {/* Mobile Spacer (for menu button) */}
      <div className="w-8 md:hidden" />

      {/* Search Input */}
      <div className="flex-1 max-w-md hidden sm:flex items-center">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search resumes, tracks, or applications..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4 ml-auto">
        <button className="hidden sm:flex items-center gap-2 btn-glow py-1.5 px-3 text-sm rounded-lg">
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
