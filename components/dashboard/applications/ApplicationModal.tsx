"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Link as LinkIcon, Building2, Briefcase, DollarSign, Calendar, MapPin, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { ApplicationStatus, JobApplication } from "@/lib/mock-data";

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (application: JobApplication) => void;
  initialData?: JobApplication | null;
}

export function ApplicationModal({ isOpen, onClose, onSave, initialData }: ApplicationModalProps) {
  const [formData, setFormData] = useState<Partial<JobApplication>>({
    companyName: "",
    roleTitle: "",
    status: "wishlist",
    location: "",
    salaryRange: "",
    applicationLink: "",
    applicationDate: new Date().toISOString().split('T')[0],
    resumeId: "",
    jobDescription: "",
    salaryCurrency: "$",
    salaryAmount: "",
    salaryUnit: "k",
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Basic parsing for salaryRange
        let curr = "$";
        let unit = "k";
        let amt = "";
        if (initialData.salaryRange) {
          if (initialData.salaryRange.includes("₹")) curr = "₹";
          if (initialData.salaryRange.includes("LPA")) unit = "LPA";
          amt = initialData.salaryRange.replace(/[^0-9.\- ]/g, "").trim();
        }

        setFormData({
          ...initialData,
          applicationDate: initialData.applicationDate ? new Date(initialData.applicationDate).toISOString().split('T')[0] : "",
          salaryCurrency: curr,
          salaryAmount: amt,
          salaryUnit: unit,
        });
      } else {
        setFormData({
          companyName: "",
          roleTitle: "",
          status: "wishlist",
          location: "",
          salaryRange: "",
          applicationLink: "",
          applicationDate: new Date().toISOString().split('T')[0],
          resumeId: "",
          jobDescription: "",
          salaryCurrency: "$",
          salaryAmount: "",
          salaryUnit: "k",
        });
      }
    }
  }, [isOpen, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.companyName || !formData.roleTitle) {
      alert("Company Name and Role Title are required.");
      return;
    }

    const appToSave: JobApplication = {
      id: initialData?.id || `app-${Date.now()}`,
      companyName: formData.companyName!,
      roleTitle: formData.roleTitle!,
      status: (formData.status as ApplicationStatus) || "wishlist",
      location: formData.location,
      salaryRange: formData.salaryAmount ? `${formData.salaryCurrency || '$'}${formData.salaryAmount} ${formData.salaryUnit || 'k'}` : undefined,
      applicationLink: formData.applicationLink,
      applicationDate: formData.applicationDate ? new Date(formData.applicationDate).toISOString() : undefined,
      resumeId: formData.resumeId || undefined,
      jobDescription: formData.jobDescription,
    };

    onSave(appToSave);
  };

  if (!isOpen) return null;

  const isEdit = !!initialData;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-surface border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
            <div>
              <h2 className="text-xl font-bold text-text-primary">{isEdit ? 'Edit Application' : 'Add Application'}</h2>
              <p className="text-sm text-text-muted mt-1">{isEdit ? 'Update details for this job' : 'Track a new job opportunity'}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-text-muted hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-primary">Company Name *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input 
                      type="text" 
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="e.g. Google"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-primary">Role Title *</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input 
                      type="text" 
                      name="roleTitle"
                      value={formData.roleTitle}
                      onChange={handleChange}
                      placeholder="e.g. Frontend Engineer"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-primary">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input 
                      type="text" 
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g. Remote, San Francisco"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-primary">Date Applied</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input 
                      type="date" 
                      name="applicationDate"
                      value={formData.applicationDate}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-primary">Salary Range</label>
                  <div className="relative flex items-center">
                    <select 
                      name="salaryCurrency"
                      value={formData.salaryCurrency}
                      onChange={handleChange}
                      className="absolute left-0 top-0 bottom-0 bg-white/5 border-r border-white/10 rounded-l-xl px-3 text-text-muted focus:outline-none text-sm appearance-none cursor-pointer"
                    >
                      <option value="$" className="bg-surface">$ (USD)</option>
                      <option value="₹" className="bg-surface">₹ (INR)</option>
                    </select>
                    <input 
                      type="text" 
                      name="salaryAmount"
                      value={formData.salaryAmount}
                      onChange={handleChange}
                      placeholder="e.g. 140 - 160"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-[72px] pr-[72px] text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                    <select 
                      name="salaryUnit"
                      value={formData.salaryUnit}
                      onChange={handleChange}
                      className="absolute right-0 top-0 bottom-0 bg-white/5 border-l border-white/10 rounded-r-xl px-3 text-text-muted focus:outline-none text-sm appearance-none cursor-pointer"
                    >
                      <option value="k" className="bg-surface">k / yr</option>
                      <option value="LPA" className="bg-surface">LPA</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-primary">Application Link</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input 
                      type="url" 
                      name="applicationLink"
                      value={formData.applicationLink}
                      onChange={handleChange}
                      placeholder="https://..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-primary">Status</label>
                  <select 
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer"
                  >
                    <option value="wishlist" className="bg-surface">Wishlist</option>
                    <option value="applied" className="bg-surface">Applied</option>
                    <option value="oa" className="bg-surface">Online Assessment</option>
                    <option value="interview" className="bg-surface">Interview</option>
                    <option value="final_round" className="bg-surface">Final Round</option>
                    <option value="offer" className="bg-surface">Offer</option>
                    <option value="rejected" className="bg-surface">Rejected</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-primary">Linked Resume</label>
                  <select 
                    name="resumeId"
                    value={formData.resumeId}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-surface">None</option>
                    <option value="1" className="bg-surface">Backend Engineer - Google Tailored</option>
                    <option value="2" className="bg-surface">Frontend UI/UX</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-primary flex items-center justify-between">
                  Job Description
                  <span className="text-xs font-normal text-primary">Highly recommended for AI features</span>
                </label>
                <textarea 
                  rows={4}
                  name="jobDescription"
                  value={formData.jobDescription}
                  onChange={handleChange}
                  placeholder="Paste the full job description here..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none custom-scrollbar"
                ></textarea>
              </div>

            </div>
          </div>

          <div className="p-6 border-t border-white/10 bg-white/5 flex items-center justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-semibold text-text-primary hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              className="px-5 py-2.5 rounded-xl font-semibold bg-primary text-white hover:bg-primary/90 shadow-glow-primary active:scale-[0.98] transition-all flex items-center gap-2"
            >
              {isEdit ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {isEdit ? 'Save Changes' : 'Save Application'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
