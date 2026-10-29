"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, Loader2, ChevronRight, Clock } from "lucide-react";
import { FeedbackCard } from "./FeedbackCard";

interface Question {
  question: string;
  category: string;
}

interface MockInterviewWorkspaceProps {
  questions: Question[];
  context: {
    role: string;
    jdText: string;
    resumeId: string;
  };
}

export function MockInterviewWorkspace({ questions, context }: MockInterviewWorkspaceProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  const recognitionRef = useRef<any>(null);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    // Timer Logic
    let timer: NodeJS.Timeout;
    if (!feedback && !isEvaluating) {
      timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [feedback, isEvaluating, currentIndex]);

  useEffect(() => {
    // Initialize Web Speech API
    if (typeof window !== "undefined" && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setAnswer(prev => prev + " " + finalTranscript.trim());
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please type your answer.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setAnswer(""); // Clear previous text when starting a new recording
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    setIsEvaluating(true);
    setEvaluationError(null);
    
    try {
      const res = await fetch('/api/ai/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion.question,
          answer: answer.trim(),
          role: context.role,
          jdText: context.jdText,
          // We don't have the full resume content here without fetching, 
          // but in a real app we would fetch it. Mocking it for now.
          resumeContent: { personalInfo: { summary: "Mock summary" } } 
        })
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error?.message || "Failed to evaluate answer.");

      setFeedback(payload.data);
    } catch (error: any) {
      console.error("Evaluation failed", error);
      setEvaluationError(error.message || "Failed to evaluate answer. Please try again.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNext = () => {
    setFeedback(null);
    setEvaluationError(null);
    setAnswer("");
    setTimeElapsed(0);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      alert("Interview Complete! Great job.");
      // Redirect to history/dashboard
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-text-muted">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-lg text-xs font-bold uppercase tracking-wider">
            {currentQuestion.category}
          </span>
        </div>
        
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${timeElapsed > 120 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-surface border-white/10 text-text-secondary'} font-mono text-sm transition-colors`}>
          <Clock className="w-4 h-4" />
          {formatTime(timeElapsed)}
        </div>
      </div>

      {/* Main Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-surface border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-8">
            {currentQuestion.question}
          </h2>

          <div className="space-y-4">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here, or click the microphone to speak..."
              disabled={isEvaluating || !!feedback}
              className="w-full h-48 bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-primary/50 transition-colors resize-none custom-scrollbar disabled:opacity-50"
            />

            {evaluationError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                {evaluationError}
              </div>
            )}

            {!feedback && (
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <button
                  onClick={toggleRecording}
                  disabled={isEvaluating}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse' 
                      : 'bg-white/5 hover:bg-white/10 text-text-primary border border-white/10'
                  } disabled:opacity-50`}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  {isRecording ? "Stop Recording" : "Use Microphone"}
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={!answer.trim() || isEvaluating}
                  className="btn-glow px-8 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  {isEvaluating ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Evaluating...</>
                  ) : (
                    <>Submit Answer <Send className="w-4 h-4 ml-1" /></>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Feedback Card */}
      <AnimatePresence>
        {feedback && (
          <FeedbackCard 
            score={feedback.score}
            feedback={feedback.feedback}
            missingConcepts={feedback.missingConcepts}
          />
        )}
      </AnimatePresence>

      {/* Next Question Navigation */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end pt-4"
          >
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-white text-black hover:bg-gray-200 rounded-xl font-bold transition-all flex items-center gap-2 shadow-xl"
            >
              {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Interview'} <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
