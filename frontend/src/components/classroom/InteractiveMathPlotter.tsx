'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Sliders, RefreshCw, Eye, Sparkles } from 'lucide-react';

interface InteractiveMathPlotterProps {
  initialFunction?: 'sigmoid' | 'relu' | 'loss' | 'sine' | 'exp';
  title?: string;
  mathExpression?: string;
}

export const InteractiveMathPlotter: React.FC<InteractiveMathPlotterProps> = ({
  initialFunction = 'sigmoid',
  title = 'Interactive 2D Function Visualizer',
  mathExpression = '\\sigma(z) = \\frac{1}{1 + e^{-w \\cdot x}}',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedFunc, setSelectedFunc] = useState<'sigmoid' | 'relu' | 'loss' | 'sine' | 'exp'>(initialFunction);
  const [paramW, setParamW] = useState<number>(1.0);
  const [paramB, setParamB] = useState<number>(0.0);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw Grid & Axes
    const centerX = width / 2;
    const centerY = height / 2;
    const scaleX = width / 12; // -6 to +6
    const scaleY = height / 4; // -2 to +2

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    for (let x = -6; x <= 6; x += 1) {
      const px = centerX + x * scaleX;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.stroke();
    }

    for (let y = -2; y <= 2; y += 0.5) {
      const py = centerY - y * scaleY;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;

    // X Axis
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Y Axis
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText('x', width - 15, centerY - 8);
    ctx.fillText('y', centerX + 8, 15);
    ctx.fillText('0', centerX + 4, centerY + 12);

    // Function evaluator
    const evalY = (x: number): number => {
      const z = paramW * x + paramB;
      switch (selectedFunc) {
        case 'sigmoid':
          return 1 / (1 + Math.exp(-z));
        case 'relu':
          return Math.max(0, z);
        case 'loss':
          return 0.5 * Math.pow(x - paramW, 2) + paramB;
        case 'sine':
          return Math.sin(z) * paramW;
        case 'exp':
          return Math.exp(-Math.abs(z));
        default:
          return x;
      }
    };

    // Draw Curve with vibrant gradient
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#818cf8');
    gradient.addColorStop(0.5, '#38bdf8');
    gradient.addColorStop(1, '#34d399');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.beginPath();

    let started = false;
    for (let px = 0; px <= width; px += 2) {
      const x = (px - centerX) / scaleX;
      const y = evalY(x);
      const py = centerY - y * scaleY;

      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // Draw active parameter point if hover exists
    if (hoverCoord) {
      const px = centerX + hoverCoord.x * scaleX;
      const py = centerY - hoverCoord.y * scaleY;

      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  };

  useEffect(() => {
    drawGraph();
  }, [selectedFunc, paramW, paramB, hoverCoord]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const scaleX = width / 12;

    const x = (px - centerX) / scaleX;
    const z = paramW * x + paramB;
    let y = 0;
    switch (selectedFunc) {
      case 'sigmoid':
        y = 1 / (1 + Math.exp(-z));
        break;
      case 'relu':
        y = Math.max(0, z);
        break;
      case 'loss':
        y = 0.5 * Math.pow(x - paramW, 2) + paramB;
        break;
      case 'sine':
        y = Math.sin(z) * paramW;
        break;
      case 'exp':
        y = Math.exp(-Math.abs(z));
        break;
    }
    setHoverCoord({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
  };

  return (
    <div className="rounded-xl overflow-hidden border border-purple-500/30 bg-slate-950/90 shadow-xl my-3">
      {/* Header */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">{title}</h4>
            <p className="text-[10px] text-slate-400">Real-Time Parameter Simulation</p>
          </div>
        </div>

        {/* Function Selector */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-white/5">
          {(['sigmoid', 'relu', 'loss', 'sine', 'exp'] as const).map((fn) => (
            <button
              key={fn}
              onClick={() => setSelectedFunc(fn)}
              className={`px-2 py-0.5 text-[11px] rounded font-medium transition-all ${
                selectedFunc === fn
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {fn.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative p-4 flex flex-col items-center">
        <canvas
          ref={canvasRef}
          width={480}
          height={200}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverCoord(null)}
          className="w-full max-w-[500px] h-[200px] rounded-lg bg-slate-950 border border-white/5 cursor-crosshair"
        />

        {/* Live Coordinate Overlay */}
        {hoverCoord && (
          <div className="absolute top-6 left-6 px-2.5 py-1 rounded bg-black/80 border border-white/10 text-[11px] font-mono text-cyan-300 backdrop-blur-sm">
            x: <span className="text-white font-bold">{hoverCoord.x}</span>, y: <span className="text-white font-bold">{hoverCoord.y}</span>
          </div>
        )}
      </div>

      {/* Interactive Sliders */}
      <div className="px-6 py-3 bg-slate-900/60 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div>
          <div className="flex justify-between text-slate-300 mb-1">
            <span className="font-mono">Weight / Slope (w):</span>
            <span className="font-mono text-purple-300 font-bold">{paramW.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="-3"
            max="3"
            step="0.1"
            value={paramW}
            onChange={(e) => setParamW(parseFloat(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-slate-300 mb-1">
            <span className="font-mono">Bias / Offset (b):</span>
            <span className="font-mono text-purple-300 font-bold">{paramB.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="-2"
            max="2"
            step="0.1"
            value={paramB}
            onChange={(e) => setParamB(parseFloat(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
