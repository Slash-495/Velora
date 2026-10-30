"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Globe,
  MapPin,
  ExternalLink,
  Bot,
  CheckSquare,
  FileText,
  Lightbulb,
  ShieldAlert,
  Zap,
  Loader2,
  Save,
  AlignLeft,
  RefreshCw,
} from "lucide-react";
import { mockCompanies } from "@/lib/mock-data";
import { isValidUuid } from "@/lib/data";
import { useUserApplications, useUserResumes } from "@/lib/user-data-store";
import { createClient } from "@/utils/supabase/client";
import { useDebounce } from "@/hooks/use-debounce";

export function CompanyDetailClient({
  companyId,
  company: initialCompany,
}: {
  companyId?: string;
  company?: any;
}) {
  const applications = useUserApplications();
  const resumes = useUserResumes();

  const [company, setCompany] = useState<any>(
    initialCompany ||
      mockCompanies.find((c) => c.id === companyId) ||
      mockCompanies[0]
  );
  const [notes, setNotes] = useState("");
  const [noteId, setNoteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // AI Insights State
  const [insights, setInsights] = useState<any>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  useEffect(() => {
    if (!companyId || !isValidUuid(companyId)) return;
    let cancelled = false;

    async function loadCompanyFromSupabase() {
      try {
        const supabase = createClient();
        const { data: compRow } = await supabase
          .from("companies")
          .select("*")
          .eq("id", companyId)
          .maybeSingle();

        if (!cancelled && compRow) {
          setCompany({
            id: compRow.id,
            name: compRow.name,
            industry: compRow.industry || "Technology",
            location: compRow.location || "Remote",
            overview: compRow.overview || "",
            website: compRow.website || "",
            careersUrl: compRow.careers_url || compRow.website || "",
          });
        }

        const { data: noteRow } = await supabase
          .from("company_notes")
          .select("id, content")
          .eq("company_id", companyId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!cancelled && noteRow) {
          setNoteId(noteRow.id);
          setNotes(noteRow.content || "");
        }
      } catch {
        // Ignore in logged-out demo mode
      }
    }

    loadCompanyFromSupabase();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const relatedApps = useMemo(
    () =>
      applications.filter(
        (a) => a.companyName.toLowerCase() === (company?.name || "").toLowerCase()
      ),
    [applications, company?.name]
  );

  const debouncedNotes = useDebounce(notes, 1000);

  const persistNotes = useCallback(
    async (text: string) => {
      setIsSaving(true);
      try {
        if (company?.id && isValidUuid(company.id)) {
          const supabase = createClient();
          if (noteId) {
            await supabase
              .from("company_notes")
              .update({ content: text })
              .eq("id", noteId);
          } else {
            const { data } = await supabase
              .from("company_notes")
              .insert({
                company_id: company.id,
                type: "research",
                content: text,
              })
              .select("id")
              .single();
            if (data?.id) setNoteId(data.id);
          }
        }
      } catch {
        // Fallback in demo mode
      } finally {
        setIsSaving(false);
      }
    },
    [company?.id, noteId]
  );

  useEffect(() => {
    if (debouncedNotes) {
      persistNotes(debouncedNotes);
    }
  }, [debouncedNotes, persistNotes]);

  const generateInsights = useCallback(async () => {
    if (!company) return;
    setIsGeneratingInsights(true);
    try {
      const res = await fetch("/api/ai/company-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: company.name,
          industry: company.industry,
          notes,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error?.message || "Failed to generate insights.");
      }
      setInsights(payload.data || payload);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingInsights(false);
    }
  }, [company, notes]);

  if (!company) {
    return <div className="text-white p-8">Company not found.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto pb-24">
      {/* Header Profile */}
      <div className="bg-surface border border-white/5 rounded-3xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="flex flex-col md:flex-row gap-6 relative z-10">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-primary/20 shrink-0">
            <span className="text-primary font-bold text-4xl">
              {company.name.charAt(0)}
            </span>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                {company.name}
              </h1>
              <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-medium text-text-muted border border-white/10">
                {company.industry}
              </span>
            </div>

            <p className="text-text-secondary text-sm leading-relaxed max-w-3xl mb-4">
              {company.overview}
            </p>

            <div className="flex flex-wrap gap-4 text-xs font-medium">
              {company.website && (
                <a
                  href={`https://${company.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-text-muted hover:text-white transition-colors"
                >
                  <Globe className="w-4 h-4" /> {company.website}
                </a>
              )}
              {company.careersUrl && (
                <a
                  href={`https://${company.careersUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Careers Page
                </a>
              )}
              <div className="flex items-center gap-1.5 text-text-muted">
                <MapPin className="w-4 h-4" /> {company.location}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Intelligence & Ecosystem */}
        <div className="space-y-8">
          {/* Application Ecosystem */}
          <section className="bg-surface border border-white/5 rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-primary" />
              Application Ecosystem
            </h2>

            {relatedApps.length > 0 ? (
              <div className="space-y-3">
                {relatedApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 bg-white/5 border border-white/10 rounded-xl"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold text-sm text-white">
                        {app.roleTitle}
                      </div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                        {app.status}
                      </span>
                    </div>
                    <div className="text-xs text-text-muted flex items-center gap-2 mt-3">
                      <FileText className="w-3.5 h-3.5" />
                      Linked Resume:{" "}
                      {resumes.find((r) => r.id === app.resumeId)?.name ||
                        "Default Resume"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-text-muted p-4 border border-dashed border-white/10 rounded-xl text-center">
                No active applications tracked for {company.name}.
              </div>
            )}
          </section>

          {/* AI Insights Panel */}
          <section className="bg-gradient-to-br from-surface to-background border border-primary/20 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Bot className="w-24 h-24" />
            </div>

            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 relative z-10">
              <Zap className="w-5 h-5 text-primary" />
              AI Prep Insights
            </h2>

            {!insights ? (
              <div className="relative z-10">
                <p className="text-sm text-text-secondary mb-6">
                  Generate deep recruiter-level insights on {company.name}&apos;s
                  technical expectations, cultural focus, and interview red flags.
                </p>
                <button
                  onClick={generateInsights}
                  disabled={isGeneratingInsights}
                  className="w-full py-2.5 bg-primary text-background font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:shadow-glow-primary/20"
                >
                  {isGeneratingInsights ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                  {isGeneratingInsights ? "Analyzing Company..." : "Generate Insights"}
                </button>
              </div>
            ) : (
              <div className="relative z-10 space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlignLeft className="w-3.5 h-3.5" /> Tech Stack Focus
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(insights.techStack || []).map((tech: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-white"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" /> Cultural Values
                  </h3>
                  <ul className="space-y-1.5">
                    {(insights.culturalFocus || []).map(
                      (culture: string, i: number) => (
                        <li
                          key={i}
                          className="text-sm text-text-secondary flex items-start gap-2"
                        >
                          <span className="text-emerald-400 mt-0.5">•</span> {culture}
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> Interview Red Flags
                  </h3>
                  <ul className="space-y-1.5">
                    {(insights.redFlags || []).map((flag: string, i: number) => (
                      <li
                        key={i}
                        className="text-sm text-text-secondary flex items-start gap-2"
                      >
                        <span className="text-orange-400 mt-0.5">•</span> {flag}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={generateInsights}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors border border-white/10"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh Insights
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Research Notes Workspace */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-white/5 rounded-3xl p-1 flex flex-col h-[700px]">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <AlignLeft className="w-5 h-5 text-text-muted" />
                Interview Notes
              </h2>
              <button
                onClick={() => persistNotes(notes)}
                className="flex items-center gap-2 px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-colors text-white"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                ) : (
                  <Save className="w-4 h-4 text-text-muted" />
                )}
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={`Start typing your research, questions to ask the interviewer, and behavioral prep for ${company.name}...`}
              className="flex-1 w-full bg-transparent p-6 text-sm text-text-secondary leading-relaxed focus:outline-none resize-none placeholder:text-white/20 custom-scrollbar"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
