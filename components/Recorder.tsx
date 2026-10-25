'use client';
import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface RecorderProps {
  surahNumber: number;
  ayahNumber: number;
  enableEcho: boolean; // NEW PROP
  onRecordingComplete: (blob: Blob, url: string) => void;
}

export function Recorder({ surahNumber, ayahNumber, enableEcho, onRecordingComplete }: RecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setAudioUrl(null);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        await new Promise(r => setTimeout(r, 300));
        const rawBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        // Only apply reverb if toggled on
        const processedBlob = enableEcho ? await applyReverb(rawBlob) : rawBlob;
        
        const reader = new FileReader();
        reader.readAsDataURL(processedBlob);
        reader.onloadend = async () => {
          const dataUrl = reader.result as string;
          setAudioUrl(dataUrl);
          
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const path = `${user.id}/${surahNumber}-${ayahNumber}-${Date.now()}.webm`;
            await supabase.storage.from('recordings').upload(path, processedBlob);
          }
          
          onRecordingComplete(processedBlob, dataUrl);
          stream.getTracks().forEach(t => t.stop());
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const applyReverb = async (blob: Blob): Promise<Blob> => {
    return new Promise(async (resolve) => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const arrayBuffer = await blob.arrayBuffer();
        const originalBuffer = await ctx.decodeAudioData(arrayBuffer);

        const impulse = ctx.createBuffer(2, ctx.sampleRate * 2.5, ctx.sampleRate);
        for (let i = 0; i < 2; i++) {
          const chan = impulse.getChannelData(i);
          for (let j = 0; j < chan.length; j++) chan[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / chan.length, 2.5);
        }

        const source = ctx.createBufferSource();
        source.buffer = originalBuffer;
        const convolver = ctx.createConvolver();
        convolver.buffer = impulse;
        const dryGain = ctx.createGain(); dryGain.gain.value = 0.6;
        const wetGain = ctx.createGain(); wetGain.gain.value = 0.7;

        source.connect(dryGain); source.connect(convolver);
        convolver.connect(wetGain);

        const dest = ctx.createMediaStreamDestination();
        dryGain.connect(dest); wetGain.connect(dest);

        const mediaRecorder = new MediaRecorder(dest.stream, { mimeType: 'audio/webm' });
        const newChunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) newChunks.push(e.data); };
        mediaRecorder.onstop = () => { ctx.close(); resolve(new Blob(newChunks, { type: 'audio/webm' })); };

        mediaRecorder.start();
        source.start(0);
        source.onended = () => mediaRecorder.stop();
      } catch (error) { resolve(blob); }
    });
  };

  const downloadAudio = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `Recitation_Surah${surahNumber}_Ayah${ayahNumber}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col gap-2 w-full mt-2">
      <div className="flex gap-2 w-full">
        {!isRecording ? (
          <button onClick={startRecording} className="w-full bg-emerald-600 text-white px-4 py-2.5 rounded-lg font-bold shadow-lg hover:bg-emerald-500 transition-all">
            Start Recording
          </button>
        ) : (
          <button onClick={stopRecording} className="w-full bg-red-600 text-white px-4 py-2.5 rounded-lg font-bold shadow-lg hover:bg-red-500 animate-pulse transition-all">
            Stop Recording
          </button>
        )}
      </div>

      {audioUrl && (
        <button 
          onClick={downloadAudio}
          className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          Export Audio
        </button>
      )}
    </div>
  );
}