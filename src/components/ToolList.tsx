import * as LucideIcons from 'lucide-react';
import { useMemo, useState } from 'react';
import { kaliTools, categoryLabels } from '@/kaliTools';
import type { ToolCategory, KaliTool, ToolParam } from '@/types';
import { useSession } from '@/session';
import { ToolConfigPanel } from '@/components/ToolConfigPanel';

interface ToolListProps {
  activeCategory: ToolCategory | 'all';
  onExecute: (tool: KaliTool, params: Record<string, string | boolean | number>) => void;
  running: boolean;
  prefillTool?: KaliTool | null;
  prefillParams?: Record<string, string | boolean | number> | null;
}

export function ToolList({ activeCategory, onExecute, running, prefillTool, prefillParams }: ToolListProps) {
  const { networkMode } = useSession();
  const [selectedTool, setSelectedTool] = useState<KaliTool | null>(null);
  const [search, setSearch] = useState('');

  // Handle follow-up tool selection
  useMemo(() => {
    if (prefillTool) {
      setSelectedTool(prefillTool);
    }
  }, [prefillTool]);

  const filtered = useMemo(() => {
    let list = activeCategory === 'all'
      ? kaliTools
      : kaliTools.filter((t) => t.category === activeCategory);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q),
      );
    }
    return list;
  }, [activeCategory, search]);

  const grouped = useMemo(() => {
    const map = new Map<ToolCategory, KaliTool[]>();
    for (const t of filtered) {
      if (!map.has(t.category)) map.set(t.category, []);
      map.get(t.category)!.push(t);
    }
    return Array.from(map.entries());
  }, [filtered]);

  if (selectedTool) {
    return (
      <ToolConfigPanel
        tool={selectedTool}
        onBack={() => setSelectedTool(null)}
        onExecute={(params) => {
          onExecute(selectedTool, params);
          setSelectedTool(null);
        }}
        running={running}
        prefillParams={prefillParams && prefillTool?.id === selectedTool.id ? prefillParams : undefined}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950">
      <div className="sticky top-0 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/50 px-6 py-4 z-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-white">
            {activeCategory === 'all' ? 'All Tools' : categoryLabels[activeCategory as ToolCategory]}
            <span className="text-zinc-600 font-normal text-sm ml-2">({filtered.length})</span>
          </h2>
        </div>
        <div className="relative">
          <LucideIcons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
      </div>

      <div className="px-6 py-5">
        {grouped.map(([cat, tools]) => (
          <div key={cat} className="mb-8 last:mb-0">
            {activeCategory === 'all' && (
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                {categoryLabels[cat]}
              </h3>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {tools.map((tool) => {
                const IconComp = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[
                  tool.icon
                ] || LucideIcons.Terminal;
                const needsMonitor = tool.requiresMonitor && networkMode !== 'monitor';

                return (
                  <button
                    key={tool.id}
                    onClick={() => !needsMonitor && setSelectedTool(tool)}
                    disabled={needsMonitor}
                    className={`text-left p-4 rounded-xl border transition-all group ${
                      needsMonitor
                        ? 'bg-zinc-900/30 border-zinc-800/50 opacity-50 cursor-not-allowed'
                        : 'bg-zinc-900 border-zinc-800 hover:border-emerald-500/40 hover:bg-zinc-800/50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        needsMonitor
                          ? 'bg-zinc-800 text-zinc-600'
                          : 'bg-zinc-800 group-hover:bg-emerald-500/15 text-zinc-400 group-hover:text-emerald-400'
                      }`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      {tool.requiresMonitor && (
                        <span className={`text-[10px] font-mono px-2 py-1 rounded-full border ${
                          needsMonitor
                            ? 'text-red-400/60 bg-red-500/5 border-red-500/20'
                            : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                        }`}>
                          {needsMonitor ? 'NEEDS MONITOR' : 'MONITOR READY'}
                        </span>
                      )}
                    </div>
                    <h4 className="text-white font-semibold text-sm mb-1">{tool.name}</h4>
                    <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2">{tool.description}</p>
                    {tool.followUps && tool.followUps.length > 0 && (
                      <div className="mt-3 flex items-center gap-1.5 text-zinc-600 text-xs">
                        <LucideIcons.GitBranch className="w-3 h-3" />
                        {tool.followUps.length} follow-up action{tool.followUps.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
            <LucideIcons.SearchX className="w-12 h-12 mb-3 opacity-50" />
            <p>No tools found matching "{search}"</p>
          </div>
        )}
      </div>
    </div>
  );
}

// re-export ToolParam for convenience
export type { ToolParam };
