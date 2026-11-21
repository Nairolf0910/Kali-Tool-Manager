import { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, Terminal, AlertCircle } from 'lucide-react';
import { useSession } from '@/session';

export function SudoLogin() {
  const { setPassword, setAuthenticated } = useSession();
  const [input, setInput] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) {
      setError('Password cannot be empty');
      return;
    }
    setError('');
    setVerifying(true);

    try {
      const response = await fetch('http://localhost:3001/api/verify-sudo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sudoPassword: input }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setPassword(input);
        setAuthenticated(true);
      } else {
        setError(data.error || 'Invalid sudo password');
      }
    } catch {
      setError('Backend nicht erreichbar (läuft node script.js?)');
    } finally {
      setVerifying(false);
    }
  };


  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* background grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative w-full max-w-md">
        {/* terminal-style header */}
        <div className="flex items-center gap-2 mb-6 text-zinc-600 text-sm font-mono">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <span className="ml-2">root@kali: ~</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl shadow-black/50">
          {/* logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
              <Shield className="w-9 h-9 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Kali Tool Dashboard</h1>
            <p className="text-zinc-500 text-sm mt-1.5">Enter your sudo password to unlock all tools</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">
                Sudo Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                <input
                  type={show ? 'text' : 'password'}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                  disabled={verifying}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-11 pr-11 py-3.5 text-white text-base font-mono placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={verifying || !input.trim()}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {verifying ? (
                <>
                  <Terminal className="w-5 h-5 animate-pulse" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Unlock Dashboard
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-zinc-800">
            <p className="text-xs text-zinc-600 leading-relaxed">
              The password is stored in memory for this session only and automatically
              passed to every tool that requires root privileges. No data leaves your machine.
            </p>
          </div>
        </div>

        <p className="text-center text-zinc-700 text-xs mt-6 font-mono">
          kali-linux 2024.4 · kernel 6.6.0-kali
        </p>
      </div>
    </div>
  );
}
