'use client';
import { useEffect, useState } from 'react';
import { getSurahs } from '../lib/quran';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [surahs, setSurahs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    getSurahs().then((data) => {
      setSurahs(data);
      setLoading(false);
    });

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setUserEmail(user.email || 'Guest');
      }
    };
    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const filteredSurahs = surahs.filter((surah) =>
    surah.name_simple.toLowerCase().includes(search.toLowerCase()) ||
    surah.id.toString() === search ||
    surah.translated_name.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200 font-sans selection:bg-emerald-500/30">
      
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="islamic-pattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <path d="M60 0 L120 60 L60 120 L0 60 Z" fill="none" stroke="#10b981" strokeWidth="2"/>
              <circle cx="60" cy="60" r="30" fill="none" stroke="#10b981" strokeWidth="2"/>
              <path d="M60 30 L90 60 L60 90 L30 60 Z" fill="none" stroke="#fbbf24" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#islamic-pattern)"/>
        </svg>
      </div>

      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0B1120]/80 border-b border-slate-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold shadow-lg">
              Q
            </div>
            <h1 className="text-xl font-bold text-white tracking-wide">Quran Reciter</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 hidden sm:block">{userEmail}</span>
            <button onClick={handleLogout} className="bg-slate-800 hover:bg-slate-700 text-sm px-4 py-2 rounded-lg font-medium transition border border-slate-700">
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-8 relative z-10">
        
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Assalamu Alaikum</h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">Welcome back to your Quran memorization journey. Pick up where you left off or start a new Surah.</p>
          
          <div className="relative max-w-lg mx-auto">
            <input
              type="text"
              placeholder="Search Surah by name, number, or meaning..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-4 pl-12 bg-slate-800/80 border border-slate-700 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-slate-400 transition-all"
            />
            <svg className="w-6 h-6 text-slate-400 absolute left-4 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-emerald-500 font-bold mt-10 animate-pulse">Loading Surahs...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSurahs.map((surah) => (
              <Link key={surah.id} href={`/surah/${surah.id}`}>
                <div className="bg-slate-800/40 backdrop-blur-sm p-5 rounded-2xl shadow-lg border border-slate-700/50 hover:shadow-emerald-900/20 hover:border-emerald-500/50 transition-all duration-300 cursor-pointer flex justify-between items-center group transform hover:-translate-y-1">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-emerald-900/50 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-md border border-emerald-500/20">
                        {surah.id}
                      </span>
                      <h3 className="font-bold text-lg text-white group-hover:text-emerald-400 transition-colors">{surah.name_simple}</h3>
                    </div>
                    <p className="text-sm text-slate-400">{surah.translated_name.name} • {surah.verses_count} Ayahs</p>
                  </div>
                  <div className="text-3xl font-arabic text-emerald-500/80 group-hover:text-emerald-400 transition-colors">
                    {surah.name_arabic}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}