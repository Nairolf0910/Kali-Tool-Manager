import { useState, useCallback, useRef } from 'react';
import { SessionProvider, useSession } from './session';
import { SudoLogin } from './components/SudoLogin';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ToolList } from './components/ToolList';
import { ResultsPanel } from './components/ResultsPanel';
import { buildCommand, createResult } from './commandExecutor';
import { getTool } from './kaliTools';
import type { ToolCategory, KaliTool, ExecutionResult } from './types';

function Dashboard() {
  const { authenticated, savePath, networkMode, setMonitorInterface } = useSession();
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'all'>('all');
  const [results, setResults] = useState<ExecutionResult[]>([]);
  const [running, setRunning] = useState(false);
  const [runningToolId, setRunningToolId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [prefillTool, setPrefillTool] = useState<KaliTool | null>(null);
  const [prefillParams, setPrefillParams] = useState<Record<string, string | boolean | number> | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleExecute = useCallback(
    (tool: KaliTool, params: Record<string, string | boolean | number>) => {
      if (running) return;
      setRunning(true);
      setRunningToolId(tool.id);
      setProgress(0);

      const estimatedMs = (tool.estimatedRuntime || 10) * 1000;
      const startTime = Date.now();

      // progress simulation
      if (progressTimer.current) clearInterval(progressTimer.current);
      progressTimer.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min(95, (elapsed / estimatedMs) * 100);
        setProgress(pct);
      }, 100);

      // special handling for airmon-ng: update monitor interface
      if (tool.id === 'airmon-ng') {
        const action = String(params.action || 'start').split(' ')[0];
        const iface = String(params.interface || 'wlan0');
        if (action === 'start') {
          setMonitorInterface(`${iface}mon`);
        } else if (action === 'stop') {
          setMonitorInterface(null);
        }
      }

      setTimeout(() => {
        if (progressTimer.current) {
          clearInterval(progressTimer.current);
          progressTimer.current = null;
        }
        setProgress(100);
        const command = buildCommand(tool, params, savePath);
        const result = createResult(tool, params, command, Date.now() - startTime);

        setResults((prev) => [result, ...prev]);
        setRunning(false);
        setRunningToolId(null);
        setTimeout(() => setProgress(0), 500);
      }, estimatedMs);
    },
    [running, savePath, setMonitorInterface],
  );

  const handleFollowUp = useCallback(
    (tool: KaliTool, prefill: Record<string, string | boolean | number>) => {
      setPrefillTool(tool);
      setPrefillParams(prefill);
      // navigate to the tool's category
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
