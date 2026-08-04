"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, MessageSquare, Sparkles, Loader2, Volume2, EyeOff, Bot, Download, Award } from "lucide-react";
import { useRouter } from "next/navigation";
import { InterviewReportModal } from "./InterviewReportModal";

interface HackerRankInterviewRoomProps {
  roleTitle?: string;
  jdText?: string;
  resumeContent?: any;
  userName?: string;
  onEnd?: () => void;
}

export function HackerRankInterviewRoom({ 
  roleTitle = "Senior Software Engineer", 
  jdText = "",
  resumeContent = null,
  userName = "Candidate", 
  onEnd 
}: HackerRankInterviewRoomProps) {
  const router = useRouter();
  
  // State
  const [timeLeft, setTimeLeft] = useState(1782); // 29:42 in seconds
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [showCaptions, setShowCaptions] = useState(true);
  const [personNotVisible, setPersonNotVisible] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // AI & Voice States
  const [aiSpeechState, setAiSpeechState] = useState<"speaking" | "listening" | "thinking">("speaking");
  const [currentAiMessage, setCurrentAiMessage] = useState<string>("");
  const [userTranscript, setUserTranscript] = useState<string>("");
  const [history, setHistory] = useState<{ role: "ai" | "user"; text: string }[]>([]);

  // Voice Selection State
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittingRef = useRef<boolean>(false);

  // STOP ALL SPEECH SYNTHESIS IMMEDIATELY ON UNMOUNT OR NAVIGATION
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  // Initialize Voices
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith("en"));
        setAvailableVoices(voices);
        if (voices.length > 0 && !selectedVoiceURI) {
          const pref = voices.find(v => v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha")) || voices[0];
          setSelectedVoiceURI(pref.voiceURI);
        }
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Periodic Camera Frame Presence Detection
  useEffect(() => {
    if (!analysisCanvasRef.current && typeof window !== "undefined") {
      analysisCanvasRef.current = document.createElement("canvas");
      analysisCanvasRef.current.width = 32;
      analysisCanvasRef.current.height = 32;
    }

    const checkInterval = setInterval(() => {
      if (!isCamOn) {
        setPersonNotVisible(true);
        return;
      }

      const video = videoRef.current;
      const canvas = analysisCanvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      try {
        ctx.drawImage(video, 0, 0, 32, 32);
        const imageData = ctx.getImageData(0, 0, 32, 32);
        const data = imageData.data;

        let totalBrightness = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          totalBrightness += (r + g + b) / 3;
        }

        const avgLuminance = totalBrightness / (32 * 32);

        if (avgLuminance < 12) {
          setPersonNotVisible(true);
        } else {
          setPersonNotVisible(false);
        }
      } catch (e) {}
    }, 2500);

    return () => clearInterval(checkInterval);
  }, [isCamOn]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format seconds to mm:ss mins
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')} mins`;
  };

  // Initialize WebCam Stream
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access failed:", err);
        setIsCamOn(false);
      }
    }

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Handle Mute/Cam Toggles
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => (t.enabled = isMicOn));
      streamRef.current.getVideoTracks().forEach(t => (t.enabled = isCamOn));
    }
  }, [isMicOn, isCamOn]);

  // Speech Synthesis
  const speakAiMessage = useCallback((text: string, onComplete?: () => void) => {
    setAiSpeechState("speaking");
    setCurrentAiMessage(text);

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      if (selectedVoiceURI) {
        const chosenVoice = availableVoices.find(v => v.voiceURI === selectedVoiceURI);
        if (chosenVoice) utterance.voice = chosenVoice;
      }

      utterance.onend = () => {
        if (onComplete) {
          onComplete();
        } else {
          setAiSpeechState("listening");
          startListeningUser();
        }
      };

      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        } else {
          setAiSpeechState("listening");
          startListeningUser();
        }
      }, 4000);
    }
  }, [selectedVoiceURI, availableVoices]);

  // Start Initial AI Greeting based on Role/JD/Resume
  useEffect(() => {
    const greeting = `Hey ${userName}! Great to meet you. I'm your AI Technical Recruiter today for the ${roleTitle} position. I've reviewed your background and the job description. To get started, could you briefly introduce yourself and share a key technical project you're proud of?`;
    speakAiMessage(greeting);
    setHistory([{ role: "ai", text: greeting }]);
  }, []);

  // Submit Answer to Gemini API & get dynamic reply
  const handleAutoSubmitAnswer = useCallback(async (answerText: string) => {
    if (!answerText.trim() || isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    setAiSpeechState("thinking");
    const updatedHistory = [...history, { role: "user" as const, text: answerText }];
    setHistory(updatedHistory);
    setUserTranscript("");

    try {
      const res = await fetch("/api/ai/interview-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: roleTitle,
          jdText,
          resumeContent,
          userAnswer: answerText,
          conversationHistory: updatedHistory
        })
      });

      const data = await res.json();
      const aiReply = data.reply || "Thank you for sharing. How do you handle scalability and error monitoring in production?";
      
      setHistory(prev => [...prev, { role: "ai", text: aiReply }]);
      speakAiMessage(aiReply);
    } catch (err) {
      console.error("Gemini Chat error:", err);
      const fallbackMsg = "Thanks for that explanation. Moving forward, how do you handle software architecture trade-offs under tight deadlines?";
      setHistory(prev => [...prev, { role: "ai", text: fallbackMsg }]);
      speakAiMessage(fallbackMsg);
    } finally {
      isSubmittingRef.current = false;
    }
  }, [history, roleTitle, jdText, resumeContent, speakAiMessage]);

  // Speech Recognition with Silence Detection for AUTO-SUBMIT
  const startListeningUser = () => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript.trim()) {
            setUserTranscript(transcript);

            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              handleAutoSubmitAnswer(transcript);
            }, 2200);
          }
        };

        recognitionRef.current.onerror = (e: any) => {
          console.error("Speech Rec error:", e);
        };
      }
      try {
        recognitionRef.current.start();
      } catch (e) {}
    }
  };

  // End Test: CANCEL SPEECH IMMEDIATELY & OPEN REPORT MODAL
  const handleEndInterview = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // STOP SPEECH IMMEDIATELY
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    setShowReportModal(true);
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    if (onEnd) onEnd();
    else router.push("/dashboard/interview-prep");
  };

  // Canvas Wave Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let step = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = 120;
    };
    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(52, 211, 153, 0.25)";
      ctx.lineWidth = 1;

      const rows = 12;
      const cols = 40;
      const w = canvas.width / cols;

      for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        for (let c = 0; c <= cols; c++) {
          const x = c * w;
          const distFromCenter = Math.abs(c - cols / 2) / (cols / 2);
          const heightAmp = aiSpeechState === "speaking" ? 18 : aiSpeechState === "thinking" ? 10 : 6;
          const y = canvas.height - (rows - r) * 8 + Math.sin(step * 0.05 + c * 0.2 + r) * heightAmp * (1 - distFromCenter * 0.5);
          if (c === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      step++;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [aiSpeechState]);

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col font-sans overflow-hidden">
      
      {/* Top Header Bar with Velora AI Branding */}
      <header className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-black/90 backdrop-blur-md shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-gradient-to-tr from-primary to-purple-500 rounded-lg font-black flex items-center justify-center text-xs text-white shadow-md">V</span>
            <span className="font-extrabold tracking-wider text-base text-white">Velora AI</span>
          </div>
          <span className="text-white/20">|</span>
          <span className="text-xs text-white/80 font-medium tracking-wide">Technical Screen Mock Interview</span>
        </div>

        {/* Voice Selector Dropdown & Controls */}
        <div className="flex items-center gap-4">
          
          {/* Voice Selector Dropdown */}
          <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
            <Bot className="w-4 h-4 text-emerald-400" />
            <select 
              value={selectedVoiceURI}
              onChange={(e) => setSelectedVoiceURI(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer max-w-[160px] truncate"
            >
              {availableVoices.length > 0 ? (
                availableVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI} className="bg-background text-white">
                    {v.name.replace(/Google|Microsoft|Apple/gi, "").trim()}
                  </option>
                ))
              ) : (
                <option value="" className="bg-background">AI Voice: Default</option>
              )}
            </select>
          </div>

          <span className="font-mono text-sm font-semibold text-white/80 tracking-wider">
            {formatTimer(timeLeft)}
          </span>

          <button 
            onClick={handleEndInterview}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs tracking-wide transition-colors shadow-lg"
          >
            End Interview
          </button>
        </div>
      </header>

      {/* Main Room Body */}
      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden p-6 md:p-12 gap-8 items-center justify-center">
        
        {/* Floating Camera Vision Alert Popup */}
        <AnimatePresence>
          {personNotVisible && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-black px-6 py-3 rounded-2xl font-extrabold shadow-[0_0_30px_rgba(245,158,11,0.6)] border border-amber-300 flex items-center gap-3 text-sm backdrop-blur-md"
            >
              <EyeOff className="w-5 h-5 animate-pulse text-black shrink-0" />
              <span>I can't see you on camera. Please sit in front of the camera.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left Column: Live AI Recruiter Transcript */}
        <div className="flex-1 max-w-2xl w-full flex flex-col justify-center space-y-6 z-10">
          
          {/* AI Voice State Indicator */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              {aiSpeechState === "speaking" ? (
                <Volume2 className="w-3.5 h-3.5 animate-pulse" />
              ) : aiSpeechState === "thinking" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              {aiSpeechState === "speaking" ? "AI Recruiter Speaking..." : aiSpeechState === "thinking" ? "AI Recruiter Analyzing Response..." : "Listening (Speaking will auto-submit)..."}
            </span>
          </div>

          {/* Transcript Display Box */}
          <motion.div 
            key={currentAiMessage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl space-y-4"
          >
            <p className="text-lg md:text-xl text-white/90 leading-relaxed font-light italic">
              "{currentAiMessage}"
            </p>

            {/* Live User Transcript */}
            {userTranscript && (
              <div className="mt-4 pt-4 border-t border-white/10 text-sm text-emerald-400 font-mono">
                <span className="text-xs text-white/50 block mb-1">Your Speech (Auto-submitting on pause...):</span>
                {userTranscript}
              </div>
            )}
          </motion.div>

        </div>

        {/* Right Column: User Live Webcam Feed */}
        <div className="w-full max-w-lg aspect-[4/3] relative rounded-3xl bg-surface border border-white/10 overflow-hidden shadow-2xl z-10 shrink-0">
          {isCamOn ? (
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black/80 text-white/40 gap-3">
              <VideoOff className="w-12 h-12" />
              <span className="text-xs font-semibold uppercase tracking-wider">Camera Paused</span>
            </div>
          )}

          {/* User Name Badge */}
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            {userName}
          </div>

          {/* Audio Level Badge */}
          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10 flex items-center gap-1">
            {[1, 2, 3].map(i => (
              <span 
                key={i} 
                className={`w-1 h-3 rounded-full ${isMicOn ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`}
              />
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Waveform & Controls */}
      <div className="relative shrink-0 flex flex-col items-center justify-end pb-6 z-20">
        
        {/* Canvas Mesh Waveform */}
        <canvas ref={canvasRef} className="absolute bottom-0 inset-x-0 w-full h-32 pointer-events-none opacity-60" />

        {/* Floating Controls Bar */}
        <div className="relative z-30 bg-surface/80 backdrop-blur-2xl border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-2xl">
          <button 
            onClick={() => setIsMicOn(!isMicOn)}
            className={`p-3 rounded-xl transition-all ${isMicOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
            title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <button 
            onClick={() => setIsCamOn(!isCamOn)}
            className={`p-3 rounded-xl transition-all ${isCamOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
            title={isCamOn ? "Turn Off Camera" : "Turn On Camera"}
          >
            {isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button 
            onClick={() => setShowCaptions(!showCaptions)}
            className={`p-3 rounded-xl transition-all ${showCaptions ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/10 text-white hover:bg-white/20'}`}
            title="Toggle Captions"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* Downloadable Performance Evaluation Report Modal */}
      <InterviewReportModal 
        isOpen={showReportModal}
        onClose={handleCloseReportModal}
        roleTitle={roleTitle}
        userName={userName}
        history={history}
      />

    </div>
  );
}
