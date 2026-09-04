'use client';

import React, { useState } from 'react';
import { Upload, FileText, Sparkles, CheckCircle2, ArrowRight, BookOpen } from 'lucide-react';
import { uploadDocument } from '@/lib/api';
import { DocumentUploadResponse } from '@/lib/types';

interface DocumentUploaderProps {
  onTopicOrDocReady: (params: { topic: string; docId?: string; rawNotes?: string }) => void;
}

const PRESET_TOPICS = [
  {
    title: "Transformer Architecture & Self-Attention",
    category: "AI / Deep Learning",
    desc: "First-principles breakdown of Query, Key, Value vectors and multi-head attention.",
  },
  {
    title: "Quantum Superposition & Qubits",
    category: "Quantum Physics",
    desc: "Bloch sphere intuition, wave function collapse, and quantum entanglement.",
  },
  {
    title: "CRISPR-Cas9 Gene Editing Mechanism",
    category: "Biotechnology",
    desc: "Guide RNA targeting, PAM sequence recognition, and double-strand DNA cleavage.",
  },
  {
    title: "Dynamic Programming: 0/1 Knapsack",
    category: "Computer Science",
    desc: "Optimal substructure, overlapping subproblems, and memoization tables.",
  },
  {
    title: "Special Relativity & Time Dilation",
    category: "Physics",
    desc: "Lorentz transformations, invariant speed of light, and twin paradox.",
  },
  {
    title: "Photosynthesis & Light Reactions",
    category: "Biology",
    desc: "Photosystem II, electron transport chain, ATP synthesis, and Calvin cycle.",
  }
];

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onTopicOrDocReady }) => {
  const [activeMode, setActiveMode] = useState<'topic' | 'file' | 'preset'>('preset');
  const [topicInput, setTopicInput] = useState('');
  const [rawNotesInput, setRawNotesInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<DocumentUploadResponse | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const res = await uploadDocument(file);
      setUploadResult(res);
      setTopicInput(res.filename.replace(/\.[^/.]+$/, ''));
    } catch (err: any) {
      setUploadError(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleProceed = () => {
    if (uploadResult) {
      onTopicOrDocReady({
        topic: topicInput || uploadResult.filename,
        docId: uploadResult.doc_id,
        rawNotes: uploadResult.summary,
      });
    } else if (topicInput.trim()) {
      onTopicOrDocReady({
        topic: topicInput.trim(),
        rawNotes: rawNotesInput.trim(),
      });
    }
  };

  const selectPreset = (preset: typeof PRESET_TOPICS[0]) => {
    setTopicInput(preset.title);
    setRawNotesInput(preset.desc);
    onTopicOrDocReady({
      topic: preset.title,
      rawNotes: preset.desc,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-white/10 max-w-md mx-auto">
        <button
          onClick={() => setActiveMode('preset')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeMode === 'preset'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Preset Masterclasses
        </button>
        <button
          onClick={() => setActiveMode('file')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeMode === 'file'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Upload PDF / Notes
        </button>
        <button
          onClick={() => setActiveMode('topic')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeMode === 'topic'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Any Custom Topic
        </button>
      </div>

      {/* Preset Topics View */}
      {activeMode === 'preset' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRESET_TOPICS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => selectPreset(preset)}
              className="text-left p-5 rounded-2xl glass-card border border-white/5 hover:border-blue-500/50 hover:bg-slate-800/80 transition-all flex flex-col gap-2 group shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  {preset.category}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                {preset.title}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                {preset.desc}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Upload File / Notes View */}
      {activeMode === 'file' && (
        <div className="flex flex-col gap-4">
          <label className="border-2 border-dashed border-white/15 hover:border-blue-500/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-900/40 hover:bg-slate-900/70">
            <input
              type="file"
              accept=".pdf,.txt,.md"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
              <Upload className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              {isUploading ? 'Ingesting & Chunking Document...' : 'Upload PDF, Notes, or Research Paper'}
            </h4>
            <p className="text-xs text-slate-400 max-w-sm">
              Drag & drop your textbook chapter, lecture slides, or PDF notes. VidGuru AI extracts key concepts and creates an adaptive syllabus.
            </p>
          </label>

          {uploadError && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
              {uploadError}
            </div>
          )}

          {uploadResult && (
            <div className="p-4 rounded-2xl glass-card border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white">{uploadResult.filename}</h5>
                  <p className="text-[11px] text-slate-400">
                    {uploadResult.num_chunks} semantic chunks indexed • RAG Ready
                  </p>
                </div>
              </div>
              <button
                onClick={handleProceed}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
              >
                <span>Select & Proceed</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Custom Topic Input View */}
      {activeMode === 'topic' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              What would you like to master today?
            </label>
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="e.g. Backpropagation in Neural Networks, Calculus: Chain Rule, Rust Borrow Checker..."
              className="glass-input px-4 py-3.5 rounded-2xl text-sm text-white focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Optional Context, Notes, or Specific Focus Areas
            </label>
            <textarea
              rows={3}
              value={rawNotesInput}
              onChange={(e) => setRawNotesInput(e.target.value)}
              placeholder="Paste any textbook notes, syllabus requirements, or concepts you struggle with..."
              className="glass-input px-4 py-3 rounded-2xl text-xs text-white focus:outline-none resize-none"
            />
          </div>

          <button
            onClick={handleProceed}
            disabled={!topicInput.trim()}
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-40"
          >
            <span>Proceed to Learner Profile</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
