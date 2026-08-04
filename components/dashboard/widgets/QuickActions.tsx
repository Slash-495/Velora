"use client";

import { motion } from "framer-motion";
import { Plus, FileText, Briefcase, Send, Target } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const actions = [
  {
    name: "New Resume",
    icon: FileText,
    href: "/resume/new",
    color: "text-blue-400"
  },
  {
    name: "Add Track",
    icon: Briefcase,
    href: "/dashboard/tracks/new",
    color: "text-purple-400"
  },
  {
    name: "Log Application",
    icon: Send,
    href: "/applications/new",
    color: "text-emerald-400"
  },
  {
    name: "ATS Check",
    icon: Target,
    href: "/tools/ats",
    color: "text-primary-glow"
  }
];

export function QuickActions() {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Quick Actions</h2>
      <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <motion.div
            key={action.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link 
              href={action.href}
              onMouseEnter={() => router.prefetch(action.href)}
              className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-white/5 hover:border-white/10 hover:bg-white/5 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                <action.icon className={`w-4 h-4 ${action.color}`} />
              </div>
              <span className="text-sm font-medium text-text-primary group-hover:text-white transition-colors">
                {action.name}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
