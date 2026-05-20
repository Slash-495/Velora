"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  CheckSquare, 
  Bot, 
  Settings,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const sidebarLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Career Tracks", href: "/dashboard/tracks", icon: Briefcase },
  { name: "Resume Studio", href: "/dashboard/resumes", icon: FileText },
  { name: "Applications", href: "/dashboard/applications", icon: CheckSquare },
  { name: "AI Assistant", href: "/dashboard/ai", icon: Bot },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-surface/50 backdrop-blur-2xl border-r border-white/5 w-64 p-4">
      <div className="flex items-center gap-3 px-2 mb-8 mt-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow-primary">
          <span className="text-white font-bold text-lg leading-none">V</span>
        </div>
        <span className="font-bold text-xl tracking-tight text-text-primary">Velora</span>
      </div>

      <nav className="flex-1 space-y-1">
        <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4 px-2">Menu</div>
        {sidebarLinks.map((link) => {
          const active = isActive(link.href);
          const Icon = link.icon;
          
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                active 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "text-primary" : "text-text-muted group-hover:text-text-primary"}`} />
              <span className="text-sm">{link.name}</span>
              {active && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="absolute left-0 w-1 h-8 bg-primary rounded-r-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-white/5 mt-auto">
        <Link
          href="/dashboard/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
            isActive("/dashboard/settings")
              ? "bg-primary/10 text-primary font-medium" 
              : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
          }`}
        >
          <Settings className={`w-5 h-5 ${isActive("/dashboard/settings") ? "text-primary" : "text-text-muted group-hover:text-text-primary"}`} />
          <span className="text-sm">Settings</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-surface border border-white/10 text-text-primary shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block h-screen sticky top-0 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 shadow-2xl"
            >
              <SidebarContent />
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-4 p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
