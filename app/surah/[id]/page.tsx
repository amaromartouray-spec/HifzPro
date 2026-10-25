export const dynamic = 'force-dynamic';

'use client';
import { useEffect, useState, use } from 'react';
import { getVerses, getTranslations, getRecitations } from '../../../lib/quran';
import { Recorder } from '../../../components/Recorder';
import { AIEvaluator } from '../../../components/AIEvaluator';
import { supabase } from '../../../lib/supabase';
import Link from 'next/link';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

export default function SurahPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const surahId = parseInt(unwrappedParams.id);
  
  const [verses, setVerses] = useState<any[]>([]);
  const [translations, setTranslations] = useState<any[]>([]);
  const [recitations, setRecitations] = useState<any[]>([]);
  
  const [showTranslation, setShowTranslation] = useState(true);
  const [hideText, setHideText] = useState(false);
  const [enableEcho, setEnableEcho] = useState(true);
  
  const [currentReciter, setCurrentReciter] = useState(7);
  const [currentTranslation, setCurrentTranslation] = useState(131);
  
  const [userRecordings, setUserRecordings] = useState<{ [key: number]: string }>({});
  const [practicedVerses, setPracticedVerses] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    getTranslations().then(setTranslations);
    getRecitations().then(setRecitations);
  }, []);

  useEffect(() => {
    getVerses(surahId, currentReciter, currentTranslation).then(setVerses);
    fetchProgress();
  }, [surahId, currentReciter, currentTranslation]);

  const fetchProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('progress').select('ayah_number').eq('user_id', user.id).eq('surah_number', surahId).eq('status', 'practiced');
    if (data) {
      const progressMap: { [key: number]: boolean } = {};
      data.forEach(p => { progressMap[p.ayah_number] = true; });
      setPracticedVerses(progressMap);
    }
  };

  const handleRecordingComplete = async (ayahNumber: number, url: string) => {
    setUserRecordings(prev => ({ ...prev, [ayahNumber]: url }));
    setPracticedVerses(prev => ({ ...prev, [ayahNumber]: true }));

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('progress').upsert({
        user_id: user.id, surah_number: surahId, ayah_number: ayahNumber, status: 'practiced', last_practiced: new Date().toISOString()
      }, { onConflict: 'user_id, surah_number, ayah_number' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200 font-sans selection:bg-emerald-500/30">
      
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="islamic-pattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <path d="M60 0 L120 60 L60 120 L0 60 Z" fill="none" stroke="#10b981" strokeWidth="2"/>
              <circle cx="60" cy="60" r="30" fill="none" stroke="#10b981" strokeWidth="2"/>
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#islamic-pattern)"/>
        </svg>
      </div>

      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0B1120]/80 border-b border-slate-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold shadow-lg">Q</div>
            <h1 className="text-xl font-bold text-white tracking-wide">HifzPro</h1>
          </Link>
          
          <div className="flex flex-wrap gap-3 items-center">
            <select value={currentReciter} onChange={(e) => setCurrentReciter(parseInt(e.target.value))} className="bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-2 text-white font-medium max-w-[200px]">
              {recitations.map(r => <option key={r.id} value={r.id}>{r.reciter_name}</option>)}
            </select>

            <select value={currentTranslation} onChange={(e) => setCurrentTranslation(parseInt(e.target.value))} className="bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-2 text-white font-medium max-w-[200px]">
              {translations.map(t => <option key={t.id} value={t.id}>{t.name} ({t.language_name})</option>)}
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8 relative z-10">
        
        <div className="flex flex-wrap gap-3 mb-8">
          <button onClick={() => setShowTranslation(!showTranslation)} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${showTranslation ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400'}`}>Translation</button>
          
          <button onClick={() => setHideText(!hideText)} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${hideText ? 'bg-amber-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400'}`}>
            {hideText ? 'Show Arabic' : 'Hifz Mode'}
          </button>

          <button onClick={() => setEnableEcho(!enableEcho)} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${enableEcho ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
            Masjid Echo: {enableEcho ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="space-y-8">
          {verses.map((verse, index) => {
            
            let translationText = verse.translations?.[0]?.text?.replace(/<[^>]+>/g, '');
            if (!translationText) {
              translationText = verse.words
                ?.filter((w: any) => w.char_type_name === 'word' && w.translation?.language_name !== 'arabic')
                .map((w: any) => w.translation?.text)
                .join(' ');
            }

            const isPracticed = practicedVerses[verse.verse_number];
            const audioUrl = verse.audio?.url ? `https://verses.quran.com/${verse.audio.url}` : null;

            return (
              <div key={verse.id} className={`backdrop-blur-md border rounded-3xl p-6 md:p-10 shadow-2xl transition-all duration-300 ${isPracticed ? 'bg-emerald-900/20 border-emerald-500/40' : 'bg-slate-800/40 border-slate-700/50 hover:border-emerald-500/40'}`}>
                
                {isPracticed && (
                  <div className="flex justify-end mb-4">
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-900/50 px-3 py-1 rounded-full border border-emerald-500/30">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      Mastered
                    </span>
                  </div>
                )}

                {!hideText ? (
                  <p className="text-3xl md:text-5xl text-right mb-10 font-arabic leading-loose text-white drop-shadow-md" dir="rtl">{verse.text_uthmani}</p>
                ) : (
                  <div className="min-h-[100px] mb-10 flex flex-col items-center justify-center border-2 border-dashed border-slate-600 rounded-2xl bg-slate-800/20 p-4">
                    <p className="text-slate-500 font-medium italic mb-4">Arabic Hidden - Testing Memory</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {verse.words?.filter((w: any) => w.char_type_name === 'word').map((w: any, i: number) => (
                         <span key={i} className="bg-slate-700/50 text-slate-300 px-2 py-1 rounded text-sm border border-slate-600">{w.translation?.text}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {showTranslation && translationText && (
                  <p className="text-slate-300 mb-8 text-lg md:text-xl leading-relaxed border-l-4 border-emerald-500 pl-5 py-2 bg-slate-800/30 rounded-r-xl">{translationText}</p>
                )}

                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mt-8 pt-8 border-t border-slate-700/50">
                  <div className="flex-1 w-full">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Reciter Audio</p>
                    {audioUrl ? (
                      <AudioPlayer src={audioUrl} className="rounded-xl shadow-sm custom-audio-player" customAdditionalControls={[]} />
                    ) : (
                      <div className="text-sm text-slate-500 h-12 flex items-center">Audio loading...</div>
                    )}
                  </div>
                  
                  <div className="flex flex-col w-full md:w-auto">
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Your Recitation</p>
                    <Recorder 
                      surahNumber={surahId} 
                      ayahNumber={verse.verse_number} 
                      enableEcho={enableEcho}
                      onRecordingComplete={(blob, url) => handleRecordingComplete(verse.verse_number, url)} 
                    />
                    <div className="mt-4"><AIEvaluator expectedText={verse.text_uthmani} /></div>
                  </div>
                </div>

                {userRecordings[verse.verse_number] && (
                  <div className="mt-8 p-6 bg-emerald-900/20 border border-emerald-500/30 rounded-2xl">
                    <p className="text-sm font-bold text-emerald-400 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/></svg>
                      Your Saved Recitation
                    </p>
                    <audio key={userRecordings[verse.verse_number]} controls src={userRecordings[verse.verse_number]} className="w-full h-12 rounded-xl" onLoadedMetadata={(e) => {
                        const audio = e.target as HTMLAudioElement;
                        if (audio.duration === Infinity || audio.duration === 0) {
                          audio.currentTime = 1e101;
                          audio.ontimeupdate = () => { audio.ontimeupdate = null; audio.currentTime = 0; };
                        }
                    }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}