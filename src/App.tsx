import { useState, useCallback, useRef } from 'react';
import { SessionProvider, useSession } from './session';
import { SudoLogin } from './components/SudoLogin';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ToolList } from './components/ToolList';
import { ResultsPanel } from './components/ResultsPanel';
import { buildCommand, createResult } from './commandExecutor';
import type { ToolCategory, KaliTool, ExecutionResult } from './types';

function Dashboard() {
  // Hinweis: Falls dein Sudo-Passwort in useSession() gespeichert wird (z. B. als sudoPassword oder password),
  // kannst du es hier mit auslesen und unten im fetch-Body mitschicken.
  const { authenticated, savePath, setMonitorInterface, ...session } = useSession() as any;
  const sudoPassword = session.sudoPassword || session.password || '';

  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'all'>('all');
  const [results, setResults] = useState<ExecutionResult[]>([]);
  const [running, setRunning] = useState(false);
  const [runningToolId, setRunningToolId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [prefillTool, setPrefillTool] = useState<KaliTool | null>(null);
  const [prefillParams, setPrefillParams] = useState<Record<string, string | boolean | number> | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleExecute = useCallback(
    async (tool: KaliTool, params: Record<string, string | boolean | number>) => {
      if (running) return;
      setRunning(true);
      setRunningToolId(tool.id);
      setProgress(0);

      const estimatedMs = (tool.estimatedRuntime || 10) * 1000;
      const startTime = Date.now();

      // Ladebalken läuft während der echten Ausführung bis maximal 95 % hoch
      if (progressTimer.current) clearInterval(progressTimer.current);
      progressTimer.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min(95, (elapsed / estimatedMs) * 100);
        setProgress(pct);
      }, 100);

      // Spezialbehandlung für airmon-ng
      if (tool.id === 'airmon-ng') {
        const action = String(params.action || 'start').split(' ');
        const iface = String(params.interface || 'wlan0');
        if (action === 'start') {
          setMonitorInterface(`${iface}mon`);
        } else if (action === 'stop') {
          setMonitorInterface(null);
        }
      }

      const command = buildCommand(tool, params, savePath);

      try {
        // Echter Aufruf an deine script.js auf Port 3001
        const response = await fetch('http://localhost:3001/api/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            command,
            sudoPassword,
          }),
        });

        const backendData = await response.json();

        const result = createResult(tool, params, command, {
          stdout: backendData.stdout || '',
          stderr: backendData.stderr || '',
          exitCode: backendData.exitCode ?? (response.ok ? 0 : 1),
          durationMs: backendData.durationMs || Date.now() - startTime,
        });

        setResults((prev) => [result, ...prev]);
      } catch (err: any) {
        // Falls node script.js nicht läuft oder nicht erreichbar ist
        const errorResult = createResult(tool, params, command, {
          stdout: '',
          stderr: `Backend nicht erreichbar (läuft 'node script.js'?): ${err.message}`,
          exitCode: 1,
          durationMs: Date.now() - startTime,
        });

        setResults((prev) => [errorResult, ...prev]);
      } finally {
        // Ladebalken sauber beenden
        if (progressTimer.current) {
          clearInterval(progressTimer.current);
          progressTimer.current = null;
        }
        setProgress(100);
        setRunning(false);
        setRunningToolId(null);
        setTimeout(() => setProgress(0), 500);
      }
    },
    [running, savePath, setMonitorInterface, sudoPassword],
  );

  const handleFollowUp = useCallback(
    (tool: KaliTool, prefill: Record<string, string | boolean | number>) => {
      setPrefillTool(tool);
      setPrefillParams(prefill);
      setActiveCategory(tool.category);
    },
    [],
  );

  const handleClear = useCallback(() => {
    setResults([]);
  }, []);

  if (!authenticated) {
    return <SudoLogin />;
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-950">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
        <ToolList
          activeCategory={activeCategory}
          onExecute={handleExecute}
          running={running}
          prefillTool={prefillTool}
          prefillParams={prefillParams}
        />
        <ResultsPanel
          results={results}
          onFollowUp={handleFollowUp}
          onClear={handleClear}
          runningToolId={runningToolId}
          progress={progress}
        />
      </div>
    </div>
  );
}

function App() {
  return (
    <SessionProvider>
      <Dashboard />
    </SessionProvider>
  );
}

export default App;
