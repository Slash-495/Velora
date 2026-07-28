"use client";

import { motion } from "framer-motion";
import { Building2, Search, Plus, MapPin, Globe, ExternalLink } from "lucide-react";
import Link from "next/link";
import { mockCompanies } from "@/lib/mock-data";

export default function CompanyResearchLibrary() {
  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            Company Intelligence
          </h1>
          <p className="text-text-muted mt-2 text-sm max-w-xl">
            Your centralized workspace for company research, interview preparation, and application tracking.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search companies..."
              className="pl-9 pr-4 py-2 bg-surface border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-primary/50 transition-colors w-64"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-background font-semibold rounded-xl hover:bg-primary/90 transition-colors text-sm">
            <Plus className="w-4 h-4" />
            Add Company
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockCompanies.map((company, i) => (
          <Link href={`/dashboard/company-research/${company.id}`} key={company.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-surface border border-white/5 hover:border-primary/30 rounded-3xl p-6 transition-all duration-300 hover:shadow-glow-primary/10 relative overflow-hidden flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-primary/20">
                  <span className="text-primary font-bold text-xl">{company.name.charAt(0)}</span>
                </div>
                <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-medium text-text-muted border border-white/10">
                  {company.industry}
                </span>
              </div>
              
              <h2 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">{company.name}</h2>
              <p className="text-sm text-text-muted line-clamp-2 mb-6 flex-1">
                {company.overview}
              </p>
              
              <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <MapPin className="w-3.5 h-3.5" />
                  {company.location}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-text-muted">
                    <Globe className="w-3.5 h-3.5" />
                    {company.website}
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
