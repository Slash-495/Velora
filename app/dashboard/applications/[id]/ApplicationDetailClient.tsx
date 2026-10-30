"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Calendar, 
  ExternalLink,
  ChevronLeft,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { JobApplication } from "@/lib/mock-data";
import { useUserApplications, useUserResumes } from "@/lib/user-data-store";
import { CompanyInterviewWorkspace } from "@/components/applications/CompanyInterviewWorkspace";

type TabType = 'details' | 'timeline' | 'interview';

export function ApplicationDetailClient({
  applicationId,
  application: initialApplication,
}: {
  applicationId?: string;
  application?: JobApplication;
}) {
  const applications = useUserApplications();
  const resumes = useUserResumes();
  const application =
    initialApplication ||
    applications.find((a) => a.id === applicationId) ||
    applications[0];
  const linkedResume = resumes.find((r) => r.id === application?.resumeId);
  const [activeTab, setActiveTab] = useState<TabType>('details');

  if (!application) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center text-text-muted">
        Application not found.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6 mb-8"
      >
        <Link 
          href="/dashboard/applications" 
          className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-white transition-colors w-fit"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Board
        </Link>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 bg-surface/80 border border-white/5 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-white/5 shadow-inner shrink-0">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">{application.roleTitle}</h1>
              <p className="text-lg text-text-muted mt-1">{application.companyName}</p>
              
              <div className="flex flex-wrap items-center gap-4 mt-4">
                {application.location && (
                  <div className="flex items-center gap-1.5 text-sm text-text-muted">
                    <MapPin className="w-4 h-4" />
                    {application.location}
                  </div>
                )}
                {application.salaryRange && (
                  <div className="flex items-center gap-1.5 text-sm text-text-muted">
                    <DollarSign className="w-4 h-4" />
                    {application.salaryRange}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-sm text-text-muted">
                  <Calendar className="w-4 h-4" />
                  Applied on {new Date(application.applicationDate || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 shrink-0 items-end">
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-text-primary capitalize flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              {application.status.replace('_', ' ')}
            </div>
            
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-white/10 hover:bg-white/5 transition-colors">
              <ExternalLink className="w-4 h-4" />
              View Posting
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="flex gap-4 border-b border-white/10 mb-6">
            <button 
              onClick={() => setActiveTab('details')}
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'details' ? 'border-primary text-text-primary' : 'border-transparent text-text-muted hover:text-white'}`}
            >
              Job Description
            </button>
            <button 
              onClick={() => setActiveTab('timeline')}
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'timeline' ? 'border-primary text-text-primary' : 'border-transparent text-text-muted hover:text-white'}`}
            >
              Activity Timeline
            </button>
            <button 
              onClick={() => setActiveTab('interview')}
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'interview' ? 'border-primary text-text-primary' : 'border-transparent text-text-muted hover:text-white'}`}
            >
              Interview Prep
            </button>
          </div>

          {activeTab === 'details' ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-surface border border-white/5 rounded-2xl p-6"
            >
              <h3 className="text-lg font-bold text-text-primary mb-4">About the Role</h3>
              <div className="prose prose-invert max-w-none text-text-muted text-sm leading-relaxed space-y-4">
                <p>We are looking for a highly skilled Software Engineer to join our core product team. You will be responsible for designing and building scalable systems that power our global infrastructure.</p>
                <h4 className="font-semibold text-text-primary mt-6 mb-2">Requirements:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>5+ years of experience in backend development</li>
                  <li>Deep knowledge of Node.js, TypeScript, and modern JS ecosystems</li>
                  <li>Experience with scalable cloud architectures (AWS/GCP)</li>
                  <li>Strong understanding of database design (SQL and NoSQL)</li>
                </ul>
              </div>
            </motion.div>
          ) : activeTab === 'timeline' ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {[
                { type: 'interview', title: 'Technical Interview Scheduled', date: 'Today, 2:00 PM', icon: <Clock className="w-5 h-5 text-orange-400" /> },
                { type: 'status', title: 'Moved to Interview stage', date: '2 days ago', icon: <CheckCircle2 className="w-5 h-5 text-green-400" /> },
                { type: 'oa', title: 'Online Assessment Completed', date: '1 week ago', icon: <CheckCircle2 className="w-5 h-5 text-green-400" /> },
                { type: 'applied', title: 'Application Submitted', date: 'May 10, 2024', icon: <FileText className="w-5 h-5 text-blue-400" /> },
              ].map((event, i) => (
                <div key={i} className="flex gap-4 relative">
                  {i !== 3 && <div className="absolute left-6 top-10 bottom-[-24px] w-px bg-white/10"></div>}
                  <div className="w-12 h-12 rounded-full bg-surface border border-white/10 flex items-center justify-center shrink-0 z-10">
                    {event.icon}
                  </div>
                  <div className="pt-3">
                    <h4 className="font-semibold text-text-primary">{event.title}</h4>
                    <p className="text-sm text-text-muted mt-0.5">{event.date}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : activeTab === 'interview' ? (
            <CompanyInterviewWorkspace company={application} />
          ) : null}

        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          
          {/* Resume Linked Widget */}
          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl p-5">
            <h3 className="font-bold text-text-primary flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-primary" />
              Resume Used
            </h3>
            
            {linkedResume ? (
              <div className="bg-surface/80 border border-white/10 rounded-xl p-4 flex flex-col gap-3 group hover:border-primary/50 transition-colors cursor-pointer">
                <div>
                  <h4 className="font-semibold text-text-primary text-sm line-clamp-1">{linkedResume.name}</h4>
                  <p className="text-xs text-text-muted mt-1">Last updated {new Date(linkedResume.updatedAt).toLocaleDateString()}</p>
                </div>
                {linkedResume.atsScore !== undefined && (
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <span className="text-xs font-medium text-text-muted">ATS Score</span>
                    <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-md">{linkedResume.atsScore}/100</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-white/10 rounded-xl">
                <AlertCircle className="w-6 h-6 text-text-muted mb-2" />
                <p className="text-sm font-medium text-text-muted">No resume linked</p>
                <button className="mt-3 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                  Link Resume
                </button>
              </div>
            )}
          </div>

          {/* Next Steps / Deadlines */}
          <div className="bg-surface border border-white/5 rounded-2xl p-5">
            <h3 className="font-bold text-text-primary mb-4">Next Steps</h3>
            {application.deadline ? (
              <div className="flex items-start gap-3 bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                <Calendar className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-orange-400 text-sm">Action Required</h4>
                  <p className="text-xs text-orange-400/80 mt-1">Due by {new Date(application.deadline).toLocaleDateString()}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-muted">No pending actions or deadlines.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
