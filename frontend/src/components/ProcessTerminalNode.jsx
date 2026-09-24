import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Compass, CheckCircle2, LogOut } from 'lucide-react';

export function ProcessTerminalNode({ data, selected }) {
  const { terminalType, label = 'Terminal', visits = 0 } = data;

  if (terminalType === 'start') {
    return (
      <div
        className={`w-[90px] h-[44px] rounded-xl border border-blue-500/60 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 p-2 flex items-center justify-center gap-1.5 transition-all select-none shadow-xs ${
          selected ? 'ring-2 ring-blue-500 shadow-md scale-105' : 'hover:border-blue-500'
        }`}
      >
        <Compass className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-wider leading-none">Start</span>
          <span className="text-[9px] text-blue-600/80 dark:text-blue-400/80 mt-0.5">{visits} cases</span>
        </div>

        <Handle
          id="right-source"
          type="source"
          position={Position.Right}
          className="!bg-blue-500 !w-2 !h-2 !border-2 !border-background !-right-1"
        />
      </div>
    );
  }

  if (terminalType === 'success') {
    return (
      <div
        className={`w-[100px] h-[44px] rounded-xl border border-emerald-500/60 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 p-2 flex items-center justify-center gap-1.5 transition-all select-none shadow-xs ${
          selected ? 'ring-2 ring-emerald-500 shadow-md scale-105' : 'hover:border-emerald-500'
        }`}
      >
        <Handle
          id="left-target"
          type="target"
          position={Position.Left}
          className="!bg-emerald-500 !w-2 !h-2 !border-2 !border-background !-left-1"
        />

        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-wider leading-none truncate">{label || 'Success'}</span>
          <span className="text-[9px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">{visits} cases</span>
        </div>
      </div>
    );
  }

  // Terminal Exit node
  return (
    <div
      className={`w-[90px] h-[44px] rounded-xl border border-dashed border-rose-500/60 bg-rose-50/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 p-2 flex items-center justify-center gap-1.5 transition-all select-none shadow-xs ${
        selected ? 'ring-2 ring-rose-500 shadow-md scale-105' : 'hover:border-rose-500'
      }`}
    >
      {/* Top target handle for downward abandonment branches */}
      <Handle
        id="top-target"
        type="target"
        position={Position.Top}
        className="!bg-rose-500 !w-2 !h-2 !border-2 !border-background !-top-1"
      />

      {/* Left target handle fallback */}
      <Handle
        id="left-target"
        type="target"
        position={Position.Left}
        className="!bg-rose-500 !w-2 !h-2 !border-2 !border-background !-left-1"
      />

      <LogOut className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
      <div className="flex flex-col">
        <span className="text-xs font-bold uppercase tracking-wider leading-none">Exit</span>
        <span className="text-[9px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">{visits} cases</span>
      </div>
    </div>
  );
}
