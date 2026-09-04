'use client';

import React, { useState, useEffect } from 'react';
import { FormativeQuestion } from '@/lib/types';
import {
  Mic,
  MicOff,
  Send,
  HelpCircle,
  MessageSquare,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

interface InteractionPanelProps {
  question?: FormativeQuestion | null;
  onSubmitAnswer: (response: string, isAudio: boolean) => void;
  onAskDoubt: (doubt: string) => void;
  isEvaluating: boolean;
  activeDoubtAnswer?: { teacher_answer: string; persona: string } | null;
}

export const InteractionPanel: React.FC<InteractionPanelProps> = ({
  question,
  onSubmitAnswer,
  onAskDoubt,
  isEvaluating,
  activeDoubtAnswer,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [doubtText, setDoubtText] = useState('');
  const [isDoubtOpen, setIsDoubtOpen] = useState(false);

  // Web Speech API STT handler
  useEffect(() => {
    let recognition: any = null;
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };
    }

    if (isRecording && recognition) {
      try {
        recognition.start();
      } catch (e) {
        console.error(e);
      }
    }

    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {}
      }
    };
  }, [isRecording]);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const handleSend = () => {
    const answer = selectedOption || inputText;
    if (!answer.trim()) return;
    onSubmitAnswer(answer, false);
    setInputText('');
    setSelectedOption(null);
  };

  const handleDoubtSubmit = () => {
    if (!doubtText.trim()) return;
    onAskDoubt(doubtText);
    setDoubtText('');
  };

  if (!question) {
    return (
      <div className="rounded-2xl glass-panel border border-white/10 p-5 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Teacher is Explaining...</h4>
            <p className="text-xs text-slate-400">A formative checkpoint challenge will appear once the concept is delivered.</p>
          </div>
        </div>

        <button
          onClick={() => setIsDoubtOpen(!isDoubtOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-cyan-500/20 transition-all"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Ask Live Doubt</span>
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl glass-panel border border-white/10 p-5 shadow-2xl flex flex-col gap-4">
      {/* Question Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shrink-0 shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Checkpoint Challenge • {question.bloom_level || 'Apply'}
              </span>
              <span className="text-xs text-slate-400 font-medium">Socratic Check</span>
            </div>
            <p className="text-sm md:text-base font-semibold text-white leading-relaxed">
              {question.prompt}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {question.hints && question.hints.length > 0 && (
            <button
              onClick={() => setShowHints(!showHints)}
              className={`p-2 rounded-xl transition-all ${
                showHints ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Socratic Hint"
            >
              <Lightbulb className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setIsDoubtOpen(!isDoubtOpen)}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
            title="Ask Teacher a Doubt"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Socratic Hints Dropdown */}
      {showHints && question.hints && (
        <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 flex flex-col gap-1.5">
          <div className="font-semibold flex items-center gap-1.5 text-amber-300">
            <Lightbulb className="w-3.5 h-3.5" /> Socratic Thinking Scaffolds:
          </div>
          {question.hints.map((h, idx) => (
            <div key={idx} className="text-slate-200 pl-5 relative before:content-['•'] before:absolute before:left-2 before:text-amber-400">
              {h}
            </div>
          ))}
        </div>
      )}

      {/* Live Doubt Dialogue Box if opened */}
      {isDoubtOpen && (
        <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Ask a Live Doubt to AI Teacher
            </h5>
            <button onClick={() => setIsDoubtOpen(false)} className="text-xs text-slate-400 hover:text-white">Close</button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={doubtText}
              onChange={(e) => setDoubtText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDoubtSubmit()}
              placeholder="e.g. Can you explain why the derivative equals zero here?"
              className="flex-1 glass-input px-3 py-2 rounded-lg text-xs text-white focus:outline-none"
            />
            <button
              onClick={handleDoubtSubmit}
              className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
            >
              Ask
            </button>
          </div>
          {activeDoubtAnswer && (
            <div className="p-3 rounded-lg bg-slate-950 border border-white/5 text-xs text-slate-200">
              <span className="font-bold text-cyan-400">{activeDoubtAnswer.persona}: </span>
              {activeDoubtAnswer.teacher_answer}
            </div>
          )}
        </div>
      )}

      {/* Multiple Choice Options (if available) */}
      {question.options && question.options.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-1">
          {question.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedOption(opt)}
              className={`text-left p-3.5 rounded-xl text-xs font-medium border transition-all ${
                selectedOption === opt
                  ? 'bg-blue-600/30 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-900/60 border-white/5 text-slate-300 hover:border-white/20 hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                  selectedOption === opt ? 'bg-blue-500 text-white border-blue-400' : 'border-slate-600 text-slate-400'
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1">{opt}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Voice and Text Input Area */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
        <button
          onClick={toggleRecording}
          className={`p-3 rounded-xl transition-all flex items-center justify-center shrink-0 ${
            isRecording
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 animate-pulse'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-white/10'
          }`}
          title={isRecording ? 'Listening (Click to stop)' : 'Answer by Voice (Whisper STT)'}
        >
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              isRecording
                ? 'Listening to your voice... Speak your answer now'
                : question.options
                ? 'Or type your custom intuition / reasoning...'
                : 'Explain your reasoning or answer here...'
            }
            className="w-full glass-input px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none"
            disabled={isEvaluating}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={isEvaluating || (!inputText.trim() && !selectedOption)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-500/25 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {isEvaluating ? (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              <span>Diagnosing...</span>
            </div>
          ) : (
            <>
              <span>Submit Answer</span>
              <Send className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
