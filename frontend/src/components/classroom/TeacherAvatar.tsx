'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Sparkles,
  Play,
  Pause,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { getAudioFullUrl } from '@/lib/api';

export type AvatarEmotion = 'explaining' | 'thinking' | 'celebrating' | 'empathizing' | 'inquiring';

interface TeacherAvatarProps {
  persona: string;
  language: string;
  isSpeaking: boolean;
  audioUrl?: string | null;
  teacherScript?: string;
  emotion?: AvatarEmotion;
  onAudioEnded?: () => void;
  onPersonaChange?: (newPersona: string) => void;
}

export const TeacherAvatar: React.FC<TeacherAvatarProps> = ({
  persona,
  language,
  isSpeaking,
  audioUrl,
  teacherScript,
  emotion = 'explaining',
  onAudioEnded,
  onPersonaChange,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isPiP, setIsPiP] = useState(false);
  // Tracks whether the user has clicked Play at least once — permanently unlocks autoplay
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);
  const pendingPlayRef = useRef(false);

  // Avatar presets & visual characteristics
  const getAvatarDetails = () => {
    if (persona.includes('Nova')) {
      return {
        name: 'Dr. Nova',
        title: 'Intuitive & Concept-First Educator',
        accentColor: 'from-blue-500 to-indigo-600',
        borderColor: 'border-blue-500/40',
        avatarBg: 'bg-gradient-to-tr from-blue-900/60 to-indigo-800/40',
        hairColor: '#38bdf8',
        tag: 'Analogy Specialist',
      };
    } else if (persona.includes('Aryan')) {
      return {
        name: 'Prof. Aryan',
        title: 'Deep Socratic & First-Principles Guide',
        accentColor: 'from-emerald-500 to-teal-600',
        borderColor: 'border-emerald-500/40',
        avatarBg: 'bg-gradient-to-tr from-emerald-900/60 to-teal-800/40',
        hairColor: '#34d399',
        tag: 'Socratic Inquiry',
      };
    } else if (persona.includes('Maya')) {
      return {
        name: 'Maya',
        title: 'Energetic & Visual Master Instructor',
        accentColor: 'from-purple-500 to-pink-600',
        borderColor: 'border-purple-500/40',
        avatarBg: 'bg-gradient-to-tr from-purple-900/60 to-pink-800/40',
        hairColor: '#c084fc',
        tag: 'Visual Storyteller',
      };
    } else {
      return {
        name: 'Alex',
        title: 'Systems & Code Educator',
        accentColor: 'from-amber-500 to-orange-600',
        borderColor: 'border-amber-500/40',
        avatarBg: 'bg-gradient-to-tr from-amber-900/60 to-orange-800/40',
        hairColor: '#fbbf24',
        tag: 'Hands-on Architect',
      };
    }
  };

  const details = getAvatarDetails();

  // Natural Blinking Cycle
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
    }, 3600);
    return () => clearInterval(blinkInterval);
  }, []);

  // Lip-sync & speaking animation effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying || isSpeaking) {
      interval = setInterval(() => {
        setMouthOpen((prev) => !prev);
      }, 170);
    } else {
      setMouthOpen(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isSpeaking]);

  // Browser Web Speech API fallback
  const speakWithBrowserTTS = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#`_]/g, '').trim().slice(0, 2000);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = playbackSpeed;
      if (language.toLowerCase() === 'hindi' || language.toLowerCase() === 'hinglish') {
        utterance.lang = 'hi-IN';
      } else if (language.toLowerCase() === 'spanish') {
        utterance.lang = 'es-ES';
      } else {
        utterance.lang = 'en-US';
      }
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => { setIsPlaying(false); onAudioEnded?.(); };
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    } catch (e) {
      console.warn("SpeechSynthesis error:", e);
    }
  }, [language, playbackSpeed, onAudioEnded]);

  // Preload audio when URL changes; auto-play if already unlocked
  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    if (!audioUrl) {
      if (teacherScript && isSpeaking && audioUnlockedRef.current) {
        speakWithBrowserTTS(teacherScript);
      }
      return;
    }

    const fullUrl = getAudioFullUrl(audioUrl);
    setAudioReady(false);
    setAudioError(false);
    setIsPlaying(false);
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();

    audio.pause();
    audio.src = fullUrl;
    audio.muted = isMuted;
    audio.playbackRate = playbackSpeed;
    audio.load();

    const onCanPlay = () => {
      setAudioReady(true);
      setAudioError(false);
      if (audioUnlockedRef.current) {
        audio.play().then(() => setIsPlaying(true)).catch(() => {
          if (teacherScript) speakWithBrowserTTS(teacherScript);
        });
      }
    };
    const onError = () => {
      setAudioError(true);
      setAudioReady(false);
      if (audioUnlockedRef.current && teacherScript) {
        speakWithBrowserTTS(teacherScript);
      }
    };

    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('loadeddata', onCanPlay);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('loadeddata', onCanPlay);
      audio.removeEventListener('error', onError);
    };
  }, [audioUrl, teacherScript, isSpeaking, speakWithBrowserTTS]);

  // Play/Pause toggle — clicking permanently unlocks audio and guarantees sound
  const togglePlayAudio = () => {
    audioUnlockedRef.current = true;
    setAudioUnlocked(true);

    const audio = audioRef.current;

    // 1. If currently speaking via Web Speech API, toggle it
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      } else if (teacherScript) {
        speakWithBrowserTTS(teacherScript);
      }
      return;
    }

    // 2. If playing via HTML Audio Element, toggle it
    if (audio && isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    // 3. Start playback: Try Neural MP3 Audio first
    if (audio && audioUrl && !audioError) {
      audio.muted = isMuted;
      audio.playbackRate = playbackSpeed;
      audio.play()
        .then(() => {
          setIsPlaying(true);
          setAudioReady(true);
        })
        .catch((err) => {
          console.warn("Neural audio play failed, switching to browser TTS:", err);
          if (teacherScript) speakWithBrowserTTS(teacherScript);
        });
    } else if (teacherScript) {
      // 4. Fallback directly to Web Speech API
      speakWithBrowserTTS(teacherScript);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) audioRef.current.muted = !isMuted;
    if (!isMuted && typeof window !== 'undefined') window.speechSynthesis?.cancel();
    setIsMuted(!isMuted);
  };

  const changeSpeed = () => {
    const speeds = [0.75, 1.0, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  // Emotion icon & text badge
  const getEmotionBadge = () => {
    switch (emotion) {
      case 'celebrating':
        return { label: 'Celebrating Insight!', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'empathizing':
        return { label: 'Diagnosing Concept Trap', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'inquiring':
        return { label: 'Posing Socratic Challenge', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'thinking':
        return { label: 'Analyzing Reasoning...', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
      default:
        return { label: 'Teaching & Explaining', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
    }
  };

  const emotionInfo = getEmotionBadge();

  return (
    <div className={`relative flex flex-col rounded-2xl overflow-hidden glass-panel border ${details.borderColor} shadow-2xl p-4 transition-all duration-300 ${isPiP ? 'fixed bottom-6 right-6 w-80 z-50 shadow-2xl border-blue-400/60' : ''}`}>
      {/* Hidden HTML Audio Element */}
      <audio
        ref={audioRef}
        preload="auto"
        onEnded={() => { setIsPlaying(false); onAudioEnded?.(); }}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onError={() => {
          setAudioError(true);
          setIsPlaying(false);
          if (audioUnlockedRef.current && teacherScript) speakWithBrowserTTS(teacherScript);
        }}
      />

      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            {(isPlaying || isSpeaking) && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isPlaying || isSpeaking ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {isPlaying ? 'Speaking Aloud' : isSpeaking ? 'Teacher Live' : 'Ready'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={changeSpeed}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-colors"
            title="Adjust Speech Playback Speed"
          >
            {playbackSpeed}x
          </button>
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsPiP(!isPiP)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={isPiP ? 'Exit Mini PiP' : 'Mini Picture-in-Picture'}
          >
            {isPiP ? <Minimize2 className="w-4 h-4 text-cyan-400" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Emotion State Sub-Badge */}
      <div className="flex items-center justify-between mt-2 px-1">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${emotionInfo.color}`}>
          {emotionInfo.label}
        </span>
        <span className="text-[10px] text-cyan-300 font-semibold">{language}</span>
      </div>

      {/* Main Animated Stage */}
      <div className="relative my-3 flex flex-col items-center justify-center min-h-[210px]">
        {/* Dynamic Glowing Aura */}
        <div className={`absolute w-44 h-44 rounded-full bg-gradient-to-r ${details.accentColor} opacity-20 blur-2xl transition-all duration-500 ${(isPlaying || isSpeaking) ? 'scale-125 opacity-40' : 'scale-90'}`} />

        {/* Animated Avatar Face & Expression */}
        <div className={`relative z-10 w-32 h-32 rounded-full ${details.avatarBg} border-2 ${details.borderColor} flex items-center justify-center shadow-inner overflow-hidden ${(isPlaying || isSpeaking) ? 'avatar-speaking' : ''}`}>
          <svg className="w-24 h-24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Hair Background */}
            <circle cx="50" cy="46" r="32" fill={details.hairColor} opacity="0.4" />
            <circle cx="50" cy="48" r="26" fill="#f8fafc" />

            {/* Eyes (Open vs Blinking) */}
            {isBlinking ? (
              <>
                <line x1="37" y1="45" x2="45" y2="45" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="55" y1="45" x2="63" y2="45" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="41" cy="45" r="3.5" fill="#0f172a" />
                <circle cx="59" cy="45" r="3.5" fill="#0f172a" />
                <circle cx="42.5" cy="43.5" r="1.2" fill="#ffffff" />
                <circle cx="60.5" cy="43.5" r="1.2" fill="#ffffff" />
              </>
            )}

            {/* Eyebrows (Dynamic by Emotion) */}
            {emotion === 'celebrating' ? (
              <>
                <path d="M 37 36 Q 41 33 45 36" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
                <path d="M 55 36 Q 59 33 63 36" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
              </>
            ) : emotion === 'empathizing' ? (
              <>
                <path d="M 37 38 Q 41 40 45 37" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
                <path d="M 55 37 Q 59 40 63 38" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
              </>
            ) : (
              <>
                <path d="M 37 39 Q 41 37 45 39" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
                <path d="M 55 39 Q 59 37 63 39" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
              </>
            )}

            {/* Nose */}
            <path d="M 50 47 L 49 52 L 52 52" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />

            {/* Animated Mouth (Speaking state vs Smiling/Idle state) */}
            {mouthOpen ? (
              <ellipse cx="50" cy="60" rx="5.5" ry="4.8" fill="#ef4444" />
            ) : emotion === 'celebrating' ? (
              <path d="M 42 57 Q 50 66 58 57" stroke="#ef4444" strokeWidth="2.8" strokeLinecap="round" />
            ) : (
              <path d="M 44 58 Q 50 63 56 58" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
            )}

            {/* Glasses */}
            <rect x="34" y="40" width="14" height="10" rx="2" stroke="#475569" strokeWidth="1.8" fill="none" />
            <rect x="52" y="40" width="14" height="10" rx="2" stroke="#475569" strokeWidth="1.8" fill="none" />
            <line x1="48" y1="45" x2="52" y2="45" stroke="#475569" strokeWidth="1.8" />

            {/* Collar */}
            <path d="M 28 82 Q 50 72 72 82 L 80 100 L 20 100 Z" fill="#1e293b" />
            <path d="M 42 76 L 50 86 L 58 76" fill="#3b82f6" opacity="0.6" />
          </svg>
        </div>

        {/* Real-time Voice Waveform Visualizer */}
        <div className="flex items-center justify-center gap-1.5 mt-3 h-7">
          {(isPlaying || isSpeaking) ? (
            <>
              <span className="w-1 bg-cyan-400 rounded-full animate-wave-1"></span>
              <span className="w-1 bg-blue-400 rounded-full animate-wave-2"></span>
              <span className="w-1 bg-purple-400 rounded-full animate-wave-3"></span>
              <span className="w-1 bg-pink-400 rounded-full animate-wave-4"></span>
              <span className="w-1 bg-emerald-400 rounded-full animate-wave-5"></span>
            </>
          ) : (
            <div className="flex items-center gap-1 opacity-40">
              <span className="w-1 h-1.5 bg-slate-500 rounded-full"></span>
              <span className="w-1 h-1.5 bg-slate-500 rounded-full"></span>
              <span className="w-1 h-1.5 bg-slate-500 rounded-full"></span>
              <span className="w-1 h-1.5 bg-slate-500 rounded-full"></span>
            </div>
          )}
        </div>

        {/* Identity & Persona Switcher */}
        <div className="text-center mt-1">
          <h3 className="text-base font-bold text-white flex items-center justify-center gap-1.5">
            {details.name}
            <Sparkles className="w-4 h-4 text-cyan-400 inline" />
          </h3>
          <p className="text-xs text-slate-400">{details.title}</p>
        </div>
      </div>

      {/* Spoken Lecture Script Subtitle Box */}
      {teacherScript && (
        <div className="mt-1 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 leading-relaxed max-h-24 overflow-y-auto">
          <p className="italic text-slate-300">"{teacherScript}"</p>
        </div>
      )}

      {/* ─── PROMINENT PLAY BUTTON ─── always clickable when lesson content is present */}
      {(audioUrl || teacherScript) && (
        <button
          id="teacher-play-btn"
          onClick={togglePlayAudio}
          className={`mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 cursor-pointer ${
            !audioUnlocked
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white animate-pulse shadow-blue-600/40'
              : isPlaying
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
          }`}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
          {isPlaying
            ? 'Pause Voice'
            : !audioUnlocked
            ? '▶ Click to Hear the Teacher'
            : 'Play / Replay Voice'}
        </button>
      )}

      {/* Status Row */}
      <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
        <button onClick={toggleMute} className="flex items-center gap-1 hover:text-white transition-colors">
          {isMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3" />}
          {isMuted ? 'Unmuted?' : 'Muted? Click'}
        </button>
        {audioError && <span className="text-amber-400 text-[9px]">⚠ Using browser voice</span>}
        {audioReady && !audioError && <span className="text-emerald-400 text-[9px]">✓ Neural audio ready</span>}
        <span className="tracking-tight">Neural Voice · {playbackSpeed}x</span>
      </div>
    </div>
  );
};
