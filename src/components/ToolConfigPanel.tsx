import { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import type { KaliTool, ToolParam } from '@/types';
import { useSession } from '@/session';
import { buildCommand } from '@/commandExecutor';

interface ToolConfigPanelProps {
  tool: KaliTool;
  onBack: () => void;
  onExecute: (params: Record<string, string | boolean | number>) => void;
  running: boolean;
  prefillParams?: Record<string, string | boolean | number>;
}

export function ToolConfigPanel({
  tool,
  onBack,
  onExecute,
  running,
  prefillParams,
}: ToolConfigPanelProps) {
  const { savePath, password } = useSession();
  const [values, setValues] = useState<Record<string, string | boolean | number>>({});

  // initialize defaults
  useEffect(() => {
    const init: Record<string, string | boolean | number> = {};
    for (const p of tool.params) {
      if (prefillParams && prefillParams[p.id] !== undefined) {
        init[p.id] = prefillParams[p.id];
      } else if (p.default !== undefined) {
        // strip parenthetical hints from select defaults
        init[p.id] = p.type === 'select' ? String(p.default).split(' ')[0] : p.default;
      } else {
        init[p.id] = p.type === 'boolean' ? false : p.type === 'number' ? 0 : '';
      }
    }
    setValues(init);
  }, [tool, prefillParams]);

  const setVal = (id: string, val: string | boolean | number) => {
    setValues((prev) => ({ ...prev, [id]: val }));
  };

  const requiredMissing = tool.params
    .filter((p) => p.required)
    .some((p) => {
      const v = values[p.id];
      return v === '' || v === undefined || v === null;
    });

  const command = buildCommand(tool, values, savePath).replace('$PASSWORD', '••••••••');

  const IconComp = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[
    tool.icon
  ] || LucideIcons.Terminal;

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950">
      {/* header */}
      <div className="sticky top-0 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/50 px-6 py-4 z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-400 hover:text-emerald-400 transition-colors text-sm mb-3"
        >
          <LucideIcons.ArrowLeft className="w-4 h-4" />
          Back to tools
        </button>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <IconComp className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{tool.name}</h2>
            <p className="text-zinc-500 text-sm">{tool.description}</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 max-w-3xl">
        {/* parameters */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            Configuration
          </h3>
          <div className="space-y-4">
            {tool.params.map((param) => (
              <ParamInput
                key={param.id}
                param={param}
                value={values[param.id]}
                onChange={(v) => setVal(param.id, v)}
              />
            ))}
          </div>
        </div>

        {/* command preview */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Command Preview
          </h3>
          <div className="bg-black border border-zinc-800 rounded-xl p-4 font-mono text-sm overflow-x-auto">
            <div className="flex items-start gap-2">
              <span className="text-emerald-500 select-none">$</span>
              <span className="text-zinc-300 break-all">{command}</span>
            </div>
          </div>
          <p className="text-zinc-600 text-xs mt-2">
            The sudo password is injected automatically. Estimated runtime: ~{tool.estimatedRuntime || 10}s
          </p>
        </div>

        {/* execute */}
        <button
          onClick={() => onExecute(values)}
          disabled={running || requiredMissing}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {running ? (
            <>
              <LucideIcons.Loader2 className="w-5 h-5 animate-spin" />
              Executing...
            </>
          ) : (
            <>
              <LucideIcons.Play className="w-5 h-5" />
              Execute Tool
            </>
          )}
        </button>

        {requiredMissing && (
          <p className="text-amber-400/80 text-sm mt-3 text-center">
            Please fill in all required fields
          </p>
        )}

        {/* follow-up preview */}
        {tool.followUps && tool.followUps.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Available After Execution
            </h3>
            <div className="space-y-2">
              {tool.followUps.map((fu) => (
                <div
                  key={fu.id}
                  className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg p-3"
                >
                  <LucideIcons.GitBranch className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                  <div>
                    <p className="text-zinc-300 text-sm font-medium">{fu.label}</p>
                    <p className="text-zinc-600 text-xs">{fu.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* password note */}
        <div className="mt-8 flex items-center gap-2 text-zinc-600 text-xs bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-3">
          <LucideIcons.Lock className="w-3.5 h-3.5 flex-shrink-0" />
          Password stored in session ({'*'.repeat(Math.min(password.length, 8))}) — injected via <span className="font-mono text-zinc-500">sudo -S</span>
        </div>
      </div>
    </div>
  );
}

function ParamInput({
  param,
  value,
  onChange,
}: {
  param: ToolParam;
  value: string | boolean | number | undefined;
  onChange: (v: string | boolean | number) => void;
}) {
  const baseClass =
    'w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors';

  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 mb-1.5">
        {param.label}
        {param.required && <span className="text-red-400 text-xs">*</span>}
      </label>

      {param.type === 'text' && (
        <input
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={param.placeholder}
          className={baseClass}
        />
      )}

      {param.type === 'number' && (
        <input
          type="number"
          value={value !== undefined && value !== '' ? Number(value) : ''}
          onChange={(e) => onChange(Number(e.target.value))}
          placeholder={param.placeholder ? String(param.placeholder) : ''}
          className={baseClass}
        />
      )}

      {param.type === 'select' && (
        <div className="relative">
          <select
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseClass} appearance-none pr-9 cursor-pointer`}
          >
            {param.options?.map((opt) => {
              const val = opt.split(' ')[0];
              return (
                <option key={opt} value={val}>
                  {opt}
                </option>
              );
            })}
          </select>
          <LucideIcons.ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
        </div>
      )}

      {param.type === 'boolean' && (
        <button
          type="button"
          onClick={() => onChange(!value)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            value ? 'bg-emerald-500' : 'bg-zinc-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              value ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      )}

      {param.hint && (
        <p className="text-zinc-600 text-xs mt-1.5">{param.hint}</p>
      )}
    </div>
  );
}
