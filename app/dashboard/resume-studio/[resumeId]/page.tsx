"use client";

import { AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { mockResumes, Resume, ResumeContent } from "@/lib/mock-data";
import { getResume, isValidUuid, VersionConflictError } from "@/lib/data";
import { saveUserResume, useUserResumes } from "@/lib/user-data-store";
import { useDebounce } from "@/hooks/use-debounce";
import { EditorSidebar } from "@/components/resume-studio/EditorSidebar";
import { LivePreview } from "@/components/resume-studio/LivePreview";
import { LatexEditor } from "@/components/resume-studio/LatexEditor";
import { EditorTopbar } from "@/components/resume-studio/EditorTopbar";
import { ExportModal } from "@/components/resume-studio/ExportModal";
import { ShareModal } from "@/components/resume-studio/ShareModal";
import { VersionHistoryPanel } from "@/components/resume-studio/VersionHistoryPanel";
import { generateDefaultLatex, parseLatexToJSON } from "@/lib/latex-templates";
import { defaultThemeConfig, ResumeThemeConfig } from "@/lib/templates";

type EditorMode = "VISUAL" | "LATEX";

export default function ResumeEditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const resumeId = params.resumeId as string;
  const queryTemplateId = searchParams.get("template");

  const storeResumes = useUserResumes();

  const [loadedResume, setLoadedResume] = useState<Resume | null>(null);
  const [isLoadingResume, setIsLoadingResume] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [conflictResume, setConflictResume] = useState<Resume | null>(null);

  const [editorMode, setEditorMode] = useState<EditorMode>("VISUAL");
  const [showExport, setShowExport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [content, setContent] = useState<ResumeContent>(mockResumes[0].content);
  const [themeConfig, setThemeConfig] = useState<ResumeThemeConfig>(defaultThemeConfig);
  const [templateId, setTemplateId] = useState<string>(queryTemplateId || "velora-professional");

  // Track last-saved snapshot so initial load doesn't trigger a redundant save
  const lastSavedSnapshotRef = useRef<string>("");
  const currentVersionRef = useRef<number>(1);

  const applyResumeState = useCallback(
    (res: Resume, overrideTemplate?: string | null) => {
      const nextTemplate = overrideTemplate || res.template || "velora-professional";
      const nextTheme = res.themeConfig || defaultThemeConfig;
      setLoadedResume(res);
      setContent(res.content);
      setThemeConfig(nextTheme);
      setTemplateId(nextTemplate);
      const ver = res.version ?? 1;
      setCurrentVersion(ver);
      currentVersionRef.current = ver;
      setLastSaved(res.updatedAt ? new Date(res.updatedAt) : new Date());
      lastSavedSnapshotRef.current = JSON.stringify({
        content: res.content,
        themeConfig: nextTheme,
        templateId: nextTemplate,
      });
    },
    []
  );

  // Load resume from Supabase (or demo store fallback)
  useEffect(() => {
    let cancelled = false;

    async function fetchInitialResume() {
      setIsLoadingResume(true);
      setLoadError(null);
      try {
        if (isValidUuid(resumeId)) {
          const remote = await getResume(resumeId);
          if (!cancelled && remote) {
            applyResumeState(remote, queryTemplateId);
            setIsLoadingResume(false);
            return;
          }
        }

        const cached =
          storeResumes.find((r) => r.id === resumeId) ||
          mockResumes.find((r) => r.id === resumeId);

        if (!cancelled) {
          if (cached) {
            applyResumeState(cached, queryTemplateId);
          } else {
            setLoadError("Resume not found.");
          }
          setIsLoadingResume(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setLoadError(err.message || "Failed to load resume.");
          setIsLoadingResume(false);
        }
      }
    }

    fetchInitialResume();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId]);

  const handleLatexCompile = useCallback(
    (compiledLatex: string) => {
      const updatedContent = parseLatexToJSON(compiledLatex, content);
      setContent(updatedContent);
    },
    [content]
  );

  const debouncedSavePayload = useDebounce(
    { content, themeConfig, templateId },
    1000
  );

  const persistChanges = useCallback(
    async (payload: {
      content: ResumeContent;
      themeConfig: ResumeThemeConfig;
      templateId: string;
    }) => {
      if (!loadedResume || conflictResume) return;

      const snapshot = JSON.stringify(payload);
      if (snapshot === lastSavedSnapshotRef.current) return;

      setIsSaving(true);
      setSaveError(null);

      try {
        const updatedResume = await saveUserResume(
          {
            ...loadedResume,
            content: payload.content,
            themeConfig: payload.themeConfig,
            template: payload.templateId,
            version: currentVersionRef.current,
          },
          currentVersionRef.current
        );

        lastSavedSnapshotRef.current = snapshot;
        const nextVer = updatedResume.version ?? currentVersionRef.current + 1;
        currentVersionRef.current = nextVer;
        setCurrentVersion(nextVer);
        setLoadedResume(updatedResume);
        setLastSaved(new Date());
      } catch (err: any) {
        if (err instanceof VersionConflictError || err?.code === "VERSION_CONFLICT") {
          setConflictResume(err.serverResume || null);
        } else {
          setSaveError(err.message || "Failed to autosave changes.");
        }
      } finally {
        setIsSaving(false);
      }
    },
    [loadedResume, conflictResume]
  );

  // Debounced Autosave with optimistic concurrency
  useEffect(() => {
    if (isLoadingResume || !loadedResume || conflictResume) return;
    persistChanges(debouncedSavePayload);
  }, [debouncedSavePayload, isLoadingResume, loadedResume, conflictResume, persistChanges]);

  const handleReloadConflict = useCallback(async () => {
    setConflictResume(null);
    setSaveError(null);
    if (conflictResume) {
      applyResumeState(conflictResume);
      return;
    }
    try {
      const latest = await getResume(resumeId);
      if (latest) {
        applyResumeState(latest);
      }
    } catch (err: any) {
      setSaveError(err.message || "Failed to reload latest version.");
    }
  }, [conflictResume, resumeId, applyResumeState]);

  const handleDownloadPDF = useCallback(async () => {
    setIsSaving(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const element = document.querySelector(
        ".resume-print-document"
      ) as HTMLElement | null;

      if (element) {
        const opt = {
          margin: 0,
          filename: `${loadedResume?.name || "resume"}.pdf`,
          image: { type: "jpeg" as const, quality: 1 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
        };

        await html2pdf().set(opt).from(element).save();
      }
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    }

    setIsSaving(false);
  }, [loadedResume?.name]);

  if (isLoadingResume) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-6rem)] gap-3 text-text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading resume...</p>
      </div>
    );
  }

  if (loadError || !loadedResume) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-6rem)] gap-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center max-w-md">
          <h2 className="text-lg font-bold text-red-400 mb-1">Unable to Open Resume</h2>
          <p className="text-sm text-text-muted">{loadError || "Resume not found."}</p>
          <Link
            href="/dashboard/resume-studio"
            className="inline-block mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-semibold text-white transition-colors"
          >
            Back to Resume Studio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden">
      <EditorTopbar
        resumeName={loadedResume.name || "Untitled Resume"}
        isSaving={isSaving}
        lastSaved={lastSaved}
        editorMode={editorMode}
        onModeChange={setEditorMode}
        onSave={() =>
          persistChanges({ content, themeConfig, templateId })
        }
        onOpenExport={() => setShowExport(true)}
        onOpenShare={() => setShowShare(true)}
        onOpenHistory={() => setShowHistory(true)}
      />

      {/* Optimistic Concurrency Conflict Prompt */}
      {conflictResume !== null && (
        <div className="mb-3 px-4 py-3 rounded-xl bg-amber-500/15 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-300 shrink-0">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              This resume was changed elsewhere (version conflict). Reload the latest version to avoid overwriting?
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleReloadConflict}
              className="px-3 py-1.5 rounded-lg bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 hover:bg-amber-300 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reload Latest
            </button>
          </div>
        </div>
      )}

      {saveError && !conflictResume && (
        <div className="mb-3 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 shrink-0">
          Autosave error: {saveError}
        </div>
      )}

      {/* Split Screen Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 pb-4">
        {/* Left Side: Editor Form / Code */}
        <div className="lg:w-1/2 w-full h-full flex flex-col min-h-0 pt-2 lg:pt-0">
          {editorMode === "VISUAL" ? (
            <EditorSidebar
              content={content}
              onChange={setContent}
              themeConfig={themeConfig}
              onChangeTheme={setThemeConfig}
              templateId={templateId}
              onChangeTemplate={setTemplateId}
            />
          ) : (
            <div className="h-full">
              <LatexEditor
                initialLatex={generateDefaultLatex(content, templateId)}
                onCompile={handleLatexCompile}
              />
            </div>
          )}
        </div>

        {/* Right Side: Live Preview */}
        <div className="lg:w-1/2 w-full h-full min-h-0 hidden md:block">
          <LivePreview
            content={content}
            templateId={templateId}
            themeConfig={themeConfig}
          />
        </div>
      </div>

      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        onExportPDF={handleDownloadPDF}
        content={content}
        templateId={templateId}
      />
      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        resumeId={resumeId}
      />
      <VersionHistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        resumeId={resumeId}
      />
    </div>
  );
}
