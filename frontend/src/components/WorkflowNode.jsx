import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Badge } from './ui';
import {
  Compass,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  Activity,
  LogOut,
  Layers,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export function WorkflowNode({ data, selected }) {
  const {
    label,
    role,
    visits,
    drop_off_pct,
    isDimmed,
    isHighlighted,
    isExitNode,
    isSuccessNode,
    isStartNode
  } = data;

  const roleConfig = {
    start: {
      badge: "Start",
      badgeVariant: "default",
      border: "border-blue-500/80 dark:border-blue-400 shadow-blue-500/10",
      bg: "bg-blue-50/70 dark:bg-blue-950/40",
      accent: "text-blue-600 dark:text-blue-400",
      icon: Compass,
      statusLabel: "Initial Step"
    },
    successful_completion: {
      badge: "Goal (Success)",
      badgeVariant: "success",
      border: "border-emerald-500/90 dark:border-emerald-400 ring-2 ring-emerald-500/20 shadow-emerald-500/10",
      bg: "bg-emerald-50/70 dark:bg-emerald-950/40",
      accent: "text-emerald-600 dark:text-emerald-400",
      icon: CheckCircle2,
      statusLabel: "Converted"
    },
    bottleneck: {
      badge: "Bottleneck",
      badgeVariant: "warning",
      border: "border-amber-500 ring-2 ring-amber-500/25 shadow-amber-500/10",
      bg: "bg-amber-50/70 dark:bg-amber-950/40",
      accent: "text-amber-600 dark:text-amber-400",
      icon: AlertTriangle,
      statusLabel: "Choke Point"
    },
    high_abandonment: {
      badge: "High Drop-off",
      badgeVariant: "destructive",
      border: "border-destructive ring-2 ring-destructive/25 shadow-destructive/10",
      bg: "bg-destructive/10 dark:bg-destructive/25",
      accent: "text-destructive",
      icon: TrendingDown,
      statusLabel: "Critical Drop"
    },
    high_traffic: {
      badge: "High Traffic",
      badgeVariant: "teal",
      border: "border-teal-500/80 dark:border-teal-400 ring-1 ring-teal-500/20 shadow-teal-500/10",
      bg: "bg-teal-50/70 dark:bg-teal-950/40",
      accent: "text-teal-600 dark:text-teal-400",
      icon: Activity,
      statusLabel: "High Volume"
    },
    exit: {
      badge: "Exit / Drop-off",
      badgeVariant: "destructive",
      border: "border-dashed border-2 border-slate-400 dark:border-slate-600",
      bg: "bg-muted/50 dark:bg-slate-900/60",
      accent: "text-muted-foreground",
      icon: LogOut,
      statusLabel: "Abandoned"
    },
    normal: {
      badge: "Step",
      badgeVariant: "secondary",
      border: "border-border shadow-xs",
      bg: "bg-card",
      accent: "text-foreground",
      icon: Layers,
      statusLabel: "Standard Stage"
    }
  };

  const config = roleConfig[role] || roleConfig.normal;
  const RoleIcon = config.icon;

  return (
    <div
      className={`relative w-[210px] h-[94px] rounded-xl border p-2.5 flex flex-col justify-between transition-all duration-200 cursor-pointer select-none ${
        config.border
      } ${config.bg} ${
        selected ? 'ring-3 ring-primary shadow-lg scale-[1.03] z-20' : 'hover:shadow-md hover:scale-[1.01]'
      } ${
        isDimmed ? 'opacity-25 grayscale-[60%]' : 'opacity-100'
      } ${
        isHighlighted && !selected ? 'ring-2 ring-primary/80 scale-[1.02]' : ''
      }`}
    >
      {/* Target Handle on Left (for standard forward incoming transitions) */}
      {!isStartNode && (
        <Handle
          id="left-target"
          type="target"
          position={Position.Left}
          className="!bg-primary !w-2.5 !h-2.5 !border-2 !border-background !-left-1.5"
        />
      )}

      {/* Target Handle on Top (for backward rework loops landing from above) */}
      <Handle
        id="top-target"
        type="target"
        position={Position.Top}
        className="!bg-amber-500 !w-2.5 !h-2.5 !border-2 !border-background !left-1/3"
      />

      {/* Source Handle on Top (for backward rework loops launching upward) */}
      <Handle
        id="top-source"
        type="source"
        position={Position.Top}
        className="!bg-amber-500 !w-2.5 !h-2.5 !border-2 !border-background !left-2/3"
      />

      {/* Source Handle on Bottom (for downward abandonment transitions heading to exit) */}
      {!isExitNode && (
        <Handle
          id="bottom-source"
          type="source"
          position={Position.Bottom}
          className="!bg-destructive !w-2.5 !h-2.5 !border-2 !border-background !-bottom-1.5"
        />
      )}

      {/* Header: Label + Role Icon + Badge */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <RoleIcon className={`w-3.5 h-3.5 shrink-0 ${config.accent}`} />
          <span
            className="font-bold text-xs text-foreground truncate"
            title={label}
          >
            {label}
          </span>
        </div>
        <Badge
          variant={config.badgeVariant}
          className="text-[9px] py-0 px-1.5 shrink-0 font-medium"
        >
          {config.badge}
        </Badge>
      </div>

      {/* Middle: Visits & Drop-off % */}
      <div className="flex items-baseline justify-between text-[11px] pt-1 border-t border-border/40">
        <span className="text-muted-foreground text-[10px]">
          <strong className="text-foreground font-semibold">{visits?.toLocaleString() || 0}</strong> visits
        </span>
        <span className={`text-[10px] font-semibold ${drop_off_pct > 20 ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
          {drop_off_pct}% drop-off
        </span>
      </div>

      {/* Bottom Status Tag */}
      <div className="flex items-center justify-between text-[10px] pt-0.5">
        <span className={`flex items-center gap-1 font-medium ${config.accent}`}>
          {config.statusLabel}
        </span>
        <span className="text-[9px] text-muted-foreground opacity-60">
          Click for details
        </span>
      </div>

      {/* Source Handle on Right (for standard forward outgoing transitions) */}
      {!isExitNode && !isSuccessNode && (
        <Handle
          id="right-source"
          type="source"
          position={Position.Right}
          className="!bg-primary !w-2.5 !h-2.5 !border-2 !border-background !-right-1.5"
        />
      )}
    </div>
  );
}
