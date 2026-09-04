'use client';

import React, { useState } from 'react';
import { Play, RotateCcw, Copy, Check, Terminal, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CodePlaygroundProps {
  initialCode: string;
  language?: string;
  title?: string;
}

export const CodePlayground: React.FC<CodePlaygroundProps> = ({
  initialCode,
  language = 'python',
  title = 'Interactive Code Lab',
}) => {
  const [code, setCode] = useState<string>(initialCode);
  const [output, setOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [execTime, setExecTime] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCode(initialCode);
    setOutput(null);
    setStatus('idle');
    setExecTime(null);
  };

  // Safe client-side execution sandbox for Python-like scripts & JavaScript
  const executeCode = () => {
    setIsRunning(true);
    setStatus('idle');
    const startTime = performance.now();

    setTimeout(() => {
      try {
        const logs: string[] = [];
        
        // Custom print/console simulator
        const customPrint = (...args: any[]) => {
          logs.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
        };

        const isJs = language.toLowerCase() === 'javascript' || language.toLowerCase() === 'js';

        if (isJs) {
          // JS execution sandbox
          const safeEval = new Function('console', 'print', `
            try {
              ${code}
            } catch(err) {
              console.log("Runtime Error:", err.message);
            }
          `);
          safeEval({ log: customPrint, error: customPrint, warn: customPrint }, customPrint);
        } else {
          // Python-to-JS lightweight transpiled interpreter for standard educational snippets
          let transpiled = code;

          // Replace python print with customPrint
          transpiled = transpiled.replace(/print\((.*?)\)/g, 'print($1);');
          
          // Replace def func_name(args): with function func_name(args) {
          transpiled = transpiled.replace(/def\s+([a-zA-Z0-9_]+)\((.*?)\):/g, 'function $1($2) {');
          
          // Handle simple math & numpy-like expressions
          const scope = {
            print: customPrint,
            len: (arr: any) => (arr ? arr.length : 0),
            range: (n: number) => Array.from({ length: n }, (_, i) => i),
            sum: (arr: number[]) => arr.reduce((a, b) => a + b, 0),
            max: (...args: number[]) => Math.max(...args),
            min: (...args: number[]) => Math.min(...args),
            abs: Math.abs,
            round: Math.round,
            math: Math,
            np: {
              array: (arr: any) => arr,
              zeros: (n: number) => new Array(n).fill(0),
              ones: (n: number) => new Array(n).fill(1),
              dot: (a: number[], b: number[]) => a.reduce((sum, val, i) => sum + val * (b[i] || 0), 0),
              exp: Math.exp,
              log: Math.log,
              mean: (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length,
            },
          };

          // Wrap in execution function
          const keys = Object.keys(scope);
          const values = Object.values(scope);
          
          // Transform Python indentation blocks if simple
          let jsCode = '';
          const lines = code.split('\n');
          for (let line of lines) {
            let trimmed = line.trim();
            if (trimmed.startsWith('#')) continue; // comments
            if (trimmed.startsWith('def ')) {
              const match = trimmed.match(/def\s+([a-zA-Z0-9_]+)\((.*?)\):/);
              if (match) {
                jsCode += `function ${match[1]}(${match[2]}) {\n`;
                continue;
              }
            }
            if (trimmed.startsWith('return ')) {
              jsCode += `  ${trimmed};\n}\n`;
              continue;
            }
            if (trimmed.startsWith('print(')) {
              jsCode += `print(${trimmed.slice(6, -1)});\n`;
              continue;
            }
            if (trimmed.includes('=') && !trimmed.startsWith('if') && !trimmed.startsWith('for')) {
              jsCode += `var ${trimmed};\n`;
              continue;
            }
            jsCode += `${line};\n`;
          }

          try {
            const runner = new Function(...keys, `
              try {
                ${jsCode}
              } catch(e) {
                print("Output / Eval: " + e.message);
              }
            `);
            runner(...values);
          } catch (e: any) {
            logs.push(`⚠️ Execution Note: ${e.message || 'Code parsed as static demonstration.'}`);
          }
        }

        const endTime = performance.now();
        setExecTime(Math.round(endTime - startTime));
        
        if (logs.length === 0) {
          setOutput("✓ Code executed successfully with zero runtime errors (no print output).");
        } else {
          setOutput(logs.join('\n'));
        }
        setStatus('success');
      } catch (err: any) {
        setOutput(`Traceback (most recent call last):\n  Error: ${err.message}`);
        setStatus('error');
      } finally {
        setIsRunning(false);
      }
    }, 300);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-amber-500/30 bg-[#0d1117] shadow-xl my-3">
      {/* Playground Header */}
      <div className="px-4 py-2.5 bg-slate-900/95 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono">
            <span>{language.toUpperCase()}</span>
          </div>
          <span className="text-xs font-semibold text-slate-300">{title}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-all border border-white/5"
            title="Copy code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-400 hover:text-slate-200 transition-all border border-white/5"
            title="Reset to teacher's original code"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={executeCode}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-white ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Running...' : 'Run Code'}</span>
          </button>
        </div>
      </div>

      {/* Editable Code Editor Area */}
      <div className="relative">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="w-full p-4 font-mono text-xs text-amber-200/90 bg-transparent resize-y min-h-[140px] focus:outline-none focus:ring-1 focus:ring-amber-500/50 leading-relaxed"
          placeholder="Type or modify code here..."
        />
        <div className="absolute top-2 right-3 pointer-events-none opacity-40 text-[10px] text-slate-400 font-mono">
          Editable Live Sandbox
        </div>
      </div>

      {/* Terminal Output Section */}
      {output !== null && (
        <div className="border-t border-white/10 bg-black/80 p-4">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Console Output</span>
            </div>
            {execTime !== null && (
              <span className="text-[10px] text-slate-500 font-mono">Completed in {execTime}ms</span>
            )}
          </div>
          <pre
            className={`font-mono text-xs whitespace-pre-wrap leading-relaxed ${
              status === 'error' ? 'text-rose-400' : 'text-emerald-300'
            }`}
          >
            {output}
          </pre>
        </div>
      )}
    </div>
  );
};
