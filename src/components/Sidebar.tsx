import * as LucideIcons from 'lucide-react';
import { categoryLabels, categoryIcons, toolsByCategory } from '@/kaliTools';
import type { ToolCategory } from '@/types';

interface SidebarProps {
  activeCategory: ToolCategory | 'all';
  setActiveCategory: (c: ToolCategory | 'all') => void;
}

export function Sidebar({ activeCategory, setActiveCategory }: SidebarProps) {
  const categories = Object.keys(categoryLabels) as ToolCategory[];

  const allCount = categories.reduce((sum, c) => sum + toolsByCategory(c).length, 0);

  return (
    <aside className="w-60 bg-zinc-900/50 border-r border-zinc-800 flex flex-col flex-shrink-0 overflow-y-auto">
      <nav className="p-3 space-y-1">
        <button
          onClick={() => setActiveCategory('all')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeCategory === 'all'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 border border-transparent'
          }`}
        >
          <span>All Tools</span>
          <span className="text-xs opacity-70">{allCount}</span>
        </button>

        <div className="h-px bg-zinc-800 my-2" />

        {categories.map((cat) => {
          const IconComp = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[
            categoryIcons[cat]
          ] || LucideIcons.Terminal;
          const count = toolsByCategory(cat).length;
          const isActive = activeCategory === cat;

          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 border border-transparent'
              }`}
            >
              <IconComp className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left truncate">{categoryLabels[cat]}</span>
              <span className={`text-xs ${isActive ? 'opacity-70' : 'opacity-40'}`}>{count}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto p-4 border-t border-zinc-800">
        <p className="text-zinc-600 text-xs leading-relaxed">
          All commands run with sudo privileges in your terminal. Results are saved to the configured path.
        </p>
      </div>
    </aside>
  );
}
