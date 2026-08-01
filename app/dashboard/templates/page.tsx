"use client";

import { motion } from "framer-motion";
import { Search, LayoutTemplate, Star, CheckCircle2, ChevronRight, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { availableTemplates } from "@/lib/templates";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

const categories = ["All", "ATS Friendly", "Modern", "Minimal", "Developer", "Creative", "Academic"];

export default function TemplatesGallery() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTemplates = availableTemplates.filter(t => {
    const matchesCategory = activeCategory === "All" || t.category === activeCategory;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      
      {/* Header Section */}
      <div className="pt-8 pb-6 px-4 md:px-8 max-w-7xl mx-auto w-full shrink-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-2">Resume Templates</h1>
            <p className="text-text-secondary text-sm max-w-xl">
              Choose from our curated collection of professional, ATS-optimized templates. Start building your perfect resume or switch templates dynamically in the studio.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input 
                type="text" 
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-black/20 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-colors w-64"
              />
            </div>
            <button className="p-2 bg-black/20 border border-white/10 rounded-xl text-text-muted hover:text-text-primary transition-colors">
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 mt-8 overflow-x-auto custom-scrollbar pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat 
                  ? "bg-primary text-white shadow-[0_0_15px_rgba(var(--primary),0.5)]" 
                  : "bg-white/5 text-text-secondary hover:bg-white/10 hover:text-text-primary border border-white/5"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Section */}
      <div className="flex-1 px-4 md:px-8 pb-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTemplates.map((template, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={template.id}
              className="group relative bg-surface/50 border border-white/5 rounded-2xl overflow-hidden hover:border-primary/30 transition-all hover:shadow-[0_8px_30px_rgba(var(--primary),0.1)] flex flex-col"
            >
              {/* Thumbnail Container */}
              <div className="aspect-[1/1.3] bg-black/40 relative overflow-hidden p-4">
                <div className="w-full h-full bg-white rounded-lg shadow-2xl origin-top transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-2 relative overflow-hidden">
                  <Image src={template.thumbnail} alt={template.name} fill className="object-cover rounded-lg opacity-90 group-hover:opacity-100" />
                </div>
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {template.atsFriendly && (
                    <span className="flex items-center gap-1 bg-emerald-500/90 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shadow-lg backdrop-blur-md">
                      <CheckCircle2 className="w-3 h-3" /> ATS Ready
                    </span>
                  )}
                  {template.id === 'velora-professional' && (
                    <span className="flex items-center gap-1 bg-primary/90 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shadow-lg backdrop-blur-md">
                      <Star className="w-3 h-3 fill-current" /> Featured
                    </span>
                  )}
                </div>

                {/* Hover Actions Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6 backdrop-blur-sm">
                  <div className="flex flex-col gap-3 w-full max-w-[200px] translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <button 
                      onClick={() => router.push(`/dashboard/resume-studio/new?template=${template.id}`)}
                      className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl shadow-[0_0_20px_rgba(var(--primary),0.4)] transition-all flex items-center justify-center gap-2"
                    >
                      <LayoutTemplate className="w-4 h-4" /> Use Template
                    </button>
                    <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl backdrop-blur-md transition-colors">
                      Preview
                    </button>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-text-primary text-lg">{template.name}</h3>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/20 whitespace-nowrap">
                    {template.category}
                  </span>
                </div>
                <p className="text-sm text-text-muted leading-relaxed line-clamp-2 mb-4">
                  {template.description}
                </p>
                
                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs font-medium text-text-secondary">
                    {template.id === 'velora-professional' ? '12k+ users' : 'New Template'}
                  </span>
                  <button className="text-primary hover:text-primary-glow p-1 rounded-full hover:bg-primary/10 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
