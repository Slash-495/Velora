"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Share2, Copy, Check, Globe } from "lucide-react";
import { useState } from "react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeId: string;
}

export function ShareModal({ isOpen, onClose, resumeId }: ShareModalProps) {
  const [isPublic, setIsPublic] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);

  const handleToggleShare = () => {
    // In a real app, this would call Supabase to insert/update the shared_resumes table
    if (!isPublic) {
      setShareId(`share-${Math.random().toString(36).substring(7)}`);
      setIsPublic(true);
    } else {
      setShareId(null);
      setIsPublic(false);
    }
  };

  const shareUrl = typeof window !== 'undefined' && shareId 
    ? `${window.location.origin}/resume/${shareId}` 
    : '';

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="relative w-full max-w-md bg-surface border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-primary leading-tight">Share Resume</h2>
                  <p className="text-xs text-text-muted mt-0.5">Publish a public link to your resume.</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col gap-6">
              
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <Globe className={`w-5 h-5 ${isPublic ? 'text-blue-400' : 'text-text-muted'}`} />
                  <div>
                    <p className="font-semibold text-sm text-text-primary">Public Access</p>
                    <p className="text-xs text-text-muted">Anyone with the link can view.</p>
                  </div>
                </div>
                <button
                  onClick={handleToggleShare}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${isPublic ? 'bg-blue-500' : 'bg-white/10'}`}
                >
                  <motion.div 
                    layout
                    className="w-4 h-4 bg-white rounded-full mx-1 shadow-sm"
                    animate={{ x: isPublic ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {isPublic && shareUrl && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex flex-col gap-2"
                >
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Public Link</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-text-muted truncate">
                      {shareUrl}
                    </div>
                    <button 
                      onClick={handleCopy}
                      className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </motion.div>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
