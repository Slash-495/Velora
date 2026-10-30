"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Filter, X, Sparkles } from "lucide-react";
import { KanbanBoard } from "@/components/dashboard/applications/KanbanBoard";
import { ApplicationModal } from "@/components/dashboard/applications/ApplicationModal";
import { JobApplication } from "@/lib/mock-data";
import {
  useUserApplications,
  saveUserApplication,
  deleteUserApplication,
  updateUserApplicationStatus,
} from "@/lib/user-data-store";

export default function ApplicationsPage() {
  const applications = useUserApplications();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  
  // Filter states
  const [filterRole, setFilterRole] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterLocation, setFilterLocation] = useState("");

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // 1. Search (matches role or company)
      const matchesSearch = 
        app.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) || 
        app.companyName.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Filters
      const matchesRole = filterRole ? app.roleTitle.toLowerCase().includes(filterRole.toLowerCase()) : true;
      const matchesCompany = filterCompany ? app.companyName.toLowerCase().includes(filterCompany.toLowerCase()) : true;
      const matchesLocation = filterLocation ? (app.location?.toLowerCase().includes(filterLocation.toLowerCase()) ?? false) : true;

      return matchesSearch && matchesRole && matchesCompany && matchesLocation;
    });
  }, [applications, searchQuery, filterRole, filterCompany, filterLocation]);

  const handleUpdateApplication = async (id: string, updates: Partial<JobApplication>) => {
    setActionError(null);
    try {
      if (updates.status && Object.keys(updates).length === 1) {
        await updateUserApplicationStatus(id, updates.status);
        return;
      }
      const existing = applications.find(a => a.id === id);
      if (existing) {
        await saveUserApplication({ ...existing, ...updates, isDemo: false });
      }
    } catch (err: any) {
      setActionError(err.message || "Failed to update application.");
    }
  };

  const handleDeleteApplication = async (id: string) => {
    setActionError(null);
    try {
      await deleteUserApplication(id);
    } catch (err: any) {
      setActionError(err.message || "Failed to delete application.");
    }
  };

  const handleSaveApplication = async (appToSave: JobApplication) => {
    setActionError(null);
    try {
      await saveUserApplication({ ...appToSave, isDemo: false });
      setIsModalOpen(false);
      setEditingApp(null);
    } catch (err: any) {
      setActionError(err.message || "Failed to save application.");
    }
  };

  const openAddModal = () => {
    setEditingApp(null);
    setIsModalOpen(true);
  };

  const openEditModal = (app: JobApplication) => {
    setEditingApp(app);
    setIsModalOpen(true);
  };

  const resetFilters = () => {
    setFilterRole("");
    setFilterCompany("");
    setFilterLocation("");
  };

  const hasActiveFilters = filterRole || filterCompany || filterLocation;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight">Applications</h1>
          <p className="text-text-muted mt-1">Track and manage your job applications across hiring stages.</p>
        </div>

        <button
          onClick={openAddModal}
          className="btn-glow shrink-0 px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 font-medium cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Log Application
        </button>
      </motion.div>

      {/* Toolbar: Search & Filter Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by company or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
            hasActiveFilters || isFilterOpen
              ? "bg-primary/10 border-primary/30 text-primary"
              : "bg-surface border-white/10 text-text-secondary hover:text-text-primary hover:bg-white/5"
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          )}
        </button>
      </div>

      {/* Filter Panel (Collapsible) */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-surface border border-white/10 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Filter by Role</label>
                <input
                  type="text"
                  placeholder="e.g. Engineer, Analyst..."
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Filter by Company</label>
                <input
                  type="text"
                  placeholder="e.g. Google, Stripe..."
                  value={filterCompany}
                  onChange={(e) => setFilterCompany(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Filter by Location</label>
                <input
                  type="text"
                  placeholder="e.g. Remote, San Francisco..."
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>

              {hasActiveFilters && (
                <div className="sm:col-span-3 flex justify-end">
                  <button
                    onClick={resetFilters}
                    className="text-xs text-text-muted hover:text-primary transition-colors underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(actionError || applications.error) && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400">
          {actionError || applications.error}
        </div>
      )}

      {/* Kanban Board View */}
      <div className="pt-2">
        <KanbanBoard
          applications={filteredApplications}
          onUpdateApplication={handleUpdateApplication}
          onEdit={openEditModal}
          onDelete={handleDeleteApplication}
        />
      </div>

      {/* Create / Edit Modal */}
      <ApplicationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingApp(null);
        }}
        onSave={handleSaveApplication}
        initialData={editingApp}
      />
    </div>
  );
}
