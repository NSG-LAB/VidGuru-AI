'use client';

import React, { useEffect, useRef, useState } from 'react';
import { VisualContent } from '@/lib/types';
import { getImageFullUrl } from '@/lib/api';
import katex from 'katex';
import mermaid from 'mermaid';
import {
  Code,
  Sigma,
  GitGraph,
  Lightbulb,
  CheckCircle2,
  Copy,
  Check,
  Maximize2,
  Layers,
  Sparkles,
  Sliders,
  ImageIcon,
  ZoomIn,
  AlertCircle
} from 'lucide-react';
import { CodePlayground } from './CodePlayground';
import { InteractiveMathPlotter } from './InteractiveMathPlotter';
import { WhiteboardCanvas } from './WhiteboardCanvas';

interface SmartWhiteboardProps {
  stepTitle: string;
  stepType: string;
  visuals?: VisualContent[];
  topic: string;
  isLoading?: boolean;
}

export const SmartWhiteboard: React.FC<SmartWhiteboardProps> = ({
  stepTitle,
  stepType,
  visuals = [],
  topic,
  isLoading = false,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [showPlotter, setShowPlotter] = useState<boolean>(false);
  const [imageLoadStates, setImageLoadStates] = useState<Record<number, 'loading' | 'loaded' | 'error'>>({});
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const mermaidContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'system-ui, sans-serif',
      themeVariables: {
        darkMode: true,
        background: '#0f172a',
        primaryColor: '#3b82f6',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#60a5fa',
        lineColor: '#94a3b8',
        secondaryColor: '#8b5cf6',
        tertiaryColor: '#10b981',
      },
    });
  }, []);

  const renderKatex = (mathString: string) => {
    try {
      return {
        __html: katex.renderToString(mathString, {
          displayMode: true,
          throwOnError: false,
        }),
      };
    } catch (e) {
      return { __html: `<code>${mathString}</code>` };
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl glass-panel border border-white/10 shadow-2xl overflow-hidden relative">
      {/* Whiteboard Top Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900/90 border-b border-white/10 z-20">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {stepType.replace('_', ' ')}
              </span>
              <h2 className="text-sm font-semibold text-white truncate max-w-md">{stepTitle}</h2>
            </div>
            <p className="text-[11px] text-slate-400">Synchronized Interactive Blackboard</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Whiteboard Chalk / Drawing Layer */}
          <WhiteboardCanvas />

          {/* Visual Switcher Tabs if multiple visuals exist */}
          {visuals.length > 1 && (
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/5">
              {visuals.map((v, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`px-3 py-1 text-xs rounded-lg transition-all font-medium ${
                    activeTab === idx
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {v.type === 'latex' ? 'Equation' : v.type === 'mermaid' ? 'Architecture' : v.type === 'code' ? 'Code' : v.type === 'image' ? 'Illustration' : v.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-slate-950/90 via-slate-900/60 to-slate-950/90 relative">
        {/* Subtle grid backdrop for blackboard feel */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/30 animate-pulse">
                <Sparkles className="w-8 h-8 animate-spin" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500"></span>
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Generating Interactive Blackboard...</h3>
            <p className="text-sm text-cyan-300 font-medium mb-1">{stepTitle || topic}</p>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Synthesizing LaTeX equations, concept maps, and intuitive real-world analogies tailored to your curriculum.
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        ) : visuals.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 animate-pulse">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Dynamic Blackboard Ready</h3>
            <p className="text-sm text-slate-400 max-w-md">
              The teacher is breaking down the first principles of {topic}. Diagrams, mathematical formulations, and code will materialize here in real time.
            </p>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col gap-6">
            {visuals.map((vis, idx) => {
              if (visuals.length > 1 && activeTab !== idx) return null;

              return (
                <div
                  key={idx}
                  className="rounded-2xl glass-card border border-white/10 p-6 shadow-xl transition-all"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/5">
                    <div className="flex items-center gap-2.5">
                      {vis.type === 'latex' && (
                        <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          <Sigma className="w-5 h-5" />
                        </div>
                      )}
                      {vis.type === 'mermaid' && (
                        <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <GitGraph className="w-5 h-5" />
                        </div>
                      )}
                      {vis.type === 'code' && (
                        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <Code className="w-5 h-5" />
                        </div>
                      )}
                      {(vis.type === 'analogy_box' || vis.type === 'concept_card') && (
                        <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                          <Lightbulb className="w-5 h-5" />
                        </div>
                      )}
                      {(vis.type === 'concept_card' || vis.type === 'key_takeaways') && (
                        <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )}
                      {vis.type === 'image' && (
                        <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}

                      <div>
                        <h4 className="text-base font-bold text-white">{vis.title}</h4>
                        {vis.explanation && (
                          <p className="text-xs text-slate-400">{vis.explanation}</p>
                        )}
                      </div>
                    </div>

                    {vis.type === 'latex' && (
                      <button
                        onClick={() => setShowPlotter(!showPlotter)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          showPlotter
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/20'
                        }`}
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>{showPlotter ? 'Hide Grapher' : 'Interactive Grapher'}</span>
                      </button>
                    )}
                  </div>

                  {/* Body Content by Visual Type */}
                  {vis.type === 'latex' && (
                    <div>
                      <div className="p-6 rounded-xl bg-slate-950/80 border border-purple-500/20 text-purple-200 overflow-x-auto my-2">
                        <div
                          className="text-lg md:text-xl text-center"
                          dangerouslySetInnerHTML={renderKatex(vis.content)}
                        />
                      </div>

                      {/* Interactive Math Function Simulation */}
                      {showPlotter && (
                        <InteractiveMathPlotter
                          mathExpression={vis.content}
                          title={`Visual Simulation: ${vis.title}`}
                        />
                      )}
                    </div>
                  )}

                  {vis.type === 'mermaid' && (
                    <div className="p-6 rounded-xl bg-slate-950/80 border border-emerald-500/20 overflow-x-auto my-2 flex justify-center">
                      <pre className="mermaid text-xs font-mono text-emerald-300">
                        {vis.content}
                      </pre>
                    </div>
                  )}

                  {vis.type === 'code' && (
                    <CodePlayground
                      initialCode={vis.content}
                      language={vis.language || 'python'}
                      title={vis.title || 'Live Interactive Sandbox'}
                    />
                  )}

                  {vis.type === 'analogy_box' && (
                    <div className="p-5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-100 flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300 shrink-0">
                        <Lightbulb className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-sm text-cyan-200 mb-1">Intuitive Real-World Analogy</h5>
                        <p className="text-xs text-slate-200 leading-relaxed">{vis.content}</p>
                      </div>
                    </div>
                  )}

                  {(vis.type === 'concept_card' || vis.type === 'key_takeaways') && (
                    <div className="p-5 rounded-xl bg-slate-900/60 border border-white/5 text-slate-200 text-sm leading-relaxed whitespace-pre-line">
                      {vis.content}
                    </div>
                  )}

                  {vis.type === 'image' && (
                    <div className="rounded-xl bg-slate-950/80 border border-rose-500/20 overflow-hidden my-2 relative">
                      {/* Loading Skeleton */}
                      {imageLoadStates[idx] !== 'loaded' && imageLoadStates[idx] !== 'error' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-10">
                          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-400 mb-3 animate-pulse">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                          <p className="text-xs text-slate-400 animate-pulse">Generating AI illustration...</p>
                          <div className="mt-3 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce" />
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:0.4s]" />
                          </div>
                        </div>
                      )}

                      {/* Error State */}
                      {imageLoadStates[idx] === 'error' && (
                        <div className="p-8 flex flex-col items-center justify-center text-center">
                          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-3">
                            <AlertCircle className="w-6 h-6" />
                          </div>
                          <p className="text-xs text-red-300 font-medium mb-1">Image could not be loaded</p>
                          <p className="text-[10px] text-slate-500 max-w-xs">{vis.content || vis.image_prompt}</p>
                        </div>
                      )}

                      {/* Actual Image */}
                      {vis.image_url && (
                        <div className="relative group">
                          <img
                            src={getImageFullUrl(vis.image_url)}
                            alt={vis.title || 'Educational illustration'}
                            className={`w-full h-auto max-h-[500px] object-contain transition-opacity duration-500 ${
                              imageLoadStates[idx] === 'loaded' ? 'opacity-100' : 'opacity-0'
                            }`}
                            onLoad={() => setImageLoadStates(prev => ({ ...prev, [idx]: 'loaded' }))}
                            onError={() => setImageLoadStates(prev => ({ ...prev, [idx]: 'error' }))}
                          />
                          {/* Zoom Button Overlay */}
                          {imageLoadStates[idx] === 'loaded' && (
                            <button
                              onClick={() => setExpandedImage(getImageFullUrl(vis.image_url))}
                              className="absolute top-3 right-3 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white/70 hover:text-white transition-all opacity-0 group-hover:opacity-100 border border-white/10 backdrop-blur-sm"
                              title="View full size"
                            >
                              <ZoomIn className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Image Caption */}
                      {vis.explanation && imageLoadStates[idx] === 'loaded' && (
                        <div className="px-4 py-3 bg-slate-900/60 border-t border-white/5">
                          <p className="text-xs text-slate-400 leading-relaxed">
                            <span className="font-semibold text-rose-300">Figure: </span>
                            {vis.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fullscreen Image Modal */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 cursor-pointer"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full">
            <img
              src={expandedImage}
              alt="Expanded educational illustration"
              className="w-full h-full object-contain rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900/80 hover:bg-red-600 text-white text-xs font-bold transition-all border border-white/10"
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
