"use client";

import { useState } from "react";
import { Search, Sparkles, Plus, Check, Loader2 } from "lucide-react";
import { createApplication } from "@/lib/data/applications";
import { refreshAllUserData, useUserResumes } from "@/lib/user-data-store";
import type { JobSearchHit, JobSearchMode } from "@/lib/job-search";

export function JobSearchPanel() {
  const resumes = useUserResumes();
  const [query, setQuery] = useState("");
  const [resumeId, setResumeId] = useState("");
  const [mode, setMode] = useState<JobSearchMode>("hybrid");
  const [excludeTracked, setExcludeTracked] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<JobSearchHit[]>([]);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [addingId, setAddingId] = useState<string | null>(null);

  const realResumes = resumes.filter((r) => !r.isDemo);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() && !resumeId) {
      setError("Enter skills/keywords or select a resume to find matching jobs.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim() || undefined,
          resumeId: resumeId || undefined,
          mode,
          k: 10,
          excludeTracked,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || `Search failed (${res.status})`);
      }

      setResults(json?.data?.results || []);
    } catch (err: any) {
      setError(err?.message || "Failed to search jobs.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToTracker = async (job: JobSearchHit) => {
    setAddingId(job.id);
    setError(null);
    try {
      await createApplication({
        companyName: job.company || "Unknown Company",
        roleTitle: job.title,
        status: "wishlist",
        location: job.location || undefined,
        jobDescription: job.description.slice(0, 4000),
        notes: `Added from Job Search (${job.category}) [source_id:${job.source_id}]`,
      });
      setAddedIds((prev) => ({ ...prev, [job.id]: true }));
      await refreshAllUserData();
    } catch (err: any) {
      setError(err?.message || "Failed to add job to tracker.");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <section className="bg-surface border border-white/10 rounded-2xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-text-primary">
            Find matching jobs
          </h2>
        </div>
        <span className="text-xs text-text-muted">
          Hybrid semantic + keyword search
        </span>
      </div>

      <form onSubmit={handleSearch} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="relative md:col-span-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              maxLength={2000}
              placeholder="Skills, role, or paste a profile summary..."
              className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <select
            value={resumeId}
            onChange={(e) => setResumeId(e.target.value)}
            aria-label="Match using resume"
            className="md:col-span-3 bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value="">No resume selected</option>
            {realResumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as JobSearchMode)}
            aria-label="Search mode"
            className="md:col-span-1 bg-black/20 border border-white/10 rounded-xl px-2 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value="hybrid">Hybrid</option>
            <option value="semantic">Semantic</option>
            <option value="keyword">Keyword</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="md:col-span-2 btn-glow px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Search
          </button>
        </div>

        <label className="inline-flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={excludeTracked}
            onChange={(e) => setExcludeTracked(e.target.checked)}
            className="rounded border-white/20 bg-black/20"
          />
          Exclude jobs already in my tracker
        </label>
      </form>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {results.map((job) => {
            const added = Boolean(addedIds[job.id]);
            const adding = addingId === job.id;
            return (
              <div
                key={job.id}
                className="p-3.5 rounded-xl bg-black/20 border border-white/10 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-text-primary">
                      {job.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[11px] bg-primary/15 text-primary border border-primary/20">
                      {job.category}
                    </span>
                    <span className="text-[11px] text-text-muted font-mono">
                      score {job.score.toFixed(4)}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">
                    {job.company || "Company"}
                    {job.location ? ` · ${job.location}` : ""}
                  </p>
                  <p className="text-xs text-text-muted line-clamp-2">
                    {job.description}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={added || adding}
                  onClick={() => handleAddToTracker(job)}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-text-primary flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {added ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Added
                    </>
                  ) : adding ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      Add to tracker
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
