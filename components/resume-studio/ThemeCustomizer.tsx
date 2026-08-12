"use client";

import { ResumeThemeConfig, availableTemplates } from "@/lib/templates";
import { Type, Palette, LayoutTemplate, Columns, Expand, Settings2 } from "lucide-react";

interface ThemeCustomizerProps {
  themeConfig: ResumeThemeConfig;
  onChange: (newTheme: ResumeThemeConfig) => void;
  templateId: string;
  onChangeTemplate: (newTemplateId: string) => void;
}

const fontOptions = [
  { label: "Inter (Modern)", value: "Inter, sans-serif" },
  { label: "Roboto (Clean)", value: "Roboto, sans-serif" },
  { label: "Times New Roman (Classic)", value: "\"Times New Roman\", Times, serif" },
  { label: "Georgia (Elegant)", value: "Georgia, serif" },
  { label: "Fira Code (Dev)", value: "\"Fira Code\", monospace" },
];

const accentColors = [
  { label: "Blue", value: "#3b82f6" },
  { label: "Emerald", value: "#10b981" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Rose", value: "#f43f5e" },
  { label: "Slate", value: "#64748b" },
  { label: "Black", value: "#171717" },
];

export function ThemeCustomizer({ themeConfig, onChange, templateId, onChangeTemplate }: ThemeCustomizerProps) {
  
  const updateTypography = (field: keyof ResumeThemeConfig['typography'], value: string) => {
    onChange({
      ...themeConfig,
      typography: { ...themeConfig.typography, [field]: value }
    });
  };

  const updateColors = (field: keyof ResumeThemeConfig['colors'], value: string) => {
    onChange({
      ...themeConfig,
      colors: { ...themeConfig.colors, [field]: value }
    });
  };

  const updateLayout = (field: keyof ResumeThemeConfig['layout'], value: string) => {
    onChange({
      ...themeConfig,
      layout: { ...themeConfig.layout, [field]: value }
    });
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pr-4 space-y-6 pb-20">
      
      {/* Template Selection */}
      <section className="bg-surface/50 border border-white/10 rounded-2xl p-5">
        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
          <LayoutTemplate className="w-5 h-5 text-primary" /> Template
        </h2>
        
        <div className="grid grid-cols-2 gap-3">
          {availableTemplates.map(template => (
            <button
              key={template.id}
              onClick={() => onChangeTemplate(template.id)}
              className={`p-3 rounded-xl border flex flex-col gap-2 items-center text-center transition-all ${
                templateId === template.id 
                  ? "bg-primary/10 border-primary/50 ring-1 ring-primary/50" 
                  : "bg-black/20 border-white/5 hover:border-white/20 hover:bg-black/40"
              }`}
            >
              <div className="w-full aspect-[1/1.4] bg-white rounded shadow-inner overflow-hidden relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover opacity-80" />
                {templateId === template.id && (
                  <div className="absolute inset-0 border-2 border-primary rounded" />
                )}
              </div>
              <span className="text-xs font-medium text-text-primary">{template.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section className="bg-surface/50 border border-white/10 rounded-2xl p-5">
        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
          <Type className="w-5 h-5 text-emerald-400" /> Typography
        </h2>
        
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Font Family</label>
            <select
              value={themeConfig.typography.fontFamily}
              onChange={(e) => updateTypography("fontFamily", e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-colors appearance-none"
            >
              {fontOptions.map(font => (
                <option key={font.value} value={font.value} className="bg-surface text-text-primary">{font.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Base Size</label>
              <select
                value={themeConfig.typography.fontSize}
                onChange={(e) => updateTypography("fontSize", e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-colors appearance-none"
              >
                <option value="11px" className="bg-surface">Small (11px)</option>
                <option value="12px" className="bg-surface">Standard (12px)</option>
                <option value="13px" className="bg-surface">Large (13px)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Line Height</label>
              <select
                value={themeConfig.typography.lineHeight}
                onChange={(e) => updateTypography("lineHeight", e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-colors appearance-none"
              >
                <option value="1.3" className="bg-surface">Compact (1.3)</option>
                <option value="1.5" className="bg-surface">Normal (1.5)</option>
                <option value="1.7" className="bg-surface">Relaxed (1.7)</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Colors */}
      <section className="bg-surface/50 border border-white/10 rounded-2xl p-5">
        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-rose-400" /> Colors
        </h2>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Accent Color</label>
            <div className="flex flex-wrap gap-3">
              {accentColors.map(color => (
                <button
                  key={color.value}
                  onClick={() => updateColors("accent", color.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    themeConfig.colors.accent === color.value ? "border-white shadow-[0_0_10px_rgba(255,255,255,0.3)] scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
              {/* Custom Color Picker */}
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20">
                <input 
                  type="color" 
                  value={themeConfig.colors.accent}
                  onChange={(e) => updateColors("accent", e.target.value)}
                  className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] cursor-pointer"
                  title="Custom Accent"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Layout */}
      <section className="bg-surface/50 border border-white/10 rounded-2xl p-5">
        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
          <Columns className="w-5 h-5 text-orange-400" /> Layout & Spacing
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Page Margins</label>
            <select
              value={themeConfig.layout.margins}
              onChange={(e) => updateLayout("margins", e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-colors appearance-none"
            >
              <option value="38px" className="bg-surface">Narrow (1in)</option>
              <option value="57px" className="bg-surface">Standard (1.5in)</option>
              <option value="76px" className="bg-surface">Wide (2in)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Section Spacing</label>
            <select
              value={themeConfig.layout.sectionSpacing}
              onChange={(e) => updateLayout("sectionSpacing", e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-colors appearance-none"
            >
              <option value="12px" className="bg-surface">Compact</option>
              <option value="16px" className="bg-surface">Comfortable</option>
              <option value="24px" className="bg-surface">Airy</option>
            </select>
          </div>
        </div>
      </section>

      {/* Save Preset */}
      <section className="bg-surface/50 border border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
        <Settings2 className="w-6 h-6 text-text-muted mb-2" />
        <h3 className="text-sm font-bold text-text-primary">Save as Preset</h3>
        <p className="text-xs text-text-muted mt-1">Love this combination? Save it as a custom preset to reuse later.</p>
        <button className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-text-primary transition-colors">
          Save Theme
        </button>
      </section>

    </div>
  );
}
