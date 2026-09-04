'use client';

import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Highlighter, Eraser, Trash2, Download, Eye, EyeOff } from 'lucide-react';

export const WhiteboardCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [color, setColor] = useState<string>('#38bdf8'); // Sky blue chalk
  const [lineWidth, setLineWidth] = useState<number>(3);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const colors = ['#38bdf8', '#34d399', '#f43f5e', '#fbbf24', '#c084fc', '#ffffff'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }
  }, [isVisible]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 20;
    } else if (tool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color + '40'; // 25% opacity
      ctx.lineWidth = 14;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <>
      {/* Floating Canvas Toggle Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsVisible(!isVisible)}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-xl font-medium border transition-all ${
            isVisible
              ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/30'
              : 'bg-slate-800 text-slate-300 border-white/10 hover:bg-slate-700'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>{isVisible ? 'Hide Drawing Layer' : 'Chalk / Notes'}</span>
        </button>
      </div>

      {/* Floating Canvas Layer */}
      {isVisible && (
        <div className="absolute inset-0 z-30 pointer-events-none">
          {/* Drawing Toolbar */}
          <div className="absolute top-4 right-4 z-40 flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/95 border border-white/10 shadow-2xl backdrop-blur-md pointer-events-auto">
            {/* Tool Selection */}
            <div className="flex items-center gap-1 border-r border-white/10 pr-2">
              <button
                onClick={() => setTool('pen')}
                className={`p-1.5 rounded-lg transition-colors ${
                  tool === 'pen' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Neon Chalk Pen"
              >
                <PenTool className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTool('highlighter')}
                className={`p-1.5 rounded-lg transition-colors ${
                  tool === 'highlighter' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Highlighter"
              >
                <Highlighter className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTool('eraser')}
                className={`p-1.5 rounded-lg transition-colors ${
                  tool === 'eraser' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Eraser"
              >
                <Eraser className="w-4 h-4" />
              </button>
            </div>

            {/* Colors */}
            <div className="flex items-center gap-1 border-r border-white/10 pr-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    if (tool === 'eraser') setTool('pen');
                  }}
                  className={`w-5 h-5 rounded-full transition-transform ${
                    color === c && tool !== 'eraser' ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={clearCanvas}
                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors"
                title="Clear All Drawings"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Actual Drawing HTML5 Canvas */}
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full h-full pointer-events-auto cursor-crosshair"
          />
        </div>
      )}
    </>
  );
};
