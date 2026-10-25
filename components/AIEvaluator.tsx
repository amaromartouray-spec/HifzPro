'use client';
import { useState, useEffect, useRef } from 'react';

interface AIEvaluatorProps {
  expectedText: string;
}

export function AIEvaluator({ expectedText }: AIEvaluatorProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.lang = 'ar-SA'; 
      recog.continuous = true; 
      recog.interimResults = true; 

      recog.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recog.onerror = (event: any) => {
        if (event.error !== 'no-speech') setErrorMsg(`Error: ${event.error}`);
        setIsListening(false);
      };

      recog.onend = () => setIsListening(false);
      recognitionRef.current = recog;
    } else {
      setErrorMsg("Please use Google Chrome for AI evaluation.");
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      calculateScore(transcript, expectedText);
    } else {
      setTranscript('');
      setScore(null);
      setErrorMsg(null);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const calculateScore = (spoken: string, expected: string) => {
    const clean = (text: string) => text.replace(/[\u064B-\u065F]/g, '').replace(/[^\w\s\u0600-\u06FF]/g, '').trim();
    const expectedWords = clean(expected).split(/\s+/);
    const spokenWords = clean(spoken).split(/\s+/);

    let matches = 0;
    spokenWords.forEach(word => {
      if (expectedWords.some(expWord => expWord === word || expWord.includes(word) || word.includes(expWord))) {
        matches++;
      }
    });

    const calculatedScore = Math.min(100, Math.round((matches / expectedWords.length) * 100));
    setScore(calculatedScore);
  };

  return (
    <div className="mt-4 p-6 bg-slate-800/60 border border-slate-700/50 rounded-2xl w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h4 className="text-emerald-400 font-bold flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
            AI Evaluator
          </h4>
          <p className="text-xs text-slate-400 mt-1">Supports long recordings. Speak clearly.</p>
        </div>
        
        <button 
          onClick={toggleListening}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-all w-full sm:w-auto ${
            isListening 
              ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/50 animate-pulse' 
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/50'
          }`}
        >
          {isListening ? 'Stop & Evaluate' : 'Start Evaluation'}
        </button>
      </div>

      {errorMsg && <div className="p-3 mb-4 text-sm text-amber-200 bg-amber-900/30 border border-amber-500/30 rounded-lg">{errorMsg}</div>}

      {isListening && (
        <div className="flex items-center gap-2 text-sm text-emerald-400 mb-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div> Listening...
        </div>
      )}

      {score !== null && (
        <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-slate-300">Accuracy Score</span>
            <span className={`text-xl font-bold ${score > 80 ? 'text-emerald-400' : score > 50 ? 'text-amber-400' : 'text-red-400'}`}>{score}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2.5 mb-4">
            <div className={`h-2.5 rounded-full ${score > 80 ? 'bg-emerald-500' : score > 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${score}%` }}></div>
          </div>
          <p className="text-xs text-slate-400"><strong className="text-slate-300">We heard:</strong> {transcript}</p>
        </div>
      )}
    </div>
  );
}