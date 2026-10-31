"use client";

import { Bell, Plus, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserApplications } from "@/lib/user-data-store";
import { useAuth, deriveUserProfile } from "@/hooks/use-auth";
import { createClient } from "@/utils/supabase/client";

export function Topbar({ user: initialUser }: { user: any }) {
  const router = useRouter();
  const applications = useUserApplications();
  const { user, displayName, avatarUrl: authAvatarUrl } = useAuth(initialUser);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [customName, setCustomName] = useState<string | null>(null);

  const activeAppsCount = applications.filter((a) => a.status !== "rejected").length;
  const interviewsCount = applications.filter((a) => a.status === "interview").length;

  useEffect(() => {
    const handleProfileUpdated = async () => {
      const supabase = createClient();
      const {
        data: { user: refreshedUser },
      } = await supabase.auth.getUser();
      if (refreshedUser) {
        const derived = deriveUserProfile(refreshedUser);
        setCustomName(derived.displayName || null);
        setCustomAvatar(derived.avatarUrl);
      }
    };

    window.addEventListener("profileUpdated", handleProfileUpdated);
    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdated);
    };
  }, []);

  const effectiveAvatar = customAvatar ?? authAvatarUrl;
  const effectiveName = customName || displayName;
  const initialChar = (effectiveName || user?.email || "").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 md:px-8">
      {/* Mobile Spacer (for menu button) */}
      <div className="w-8 md:hidden" />

      {/* Career Pulse */}
      <div className="flex-1 max-w-2xl hidden md:flex items-center gap-6 px-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-inner">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium text-text-secondary">
            <strong className="text-text-primary">{activeAppsCount}</strong> Active Apps
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-inner">
          <span className="text-orange-400 text-xs">🔥</span>
          <span className="text-xs font-medium text-text-secondary">
            <strong className="text-text-primary">1 Day</strong> Streak
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-inner">
          <span className="text-primary text-xs">🎯</span>
          <span className="text-xs font-medium text-text-secondary">
            <strong className="text-text-primary">{interviewsCount}</strong> Interviews
          </span>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4 ml-auto">
        <button
          onClick={() => router.push("/dashboard/resume-studio/new")}
          onMouseEnter={() => router.prefetch("/dashboard/resume-studio/new")}
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

        <button
          onClick={() => router.push("/dashboard/profile")}
          onMouseEnter={() => router.prefetch("/dashboard/profile")}
          className="flex items-center gap-2.5 pl-1 pr-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          title={effectiveName || user?.email || "Go to Profile"}
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/20 border border-primary/30 text-primary relative overflow-hidden shrink-0">
            {effectiveAvatar ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={effectiveAvatar}
                alt={effectiveName || "Profile"}
                className="w-full h-full object-cover relative z-10"
              />
            ) : initialChar ? (
              <span className="text-xs font-medium uppercase relative z-10">
                {initialChar}
              </span>
            ) : (
              <User className="w-4 h-4 relative z-10" />
            )}
          </div>
          {effectiveName && (
            <span className="hidden md:inline text-xs font-medium text-text-primary max-w-[140px] truncate">
              {effectiveName}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
