"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Video, Volume2, X, Check, Play, RefreshCw, AlertTriangle } from "lucide-react";

interface AudioCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (settings: { micId: string; camId: string; speakerId: string }) => void;
}

export function AudioCameraModal({ isOpen, onClose, onStart }: AudioCameraModalProps) {
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [speakerDevices, setSpeakerDevices] = useState<MediaDeviceInfo[]>([]);
  
  const [selectedMic, setSelectedMic] = useState<string>("");
  const [selectedCam, setSelectedCam] = useState<string>("");
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("");

  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isPlayingTestSound, setIsPlayingTestSound] = useState<boolean>(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  const initDevices = useCallback(async () => {
    setDeviceError(null);
    try {
      const initialStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      streamRef.current = initialStream;

      if (videoRef.current) {
        videoRef.current.srcObject = initialStream;
      }

      // Setup Audio Analyser for live mic level
      setupAudioAnalyser(initialStream);

      // Enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter(d => d.kind === 'audioinput');
      const cams = devices.filter(d => d.kind === 'videoinput');
      const speakers = devices.filter(d => d.kind === 'audiooutput');

      setAudioDevices(mics);
      setVideoDevices(cams);
      setSpeakerDevices(speakers);

      if (mics.length > 0) setSelectedMic(mics[0].deviceId);
      if (cams.length > 0) setSelectedCam(cams[0].deviceId);
      if (speakers.length > 0) setSelectedSpeaker(speakers[0].deviceId);

      if (cams.length === 0 || mics.length === 0) {
        setDeviceError("Camera or Microphone device not detected. Please verify your hardware connection.");
      }

    } catch (err: any) {
      console.error("Camera/Mic permission error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setDeviceError("Access denied: Please grant camera and microphone permissions in your browser settings to proceed.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setDeviceError("Device not found: No active camera or microphone detected on your system.");
      } else {
        setDeviceError(`Device initialization error: ${err.message || 'Unable to access media devices'}`);
      }
    }
  }, []);

  // Request permissions and enumerate devices
  useEffect(() => {
    if (!isOpen) {
      stopStream();
      return;
    }

    initDevices();

    return () => {
      stopStream();
    };
  }, [isOpen, initDevices]);

  const stopStream = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const setupAudioAnalyser = (stream: MediaStream) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      analyser.fftSize = 64;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
        animationRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (e) {
      console.error("Audio analyser failed:", e);
    }
  };

  const handleTestSpeakers = () => {
    setIsPlayingTestSound(true);
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, audioContext.currentTime); // 440Hz A tone
    gain.gain.setValueAtTime(0.1, audioContext.currentTime);

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start();
    osc.stop(audioContext.currentTime + 1.2);

    setTimeout(() => {
      setIsPlayingTestSound(false);
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl max-h-[90vh] bg-[#12161f] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Audio & Camera Settings</h2>
            <button 
              onClick={onClose}
              className="p-2 text-text-muted hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
            
            {/* Device Error Alert Banner */}
            {deviceError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-amber-400 text-xs leading-relaxed shadow-lg"
              >
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold text-sm block text-amber-300 mb-0.5">Device Permission / Hardware Alert</span>
                  {deviceError}
                </div>
                <button 
                  onClick={initDevices}
                  className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg font-semibold text-amber-300 transition-colors shrink-0 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              </motion.div>
            )}

            {/* Video Preview Feed */}
            <div className="relative aspect-video max-h-52 w-full rounded-2xl bg-black/60 border border-white/10 overflow-hidden flex items-center justify-center shadow-inner mx-auto">
              <video 
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
              
              {/* Live Indicator overlay */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-2 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Camera Ready
              </div>
            </div>

            {/* Settings Options */}
            <div className="space-y-4">
              
              {/* Microphone Selector & Level Meter */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                    <Mic className="w-4 h-4 text-emerald-400" /> Microphone
                  </label>

                  {/* Level Meter (8 bars) */}
                  <div className="flex items-center gap-1">
                    {[10, 25, 40, 55, 70, 85, 95, 100].map((threshold, idx) => (
                      <div 
                        key={idx}
                        className={`w-3 h-1.5 rounded-sm transition-all duration-75 ${
                          audioLevel >= threshold ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <select 
                  value={selectedMic}
                  onChange={(e) => setSelectedMic(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                >
                  {audioDevices.length > 0 ? (
                    audioDevices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Microphone ${i + 1}`}
                      </option>
                    ))
                  ) : (
                    <option value="">Microphone Array (Default)</option>
                  )}
                </select>
              </div>

              {/* Speaker Selector & Test Sound */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-primary" /> Speakers
                  </label>

                  <button 
                    onClick={handleTestSpeakers}
                    disabled={isPlayingTestSound}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    {isPlayingTestSound ? "Testing..." : "Test Speakers"}
                  </button>
                </div>

                <select 
                  value={selectedSpeaker}
                  onChange={(e) => setSelectedSpeaker(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                >
                  {speakerDevices.length > 0 ? (
                    speakerDevices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Speakers (${i + 1})`}
                      </option>
                    ))
                  ) : (
                    <option value="">Communications - Speakers (Default)</option>
                  )}
                </select>
              </div>

              {/* Camera Selector */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                  <Video className="w-4 h-4 text-purple-400" /> Integrated Camera
                </label>

                <select 
                  value={selectedCam}
                  onChange={(e) => setSelectedCam(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                >
                  {videoDevices.length > 0 ? (
                    videoDevices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Camera ${i + 1}`}
                      </option>
                    ))
                  ) : (
                    <option value="">Integrated Camera (Default)</option>
                  )}
                </select>
              </div>

            </div>
          </div>

          {/* Action Footer (Always Visible at Bottom) */}
          <div className="flex items-center justify-between p-5 border-t border-white/10 bg-[#12161f] shrink-0">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-semibold text-text-muted hover:text-white transition-colors text-sm"
            >
              Back
            </button>
            <button 
              onClick={() => onStart({ micId: selectedMic, camId: selectedCam, speakerId: selectedSpeaker })}
              className="px-8 py-3 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center gap-2 text-sm cursor-pointer"
            >
              Start Interview <Check className="w-4 h-4 stroke-[3]" />
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
