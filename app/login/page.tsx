'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Loading...');

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage(error.message);
      else setMessage('Sign up successful! You can now log in.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
      else {
        setMessage('Logged in successfully!');
        router.push('/'); // Redirect to the main homepage
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B1120] text-slate-200">
      <div className="p-8 bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl w-96">
        <h1 className="text-2xl font-bold mb-6 text-center text-emerald-400">
          {isSignUp ? 'Create an Account' : 'Welcome Back'}
        </h1>
        
        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-slate-900 border border-slate-700 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-slate-900 border border-slate-700 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
            required
          />
          <button type="submit" className="bg-emerald-600 text-white p-3 rounded-lg font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/50">
            {isSignUp ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        {message && <p className="mt-4 text-center text-sm text-emerald-400 font-medium">{message}</p>}

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="mt-6 text-sm text-slate-400 hover:text-emerald-400 w-full text-center transition-colors"
        >
          {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}