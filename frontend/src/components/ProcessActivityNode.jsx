import React from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  AlertTriangle,
  Activity,
  TrendingDown,
  Clock,
  RotateCcw,
  Layers
} from 'lucide-react';

export function ProcessActivityNode({ data, selected }) {
  const {
    label,
    role,
    visits = 0,
    drop_off_pct = 0,
    avg_time_spent = 0,
    rework_count = 0,
    frequency_pct = 0,
    selectedMetric = 'frequency',
    isDimmed,
    isHighlighted,
    isBottleneck
  } = data;

  // Derive metric-specific display
  let metricLabel = `${frequency_pct}% of cases`;
  let metricColor = 'text-muted-foreground';

  if (selectedMetric === 'avg_time') {
    metricLabel = `Avg dwell: ${avg_time_spent}s`;
    if (avg_time_spent > 30) {
      metricColor = 'text-amber-600 dark:text-amber-400 font-semibold';
    }
  } else if (selectedMetric === 'drop_off') {
    metricLabel = `${drop_off_pct}% drop-off`;
    if (drop_off_pct > 15) {
      metricColor = 'text-rose-600 dark:text-rose-400 font-bold';
    } else {
      metricColor = 'text-muted-foreground';
    }
  } else if (selectedMetric === 'rework') {
    metricLabel = rework_count > 0 ? `${rework_count} rework loops` : '0 rework';
    if (rework_count > 0) {
      metricColor = 'text-amber-600 dark:text-amber-400 font-semibold';
    }
  }

  // Subtle process-mining style borders & styling
  let borderStyle = 'border-border';
  let bgStyle = 'bg-card';
  let StatusIcon = null;
  let statusIconColor = '';

  if (isBottleneck || role === 'bottleneck') {
    borderStyle = 'border-amber-500/80 dark:border-amber-400/80 ring-1 ring-amber-500/20';
    StatusIcon = AlertTriangle;
    statusIconColor = 'text-amber-500';
  } else if (role === 'high_traffic') {
    borderStyle = 'border-teal-500/60 dark:border-teal-400/60';
    StatusIcon = Activity;
    statusIconColor = 'text-teal-500';
  } else if (role === 'high_abandonment' || drop_off_pct >= 20) {
    borderStyle = 'border-rose-500/60 dark:border-rose-400/60';
    StatusIcon = TrendingDown;
    statusIconColor = 'text-rose-500';
  }

  // Additional metric mode visual adjustments
  if (selectedMetric === 'rework') {
    if (rework_count > 0) {
      borderStyle = 'border-amber-500 ring-2 ring-amber-500/30';
      bgStyle = 'bg-amber-500/5 dark:bg-amber-500/10';
      StatusIcon = RotateCcw;
      statusIconColor = 'text-amber-500';
    }
  } else if (selectedMetric === 'drop_off' && drop_off_pct > 15) {
    borderStyle = 'border-rose-500 ring-2 ring-rose-500/20';
    bgStyle = 'bg-rose-500/5 dark:bg-rose-500/10';
  } else if (selectedMetric === 'avg_time' && avg_time_spent > 30) {
    borderStyle = 'border-amber-500/70 ring-1 ring-amber-500/20';
    StatusIcon = Clock;
    statusIconColor = 'text-amber-500';
  }

  const isReworkDimmed = selectedMetric === 'rework' && rework_count === 0;

  return (
    <div
      className={`relative w-[170px] h-[74px] rounded-xl border p-2.5 flex flex-col justify-between transition-all duration-200 cursor-pointer select-none shadow-xs ${borderStyle} ${bgStyle} ${
        selected ? 'ring-2 ring-primary shadow-md scale-[1.02] z-20' : 'hover:shadow-sm hover:border-primary/60'
      } ${
        isDimmed || isReworkDimmed ? 'opacity-35 grayscale-[40%]' : 'opacity-100'
      } ${
        isHighlighted && !selected ? 'ring-2 ring-primary/60' : ''
      }`}
    >
      {/* Handles */}
      {/* Incoming left handle */}
      <Handle
        id="left-target"
        type="target"
        position={Position.Left}
        className="!bg-primary !w-2 !h-2 !border-2 !border-background !-left-1"
      />

      {/* Rework loop landing handle (top-left) */}
      <Handle
        id="top-target"
        type="target"
        position={Position.Top}
        className="!bg-amber-500 !w-2 !h-2 !border-2 !border-background !left-1/4"
      />

      {/* Rework loop departing handle (top-right) */}
      <Handle
        id="top-source"
        type="source"
        position={Position.Top}
        className="!bg-amber-500 !w-2 !h-2 !border-2 !border-background !left-3/4"
      />

      {/* Outgoing exit handle (bottom) */}
      <Handle
        id="bottom-source"
        type="source"
        position={Position.Bottom}
        className="!bg-rose-500 !w-2 !h-2 !border-2 !border-background !-bottom-1"
      />

      {/* Outgoing right handle */}
      <Handle
        id="right-source"
        type="source"
        position={Position.Right}
        className="!bg-primary !w-2 !h-2 !border-2 !border-background !-right-1"
      />

      {/* Top Row: Activity Name + Optional Status Icon */}
      <div className="flex items-center justify-between gap-1">
        <span
          className="font-bold text-xs text-foreground truncate tracking-tight"
          title={label}
        >
          {label}
        </span>
        {StatusIcon && (
          <StatusIcon className={`w-3.5 h-3.5 shrink-0 ${statusIconColor}`} />
        )}
      </div>

      {/* Middle & Bottom Rows: Cases and Selected Metric Value */}
      <div className="flex flex-col gap-0.5 pt-0.5">
        <span className="text-[11px] text-muted-foreground leading-tight">
          <strong className="text-foreground font-semibold">
            {visits?.toLocaleString() || 0}
          </strong>{' '}
          cases
        </span>
        <span className={`text-[10px] leading-tight ${metricColor}`}>
          {metricLabel}
        </span>
      </div>
    </div>
  );
}
