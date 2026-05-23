"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Play, Code2, AlertTriangle, CheckCircle2, Undo2, Redo2, ChevronDown, Bold, Italic, Underline, Search, Settings, Calculator, Omega, MoreHorizontal, FileSignature, AlignLeft, FileText, ClipboardPaste, RefreshCcw } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";

interface LatexEditorProps {
  initialLatex: string;
  onCompile: (latexCode: string) => void;
}

const fontFamilies = ["Times New Roman", "Arial", "Helvetica", "Courier New", "Georgia", "Verdana"];
const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];
const textTypes = [
  { label: "Normal text", cmd: "" },
  { label: "Section", cmd: "\\section" },
  { label: "Subsection", cmd: "\\subsection" },
  { label: "Subsubsection", cmd: "\\subsubsection" },
  { label: "Paragraph", cmd: "\\paragraph" },
  { label: "Subparagraph", cmd: "\\subparagraph" },
];

export function LatexEditor({ initialLatex, onCompile }: LatexEditorProps) {
  const [code, setCode] = useState(initialLatex);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileStatus, setCompileStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [lastSelection, setLastSelection] = useState<any>(null);

  // Dropdown states
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [selectedFont, setSelectedFont] = useState("Times New Roman");
  const [selectedSize, setSelectedSize] = useState(10);
  const [selectedTextType, setSelectedTextType] = useState("Normal text");

  // Close dropdowns on outside click
  const toolbarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setCode(initialLatex);
  }, [initialLatex]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    setEditorInstance(editor);
    editor.onDidChangeCursorSelection((e: any) => {
      setLastSelection(e.selection);
    });
  };

  const handleCompile = () => {
    setIsCompiling(true);
    setCompileStatus("idle");

    setTimeout(() => {
      setIsCompiling(false);
      
      if (!code.includes("\\documentclass") || !code.includes("\\begin{document}")) {
        setCompileStatus("error");
        setErrorMessage("LaTeX compilation failed. Missing \\documentclass or \\begin{document}. Please give the correct latex code.");
        return;
      }

      setCompileStatus("success");
      onCompile(code);
    }, 800);
  };

  const executeCommand = (command: string) => {
    if (!editorInstance) return;
    editorInstance.focus();
    if (command === 'undo') editorInstance.trigger('keyboard', 'undo', null);
    if (command === 'redo') editorInstance.trigger('keyboard', 'redo', null);
    if (command === 'find') editorInstance.trigger('keyboard', 'actions.find', null);
  };

  const wrapText = (before: string, after: string) => {
    if (!editorInstance) return;
    
    // Always use the last known selection to handle cases where focus was lost to the toolbar
    const selection = lastSelection || editorInstance.getSelection();
    if (!selection) return;

    const model = editorInstance.getModel();
    const text = model.getValueInRange(selection);
    
    editorInstance.executeEdits("toolbar", [{
      range: selection,
      text: `${before}${text}${after}`,
      forceMoveMarkers: true
    }]);
    
    // Reposition cursor inside the wrapper if no text was selected
    if (text === "") {
      editorInstance.setPosition({
        lineNumber: selection.startLineNumber,
        column: selection.startColumn + before.length
      });
    } else {
      // Re-select the wrapped text
      editorInstance.setSelection({
        startLineNumber: selection.startLineNumber,
        startColumn: selection.startColumn,
        endLineNumber: selection.endLineNumber,
        endColumn: selection.endColumn + before.length + after.length
      });
    }
    
    editorInstance.focus();
  };

  const handleTextTypeChange = (type: typeof textTypes[0]) => {
    setSelectedTextType(type.label);
    setActiveDropdown(null);
    if (type.cmd) {
      wrapText(`${type.cmd}{`, '}');
    }
  };

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
      
      {/* Editor Topbar */}
      <div className="h-12 bg-surface/80 border-b border-white/10 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-text-primary tracking-wide">cv.tex</span>
        </div>

        <div className="flex items-center gap-3">
          {compileStatus === "success" && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5" /> Compiled
            </span>
          )}
          {compileStatus === "error" && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-500/10 px-2.5 py-1 rounded-md">
              <AlertTriangle className="w-3.5 h-3.5" /> Failed
            </span>
          )}

          <button 
            onClick={handleCompile}
            disabled={isCompiling}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-900/20"
          >
            <Play className={`w-3.5 h-3.5 ${isCompiling ? "animate-pulse" : "fill-current"}`} />
            {isCompiling ? "Compiling..." : "Recompile"}
          </button>
        </div>
      </div>

      {/* Real Working Formatting Toolbar */}
      <div ref={toolbarRef} className="h-11 bg-[#1e1e1e] border-b border-white/10 flex items-center px-4 shrink-0 overflow-visible relative">
        <div className="flex items-center gap-1 mr-4 border-r border-white/10 pr-4 h-full">
          <button onMouseDown={(e) => { e.preventDefault(); executeCommand('undo'); }} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/10 rounded transition-colors" title="Undo"><Undo2 className="w-4 h-4" /></button>
          <button onMouseDown={(e) => { e.preventDefault(); executeCommand('redo'); }} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/10 rounded transition-colors" title="Redo"><Redo2 className="w-4 h-4" /></button>
        </div>

        {/* Text Type Dropdown */}
        <div className="relative mr-4">
          <button onMouseDown={(e) => { e.preventDefault(); toggleDropdown("textType"); }} className={`flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary px-2 py-1 rounded transition-colors ${activeDropdown === 'textType' ? 'bg-white/10' : 'hover:bg-white/5'}`}>
            {selectedTextType} <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <AnimatePresence>
            {activeDropdown === "textType" && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute top-full left-0 mt-1 w-48 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 py-1">
                {textTypes.map(type => (
                  <button key={type.label} onMouseDown={(e) => { e.preventDefault(); handleTextTypeChange(type); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 ${selectedTextType === type.label ? 'text-white font-medium' : 'text-text-secondary'}`}>
                    {type.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Font Family Dropdown */}
        <div className="relative mr-4">
          <button onMouseDown={(e) => { e.preventDefault(); toggleDropdown("fontFamily"); }} className={`flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary px-2 py-1 rounded transition-colors max-w-[120px] ${activeDropdown === 'fontFamily' ? 'bg-white/10' : 'hover:bg-white/5'}`}>
            <span className="truncate">{selectedFont}</span> <ChevronDown className="w-3.5 h-3.5 shrink-0" />
          </button>
          <AnimatePresence>
            {activeDropdown === "fontFamily" && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute top-full left-0 mt-1 w-48 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 py-1">
                {fontFamilies.map(font => (
                  <button key={font} onMouseDown={(e) => { e.preventDefault(); setSelectedFont(font); setActiveDropdown(null); wrapText(`\\fontfamily{${font.toLowerCase().replace(/\s/g, '')}}\\selectfont `, ''); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 ${selectedFont === font ? 'text-white font-medium' : 'text-text-secondary'}`} style={{ fontFamily: font }}>
                    {font}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Font Size Dropdown */}
        <div className="relative mr-4 border-r border-white/10 pr-4 h-full flex items-center">
          <button onMouseDown={(e) => { e.preventDefault(); toggleDropdown("fontSize"); }} className={`flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary px-2 py-1 rounded transition-colors ${activeDropdown === 'fontSize' ? 'bg-white/10' : 'hover:bg-white/5'}`}>
            Size {selectedSize}pt <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <AnimatePresence>
            {activeDropdown === "fontSize" && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute top-full left-0 mt-1 w-24 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 py-1 max-h-64 overflow-y-auto custom-scrollbar">
                {fontSizes.map(size => (
                  <button key={size} onMouseDown={(e) => { e.preventDefault(); setSelectedSize(size); setActiveDropdown(null); wrapText(`\\fontsize{${size}}{${Math.round(size*1.2)}}\\selectfont `, ''); }} className={`w-full text-left px-4 py-1.5 text-sm hover:bg-white/5 ${selectedSize === size ? 'text-white font-medium' : 'text-text-secondary'}`}>
                    {size}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Format Toggles */}
        <div className="flex items-center gap-1 border-r border-white/10 pr-4 mr-4 h-full">
          <button onMouseDown={(e) => { e.preventDefault(); wrapText('\\textbf{', '}'); }} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/10 rounded transition-colors" title="Bold"><Bold className="w-4 h-4" /></button>
          <button onMouseDown={(e) => { e.preventDefault(); wrapText('\\textit{', '}'); }} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/10 rounded transition-colors" title="Italic"><Italic className="w-4 h-4" /></button>
          <button onMouseDown={(e) => { e.preventDefault(); wrapText('\\underline{', '}'); }} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/10 rounded transition-colors" title="Underline"><Underline className="w-4 h-4" /></button>
          <button onMouseDown={(e) => e.preventDefault()} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/10 rounded transition-colors"><Calculator className="w-4 h-4" /></button>
          <button onMouseDown={(e) => e.preventDefault()} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/10 rounded transition-colors"><Omega className="w-4 h-4" /></button>
          <button onMouseDown={(e) => e.preventDefault()} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/10 rounded transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
        </div>

        <div className="flex items-center gap-2 border-r border-white/10 pr-4 mr-4 h-full">
          <button onMouseDown={(e) => e.preventDefault()} className="px-3 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-bold tracking-wider rounded-full border border-blue-500/30">WRITEFULL</button>
          <button onMouseDown={(e) => e.preventDefault()} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/10 rounded transition-colors"><FileSignature className="w-4 h-4" /></button>
          <button onMouseDown={(e) => e.preventDefault()} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/10 rounded transition-colors"><AlignLeft className="w-4 h-4" /></button>
        </div>

        <div className="flex items-center gap-1 flex-1 h-full">
          <button onMouseDown={(e) => e.preventDefault()} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/10 rounded transition-colors"><FileText className="w-4 h-4" /></button>
          <button onMouseDown={(e) => e.preventDefault()} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/10 rounded transition-colors"><ClipboardPaste className="w-4 h-4" /></button>
          <button onMouseDown={(e) => e.preventDefault()} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/10 rounded transition-colors"><RefreshCcw className="w-4 h-4" /></button>
        </div>

        {/* Search & Settings */}
        <div className="flex items-center gap-1 ml-auto">
          <button onMouseDown={(e) => { e.preventDefault(); executeCommand('find'); }} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/10 rounded transition-colors" title="Search"><Search className="w-4 h-4" /></button>
          
          <div className="relative">
            <button onMouseDown={(e) => { e.preventDefault(); toggleDropdown("settings"); }} className={`p-1.5 rounded transition-colors ${activeDropdown === 'settings' ? 'bg-white/10 text-text-primary' : 'text-text-muted hover:text-text-primary hover:bg-white/10'}`} title="Settings"><Settings className="w-4 h-4" /></button>
            <AnimatePresence>
              {activeDropdown === "settings" && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute top-full right-0 mt-2 w-72 bg-[#1a1b26] border border-white/10 rounded-lg shadow-2xl z-50 text-sm overflow-hidden ring-1 ring-black/50">
                  
                  <div className="px-4 py-2 border-b border-white/5">
                    <h4 className="text-white/90 font-medium mb-3 mt-1">Language suggestions</h4>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white/80 text-[13px]">Display suggestions</span>
                      <div className="w-8 h-4.5 bg-emerald-500 rounded-full flex items-center justify-end px-0.5 cursor-pointer"><div className="w-3.5 h-3.5 bg-white rounded-full"></div></div>
                    </div>
                    <div className="flex items-center justify-between mb-3 cursor-pointer group">
                      <span className="text-white/80 text-[13px]">Model: Writefull</span>
                      <ChevronDown className="w-4 h-4 text-white/40 group-hover:text-white/80 -rotate-90" />
                    </div>
                    <div className="flex items-center justify-between mb-3 cursor-pointer">
                      <span className="text-white/80 text-[13px]">English variant: American</span>
                      <div className="w-8 h-5 rounded overflow-hidden flex items-center justify-center opacity-90"><span className="text-lg">🇺🇸</span></div>
                    </div>
                    <div className="flex items-center justify-between mb-1 cursor-pointer group">
                      <span className="text-white/80 text-[13px]">Blocked language suggestions</span>
                      <ChevronDown className="w-4 h-4 text-white/40 group-hover:text-white/80 -rotate-90" />
                    </div>
                  </div>

                  <div className="px-4 py-2 border-b border-white/5">
                    <h4 className="text-white/90 font-medium mb-3 mt-1">AI feature shortcuts</h4>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white/80 text-[13px]">Active on text selection</span>
                      <div className="w-8 h-4.5 bg-emerald-500 rounded-full flex items-center justify-end px-0.5 cursor-pointer"><div className="w-3.5 h-3.5 bg-white rounded-full"></div></div>
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/80 text-[13px]">Active with 'Space' on empty line</span>
                      <div className="w-8 h-4.5 bg-white/20 rounded-full flex items-center justify-start px-0.5 cursor-pointer"><div className="w-3.5 h-3.5 bg-white rounded-full"></div></div>
                    </div>
                  </div>

                  <div className="px-4 py-3 border-b border-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white/90 text-[13px]">Supercomplete</h4>
                        <p className="text-white/40 text-[11px] mt-0.5">Complete sentences with 'Shift+Space'</p>
                      </div>
                      <div className="w-8 h-4.5 bg-white/20 rounded-full flex items-center justify-start px-0.5 cursor-pointer"><div className="w-3.5 h-3.5 bg-white rounded-full"></div></div>
                    </div>
                  </div>

                  <div className="px-4 py-2 bg-[#15161e]">
                    <span className="text-white/30 text-[11px]">version 2025.68.0</span>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Error Output Panel */}
      {compileStatus === "error" && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-[#2d1b1b] border-b border-red-500/20 p-4 shrink-0 z-10 relative shadow-md"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-red-400">Emergency stop.</h3>
              <p className="text-xs text-text-secondary mt-1 font-mono">{errorMessage}</p>
              <div className="mt-3 bg-black/40 p-3 rounded border border-red-500/10 font-mono text-[11px] text-text-muted overflow-x-auto">
                <p>{"<*> cv.tex"}</p>
                <p className="mt-2">{"*** (job aborted, no legal \\end found)"}</p>
                <p className="mt-2 text-red-400/80">Check your LaTeX syntax and ensure proper document structure.</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Monaco Editor Canvas */}
      <div className="flex-1 min-h-0 relative z-0">
        <Editor
          height="100%"
          defaultLanguage="latex"
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value || "")}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            lineHeight: 1.6,
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            wordWrap: "on",
            renderLineHighlight: "all",
          }}
          loading={
            <div className="flex items-center justify-center h-full text-text-muted text-sm gap-2">
              <Code2 className="w-4 h-4 animate-pulse" /> Loading Editor...
            </div>
          }
        />
      </div>

    </div>
  );
}
