import { useState } from 'react';
import { Shield, Wifi, Radio, FolderOpen, LogOut, Power, Cpu } from 'lucide-react';
import { useSession } from '@/session';

export function Header() {
  const {
    networkMode,
    setNetworkMode,
    monitorInterface,
    savePath,
    setSavePath,
    logout,
  } = useSession();

  const [pathEdit, setPathEdit] = useState(false);
  const [pathInput, setPathInput] = useState(savePath);

  const handlePathSave = () => {
    setSavePath(pathInput.trim() || '/root/kali-ui-exports');
    setPathEdit(false);
  };

  const isMonitor = networkMode === 'monitor';

  return (
    <header className="h-16 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-5 flex-shrink-0 z-20">
      {/* left: logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg leading-none tracking-tight">Kali Dashboard</h1>
          <p className="text-zinc-500 text-xs mt-0.5 font-mono">kali-linux 2024.4</p>
        </div>
      </div>

      {/* center: network mode toggle */}
      <div className="hidden md:flex items-center gap-4">
        <div className="flex items-center gap-1 bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-1">
          <button
            onClick={() => setNetworkMode('normal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              !isMonitor
                ? 'bg-zinc-700 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Wifi className="w-4 h-4" />
            Normal
          </button>
          <button
            onClick={() => setNetworkMode('monitor')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isMonitor
                ? 'bg-amber-500/90 text-white shadow-sm shadow-amber-500/20'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Radio className="w-4 h-4" />
            Monitor
          </button>
        </div>

        {/* monitor interface indicator */}
        {isMonitor && (
          <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5 animate-pulse">
            <Cpu className="w-4 h-4" />
            <span className="font-mono">{monitorInterface || 'wlan0mon'}</span>
          </div>
        )}
      </div>

      {/* right: save path + logout */}
      <div className="flex items-center gap-3">
        {/* save path */}
        <div className="hidden lg:flex items-center gap-2 bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2">
          <FolderOpen className="w-4 h-4 text-zinc-500 flex-shrink-0" />
          {pathEdit ? (
            <input
              type="text"
              value={pathInput}
              onChange={(e) => setPathInput(e.target.value)}
              onBlur={handlePathSave}
              onKeyDown={(e) => e.key === 'Enter' && handlePathSave()}
              autoFocus
              className="bg-transparent text-zinc-300 text-sm font-mono w-48 focus:outline-none border-b border-zinc-600"
            />
          ) : (
            <button
              onClick={() => {
                setPathInput(savePath);
                setPathEdit(true);
              }}
              className="text-zinc-400 text-sm font-mono hover:text-zinc-200 transition-colors max-w-[200px] truncate"
              title={savePath}
            >
              {savePath}
            </button>
          )}
        </div>

        {/* session indicator */}
        <div className="flex items-center gap-1.5 text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
          <Power className="w-4 h-4" />
          <span className="hidden sm:inline font-medium">sudo active</span>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg px-3 py-2 transition-all"
          title="Lock session"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
