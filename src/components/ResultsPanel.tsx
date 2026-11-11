import { useState, useRef, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import type { ExecutionResult, KaliTool } from '@/types';
import { getTool } from '@/kaliTools';

interface ResultsPanelProps {
  results: ExecutionResult[];
  onFollowUp: (tool: KaliTool, prefillParams: Record<string, string | boolean | number>) => void;
  onClear: () => void;
  runningToolId: string | null;
  progress: number;
}

export function ResultsPanel({ results, onFollowUp, onClear, runningToolId, progress }: ResultsPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (expanded && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [expanded]);

  return (
    <div className="w-[420px] bg-zinc-900/50 border-l border-zinc-800 flex flex-col flex-shrink-0">
      {/* header */}
      <div className="px-4 py-3.5 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LucideIcons.ScrollText className="w-5 h-5 text-emerald-400" />
          <h2 className="text-white font-bold text-sm">Results & History</h2>
          <span className="text-zinc-600 text-xs">({results.length})</span>
        </div>
        {results.length > 0 && (
          <button
            onClick={onClear}
            className="text-zinc-500 hover:text-red-400 transition-colors text-xs flex items-center gap-1"
          >
            <LucideIcons.Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* running indicator */}
      {runningToolId && (
        <RunningIndicator toolId={runningToolId} progress={progress} />
      )}

      {/* results list */}
      <div className="flex-1 overflow-y-auto">
        {results.length === 0 && !runningToolId && (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600 px-6 text-center">
            <LucideIcons.Terminal className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No results yet</p>
            <p className="text-xs mt-1 opacity-70">Execute a tool to see output here</p>
          </div>
        )}

        <div className="divide-y divide-zinc-800/50">
          {results.map((result) => {
            const isOpen = expanded === result.id;
            const tool = getTool(result.toolId);
            const IconComp = tool
              ? (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[tool.icon] || LucideIcons.Terminal
              : LucideIcons.Terminal;

            return (
              <div key={result.id} className="px-4 py-3">
                {/* result header */}
                <button
                  onClick={() => setExpanded(isOpen ? null : result.id)}
                  className="w-full flex items-start gap-3 text-left"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    result.success ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                  }`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-zinc-200 font-semibold text-sm truncate">{result.toolName}</p>
                      {result.success && (
                        <LucideIcons.CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      {new Date(result.timestamp).toLocaleTimeString()} · {(result.durationMs / 1000).toFixed(1)}s
                    </p>
                  </div>
                  <LucideIcons.ChevronDown
                    className={`w-4 h-4 text-zinc-600 flex-shrink-0 mt-1.5 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* collapsed summary */}
                {!isOpen && (
                  <p className="text-zinc-500 text-xs mt-2 ml-11 leading-relaxed line-clamp-2">
                    {result.summary}
                  </p>
                )}

                {/* expanded details */}
                {isOpen && (
                  <div className="mt-3 ml-11 space-y-3">
                    {/* summary */}
                    <div className="bg-zinc-800/40 border border-zinc-700/40 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                        <LucideIcons.Info className="w-3.5 h-3.5" />
                        Summary
                      </div>
                      <p className="text-zinc-300 text-sm leading-relaxed">{result.summary}</p>
                    </div>

                    {/* terminal output */}
                    <div
                      ref={terminalRef}
                      className="bg-black border border-zinc-800 rounded-lg p-3 max-h-64 overflow-y-auto font-mono text-xs"
                    >
                      <div className="flex items-center gap-1.5 text-zinc-600 mb-2 pb-2 border-b border-zinc-800/50">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-red-500/60" />
                          <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
                          <div className="w-2 h-2 rounded-full bg-green-500/60" />
                        </div>
                        <span className="ml-1">output</span>
                      </div>
                      <pre className="text-zinc-400 whitespace-pre-wrap break-all leading-relaxed">
                        {result.output}
                      </pre>
                    </div>

                    {/* artifacts */}
                    {result.artifacts && result.artifacts.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">
                          <LucideIcons.FileDown className="w-3.5 h-3.5" />
                          Artifacts
                        </div>
                        <div className="space-y-1">
                          {result.artifacts.map((a, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-zinc-400 text-xs font-mono bg-zinc-800/30 border border-zinc-700/30 rounded px-2.5 py-1.5"
                            >
                              <LucideIcons.File className="w-3.5 h-3.5 text-zinc-600" />
                              {a}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* follow-up actions */}
                    {tool?.followUps && tool.followUps.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">
                          <LucideIcons.GitBranch className="w-3.5 h-3.5" />
                          Next Actions
                        </div>
                        <div className="space-y-1.5">
                          {tool.followUps.map((fu) => {
                            const fuTool = getTool(fu.toolId);
                            if (!fuTool) return null;

                            // build prefill params from result
                            const prefill: Record<string, string | boolean | number> = {};
                            if (result.parsedTargets && result.parsedTargets.length > 0) {
                              // try to map the first parsed target to the tool's first text param
                              const firstTextParam = fuTool.params.find((p) => p.type === 'text');
                              if (firstTextParam) {
                                // For airodump results like "BSSID:ESSID:CH", extract BSSID
                                const firstTarget = result.parsedTargets[0];
                                if (firstTarget.includes(':') && fuTool.id === 'aireplay-ng') {
                                  prefill['bssid'] = firstTarget.split(':')[0];
                                  prefill['channel'] = Number(firstTarget.split(':')[2]);
                                } else if (fuTool.id === 'hydra' && firstTarget.includes(':')) {
                                  const [user, pass] = firstTarget.split(':');
                                  prefill['user'] = user;
                                } else if (fuTool.id === 'ssh-connect' && firstTarget.includes(':')) {
                                  prefill['user'] = firstTarget.split(':')[0];
                                } else {
                                  prefill[firstTextParam.id] = firstTarget;
                                }
                              }
                            }

                            return (
                              <button
                                key={fu.id}
                                onClick={() => onFollowUp(fuTool, prefill)}
                                className="w-full flex items-center gap-3 text-left bg-zinc-800/40 hover:bg-emerald-500/10 border border-zinc-700/40 hover:border-emerald-500/30 rounded-lg p-2.5 transition-all group"
                              >
                                <div className="w-7 h-7 rounded-md bg-zinc-700/50 group-hover:bg-emerald-500/15 flex items-center justify-center flex-shrink-0 transition-colors">
                                  <LucideIcons.ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-zinc-200 text-xs font-medium">{fu.label}</p>
                                  <p className="text-zinc-600 text-xs truncate">{fu.description}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RunningIndicator({ toolId, progress }: { toolId: string; progress: number }) {
  const tool = getTool(toolId);
  const IconComp = tool
    ? (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[tool.icon] || LucideIcons.Terminal
    : LucideIcons.Terminal;

  return (
    <div className="px-4 py-4 border-b border-zinc-800 bg-zinc-900/60">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
          <IconComp className="w-4 h-4 text-emerald-400 animate-pulse" />
        </div>
        <div className="flex-1">
          <p className="text-zinc-200 font-semibold text-sm">{tool?.name || 'Running...'}</p>
          <p className="text-emerald-400 text-xs">Executing in terminal...</p>
        </div>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
