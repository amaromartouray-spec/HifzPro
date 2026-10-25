'use client';
import { useRef, useCallback } from 'react';

export function useAudioEffects() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const convolverRef = useRef<ConvolverNode | null>(null);
  const highpassRef = useRef<BiquadFilterNode | null>(null);

  const initAudio = useCallback(async () => {
    if (audioContextRef.current) return audioContextRef.current;
    
    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 80;
    highpassRef.current = highpass;

    const convolver = ctx.createConvolver();
    try {
      const response = await fetch('/audio/masjid-impulse.wav');
      const arrayBuffer = await response.arrayBuffer();
      convolver.buffer = await ctx.decodeAudioData(arrayBuffer);
    } catch {
      console.warn('Reverb impulse not found, using dry signal');
    }
    convolverRef.current = convolver;

    return ctx;
  }, []);

  const applyEffects = useCallback((source: AudioBufferSourceNode, wetness: number = 0.3) => {
    const ctx = audioContextRef.current;
    if (!ctx || !highpassRef.current || !convolverRef.current) {
      source.connect(ctx!.destination);
      return;
    }

    source.connect(highpassRef.current);
    
    const wetGain = ctx.createGain();
    wetGain.gain.value = wetness;
    highpassRef.current.connect(convolverRef.current);
    convolverRef.current.connect(wetGain);
    wetGain.connect(ctx.destination);
    
    highpassRef.current.connect(ctx.destination);
  }, []);

  return { initAudio, applyEffects, audioContextRef };
}