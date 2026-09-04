'use client';

import React, { useState, useRef } from 'react';
import { Video, Download, StopCircle, Play, Sparkles, CheckCircle2, Film } from 'lucide-react';

interface LectureVideoRecorderProps {
  topic: string;
  teacherPersona: string;
}

export const LectureVideoRecorder: React.FC<LectureVideoRecorderProps> = ({
  topic,
  teacherPersona,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordDuration, setRecordDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startScreenRecording = async () => {
    try {
      recordedChunksRef.current = [];
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' } as any,
        audio: true,
      });

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm; codecs=vp9')
          ? 'video/webm; codecs=vp9'
          : 'video/webm',
      });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setIsRecording(true);
      setRecordDuration(0);

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting video recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const downloadVideo = () => {
    if (!recordedVideoUrl) return;
    const a = document.createElement('a');
    a.href = recordedVideoUrl;
    a.download = `${topic.replace(/\s+/g, '_')}_Video_Masterclass.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      {isRecording ? (
        <div className="flex items-center gap-2 bg-red-950/80 border border-red-500/50 px-3 py-1.5 rounded-xl text-red-200 text-xs font-semibold animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
          <span>REC {formatTime(recordDuration)}</span>
          <button
            onClick={stopRecording}
            className="ml-2 px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold"
          >
            Stop
          </button>
        </div>
      ) : recordedVideoUrl ? (
        <div className="flex items-center gap-2">
          <button
            onClick={downloadVideo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Lecture Video</span>
          </button>
          <button
            onClick={startScreenRecording}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
            title="Record New Video"
          >
            <Film className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={startScreenRecording}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-white/10 text-xs font-semibold transition-all shadow-md"
          title="Export and record full video masterclass"
        >
          <Film className="w-3.5 h-3.5 text-cyan-400" />
          <span>Record Lesson Video</span>
        </button>
      )}
    </div>
  );
};
