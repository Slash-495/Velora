"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { 
  LineChart, 
  Target, 
  Wand2, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  Lightbulb,
  MapPin,
  RefreshCw,
  TrendingUp,
  BrainCircuit,
  Search
} from "lucide-react";
import { mockResumes } from "@/lib/mock-data"; // We'll just use one of these for the review payload

interface ReviewData {
  scores: {
    overall: number;
    ats: number;
    recruiter: number;
    technical: number;
    readability: number;
  };
  careerInsights: string;
  sectionAnalysis: {
    section: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  }[];
  skillGaps: {
    skill: string;
    context: string;
  }[];
  roadmap: {
    thisWeek: string[];
    thisMonth: string[];
    nextQuarter: string[];
  };
}

export default function ResumeReviewPage() {
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [selectedResumeId, setSelectedResumeId] = useState(mockResumes[0].id);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [review, setReview] = useState<ReviewData | null>(null);

  const runReview = async () => {
    setIsAnalyzing(true);
    setReview(null);
    try {
      const selected = mockResumes.find(r => r.id === selectedResumeId);
      const res = await fetch("/api/ai/review-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          resumeContent: selected?.content, 
          targetRole 
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to analyze resume.");
      }

      const data = await res.json();
      setReview(data);
    } catch (error: any) {
      console.error(error);
      alert(`Failed to run review: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const ScoreCard = ({ label, score, icon: Icon, colorClass }: { label: string, score: number, icon: any, colorClass: string }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-surface border border-white/5 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group`}
    >
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${colorClass}`} />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <span className="text-sm font-semibold text-text-muted uppercase tracking-wider">{label}</span>
        <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
      <div className="flex items-end gap-2 relative z-10">
        <span className="text-4xl font-bold text-white tracking-tighter">{score}</span>
        <span className="text-sm text-text-muted font-medium mb-1.5">/ 100</span>
      </div>
      {/* Mini Progress Bar */}
      <div className="w-full h-1.5 bg-white/5 rounded-full mt-4 overflow-hidden relative z-10">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${colorClass}`}
        />
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-12">
      
      {/* Header & Config */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 bg-surface/50 p-6 rounded-3xl border border-white/5">
        <div className="space-y-4 flex-1 max-w-xl">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 mb-1">
              <BrainCircuit className="w-6 h-6 text-primary" />
              AI Career Coach
            </h1>
            <p className="text-sm text-text-muted">Get brutal, recruiter-level feedback on your resume.</p>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Target Role</label>
              <input 
                type="text" 
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="e.g. Senior Product Designer"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Select Resume</label>
              <select 
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
              >
                {mockResumes.map(r => (
                  <option key={r.id} value={r.id} className="bg-background text-text-primary">{r.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button 
          onClick={runReview}
          disabled={isAnalyzing}
          className="btn-glow px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all shrink-0 w-full md:w-auto"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Auditing Resume...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              Run AI Review
            </>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isAnalyzing && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">Simulating Recruiter Screening...</h3>
            <p className="text-text-muted text-sm max-w-md">Our AI is parsing your bullet points, checking ATS keywords, and evaluating technical depth. This usually takes 10-15 seconds.</p>
          </motion.div>
        )}

        {review && !isAnalyzing && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            {/* Coach Insights */}
            <div className="bg-gradient-to-br from-primary/10 via-surface to-surface border border-primary/20 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
              <div className="relative z-10 flex gap-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Coach's Verdict</h3>
                  <p className="text-text-secondary leading-relaxed max-w-4xl text-sm md:text-base">
                    {review.careerInsights}
                  </p>
                </div>
              </div>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <ScoreCard label="Overall" score={review.scores.overall} icon={Award} colorClass="bg-purple-500" />
              <ScoreCard label="ATS Match" score={review.scores.ats} icon={Search} colorClass="bg-blue-500" />
              <ScoreCard label="Recruiter" score={review.scores.recruiter} icon={Target} colorClass="bg-emerald-500" />
              <ScoreCard label="Technical" score={review.scores.technical} icon={BrainCircuit} colorClass="bg-orange-500" />
              <ScoreCard label="Readability" score={review.scores.readability} icon={LineChart} colorClass="bg-pink-500" />
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Section Analysis */}
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Section Breakdown
                </h2>
                <div className="space-y-4">
                  {review.sectionAnalysis.map((section, idx) => (
                    <div key={idx} className="bg-surface border border-white/5 rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-white mb-4 pb-4 border-b border-white/5">{section.section}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="flex items-center gap-2 text-emerald-400 mb-3 text-sm font-semibold uppercase tracking-wider">
                            <CheckCircle2 className="w-4 h-4" /> Strengths
                          </div>
                          <ul className="space-y-2">
                            {section.strengths.map((s, i) => (
                              <li key={i} className="text-sm text-text-secondary flex gap-2">
                                <span className="text-emerald-500/50 mt-0.5">•</span> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-red-400 mb-3 text-sm font-semibold uppercase tracking-wider">
                            <AlertTriangle className="w-4 h-4" /> Weaknesses
                          </div>
                          <ul className="space-y-2">
                            {section.weaknesses.map((w, i) => (
                              <li key={i} className="text-sm text-text-secondary flex gap-2">
                                <span className="text-red-500/50 mt-0.5">•</span> {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      {section.recommendations.length > 0 && (
                        <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-xl">
                          <div className="flex items-center gap-2 text-primary mb-2 text-xs font-semibold uppercase tracking-wider">
                            <ArrowRight className="w-3.5 h-3.5" /> Recommendations
                          </div>
                          <ul className="space-y-1.5">
                            {section.recommendations.map((r, i) => (
                              <li key={i} className="text-sm text-white/90">• {r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar: Skills & Roadmap */}
              <div className="space-y-8">
                
                {/* Skill Gaps */}
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 mb-6">
                    <Target className="w-5 h-5 text-orange-400" />
                    Skill Gaps
                  </h2>
                  <div className="space-y-3">
                    {review.skillGaps.map((gap, i) => (
                      <div key={i} className="bg-surface border border-white/5 rounded-xl p-4">
                        <div className="text-sm font-bold text-white mb-1">{gap.skill}</div>
                        <div className="text-xs text-text-muted">{gap.context}</div>
                      </div>
                    ))}
                    {review.skillGaps.length === 0 && (
                      <div className="text-sm text-text-muted italic p-4 text-center border border-dashed border-white/10 rounded-xl">
                        No critical skill gaps found for this role!
                      </div>
                    )}
                  </div>
                </div>

                {/* Roadmap */}
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 mb-6">
                    <MapPin className="w-5 h-5 text-primary" />
                    Improvement Roadmap
                  </h2>
                  
                  <div className="relative border-l-2 border-white/10 ml-3 space-y-6 pb-4">
                    <div className="relative pl-6">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">This Week</h4>
                      <ul className="space-y-2">
                        {review.roadmap.thisWeek.map((r, i) => (
                          <li key={i} className="text-sm text-text-secondary">{r}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="relative pl-6">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-orange-400 ring-4 ring-orange-400/20" />
                      <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">This Month</h4>
                      <ul className="space-y-2">
                        {review.roadmap.thisMonth.map((r, i) => (
                          <li key={i} className="text-sm text-text-secondary">{r}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="relative pl-6">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-primary ring-4 ring-primary/20" />
                      <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Next Quarter</h4>
                      <ul className="space-y-2">
                        {review.roadmap.nextQuarter.map((r, i) => (
                          <li key={i} className="text-sm text-text-secondary">{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
