"use client";

import { useEffect, useState } from "react";
import { MockInterviewWorkspace } from "@/components/interview-prep/MockInterviewWorkspace";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function InterviewSessionPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>([]);
  const [context, setContext] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch questions and context from Supabase using sessionId params.
    // Here we read from localStorage set in the config page.
    try {
      const q = localStorage.getItem('mock_interview_questions');
      const c = localStorage.getItem('mock_interview_context');
      
      if (q && c) {
        setQuestions(JSON.parse(q));
        setContext(JSON.parse(c));
      } else {
        throw new Error("No session data found");
      }
    } catch (error) {
      console.error(error);
      alert("Session not found or expired.");
      router.push('/dashboard/interview-prep');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-text-muted mt-4">Loading Interview Workspace...</p>
      </div>
    );
  }

  if (!questions.length || !context) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Simple Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/dashboard/interview-prep" 
          className="w-10 h-10 rounded-xl bg-surface border border-white/10 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Mock Interview: {context.role}</h1>
          <p className="text-xs text-text-muted mt-0.5">Focus and answer clearly. You've got this.</p>
        </div>
      </div>

      <MockInterviewWorkspace questions={questions} context={context} />
    </div>
  );
}
