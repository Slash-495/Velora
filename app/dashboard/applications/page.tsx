"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Filter, X } from "lucide-react";
import { KanbanBoard } from "@/components/dashboard/applications/KanbanBoard";
import { ApplicationModal } from "@/components/dashboard/applications/ApplicationModal";
import { JobApplication, mockApplications } from "@/lib/mock-data";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<JobApplication[]>(mockApplications);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
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

  const handleUpdateApplication = (id: string, updates: Partial<JobApplication>) => {
    setApplications(prev => prev.map(app => app.id === id ? { ...app, ...updates } : app));
  };

  const handleDeleteApplication = (id: string) => {
    setApplications(prev => prev.filter(app => app.id !== id));
  };

  const handleSaveApplication = (appToSave: JobApplication) => {
    if (editingApp) {
      handleUpdateApplication(appToSave.id, appToSave);
    } else {
      setApplications(prev => [...prev, appToSave]);
    }
    setIsModalOpen(false);
    setEditingApp(null);
  };

  const openAddModal = () => {
    setEditingApp(null);
    setIsModalOpen(true);
  };

  const openEditModal = (app: JobApplication) => {
    setEditingApp(app);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full max-w-[1600px] mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 shrink-0"
      >
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Job Applications</h1>
          <p className="text-text-muted mt-1 text-sm">Organize and track your career opportunities.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search roles, companies..." 
              className="bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full md:w-64 transition-all"
            />
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-2 border rounded-xl transition-colors flex shrink-0 ${isFilterOpen ? 'bg-primary/20 border-primary text-primary' : 'border-white/10 bg-white/5 text-text-muted hover:text-white hover:bg-white/10'}`}
            >
              <Filter className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {isFilterOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-64 bg-surface border border-white/10 rounded-2xl shadow-xl p-4 z-50 flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-text-primary">Filters</h3>
                    <button 
                      onClick={() => { setFilterRole(""); setFilterCompany(""); setFilterLocation(""); }}
                      className="text-xs text-primary hover:text-primary/80 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-muted">Role</label>
                      <input 
                        type="text" 
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        placeholder="e.g. Engineer" 
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-primary transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-muted">Company</label>
                      <input 
                        type="text" 
                        value={filterCompany}
                        onChange={(e) => setFilterCompany(e.target.value)}
                        placeholder="e.g. Google" 
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-primary transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-muted">Location</label>
                      <input 
                        type="text" 
                        value={filterLocation}
                        onChange={(e) => setFilterLocation(e.target.value)}
                        placeholder="e.g. Remote" 
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 shadow-glow-primary active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Application
          </button>
        </div>
      </motion.div>

      <div className="flex-1 overflow-hidden relative">
        {/* Fading edges for the scrollable area */}
        <div className="absolute top-0 bottom-0 left-0 w-4 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
        <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>
        
        <KanbanBoard 
          applications={filteredApplications} 
          onUpdateApplication={handleUpdateApplication}
          onEdit={openEditModal}
          onDelete={handleDeleteApplication}
        />
      </div>

      <ApplicationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveApplication}
        initialData={editingApp}
      />
    </div>
  );
}
