"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Building2, Search, Plus, MapPin, Globe, ExternalLink, X } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { mockCompanies } from "@/lib/mock-data";
import { createClient } from "@/utils/supabase/client";

export interface CompanyRecord {
  id: string;
  name: string;
  industry: string;
  location: string;
  overview: string;
  website: string;
  careersUrl: string;
}

export default function CompanyResearchLibrary() {
  const [companies, setCompanies] = useState<CompanyRecord[]>(mockCompanies);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    location: "",
    overview: "",
    website: "",
    careersUrl: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadCompanies() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("companies")
          .select("*")
          .order("updated_at", { ascending: false });

        if (!cancelled && !error && data && data.length > 0) {
          setCompanies(
            data.map((row: any) => ({
              id: row.id,
              name: row.name,
              industry: row.industry || "Technology",
              location: row.location || "Remote",
              overview: row.overview || "",
              website: row.website || "",
              careersUrl: row.careers_url || row.website || "",
            }))
          );
        }
      } catch {
        // Fallback to default companies when logged out
      }
    }

    loadCompanies();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCompanies = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return companies;
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q)
    );
  }, [companies, searchQuery]);

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const draft: CompanyRecord = {
      id: `comp-${Date.now()}`,
      name: formData.name.trim(),
      industry: formData.industry.trim() || "Technology",
      location: formData.location.trim() || "Remote",
      overview:
        formData.overview.trim() ||
        `Company intelligence workspace for ${formData.name.trim()}.`,
      website: formData.website.trim().replace(/^https?:\/\//, ""),
      careersUrl: formData.careersUrl.trim().replace(/^https?:\/\//, ""),
    };

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from("companies")
          .insert({
            name: draft.name,
            industry: draft.industry,
            location: draft.location,
            overview: draft.overview,
            website: draft.website,
            careers_url: draft.careersUrl,
          })
          .select("*")
          .single();

        if (!error && data) {
          draft.id = data.id;
        }
      }
    } catch {
      // Continue with local state in demo mode
    }

    setCompanies((prev) => [draft, ...prev]);
    setIsModalOpen(false);
    setFormData({
      name: "",
      industry: "",
      location: "",
      overview: "",
      website: "",
      careersUrl: "",
    });
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            Company Intelligence
          </h1>
          <p className="text-text-muted mt-2 text-sm max-w-xl">
            Your centralized workspace for company research, interview preparation,
            and application tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies..."
              className="pl-9 pr-4 py-2 bg-surface border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-primary/50 transition-colors w-64"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-background font-semibold rounded-xl hover:bg-primary/90 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Company
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map((company, i) => (
          <Link href={`/dashboard/company-research/${company.id}`} key={company.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-surface border border-white/5 hover:border-primary/30 rounded-3xl p-6 transition-all duration-300 hover:shadow-glow-primary/10 relative overflow-hidden flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-primary/20">
                  <span className="text-primary font-bold text-xl">
                    {company.name.charAt(0)}
                  </span>
                </div>
                <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-medium text-text-muted border border-white/10">
                  {company.industry}
                </span>
              </div>

              <h2 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                {company.name}
              </h2>
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

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.form
              onSubmit={handleAddCompany}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-surface border border-white/10 rounded-2xl p-6 space-y-4 z-10"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Add Company</h2>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-text-muted hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <input
                type="text"
                required
                placeholder="Company Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white"
              />
              <input
                type="text"
                placeholder="Industry (e.g. Fintech, Cloud)"
                value={formData.industry}
                onChange={(e) =>
                  setFormData({ ...formData, industry: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white"
              />
              <input
                type="text"
                placeholder="Location (e.g. San Francisco, CA)"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white"
              />
              <input
                type="text"
                placeholder="Website (e.g. stripe.com)"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white"
              />
              <textarea
                placeholder="Short company overview..."
                rows={3}
                value={formData.overview}
                onChange={(e) =>
                  setFormData({ ...formData, overview: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white resize-none"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm text-text-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-background"
                >
                  Save Company
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
