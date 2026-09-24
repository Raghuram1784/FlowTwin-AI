import React, { useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, getSmoothStepPath } from '@xyflow/react';

export function WorkflowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected
}) {
  const [isHovered, setIsHovered] = useState(false);

  const isBackward = Boolean(data?.is_backward);
  const isExit = Boolean(data?.is_exit);
  const isMainPath = Boolean(data?.is_main_path);
  const forceShow = Boolean(data?.forceShowLabel);

  let edgePath = '';
  let labelX = 0;
  let labelY = 0;

  if (isBackward) {
    // Backward rework transition:
    // Create an upward curved quadratic bezier arc so it loops above the horizontal mainline
    const dx = Math.abs(targetX - sourceX);
    const arcHeight = Math.max(55, Math.min(110, dx * 0.22));
    const midX = (sourceX + targetX) / 2;
    const midY = Math.min(sourceY, targetY) - arcHeight;

    edgePath = `M ${sourceX} ${sourceY} Q ${midX} ${midY} ${targetX} ${targetY}`;
    labelX = midX;
    labelY = midY + 16;
  } else if (isExit) {
    // Abandonment branch stepping downwards to the terminal exit node
    const [path, lx, ly] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 16
    });
    edgePath = path;
    labelX = lx;
    labelY = ly;
  } else {
    // Normal or main-flow forward transition
    const [path, lx, ly] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      curvature: 0.18
    });
    edgePath = path;
    labelX = lx;
    labelY = ly;
  }

  const showLabel = isHovered || selected || forceShow;

  return (
    <>
      {/* Invisible wider interaction zone for effortless hover/click */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={26}
        className="cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {/* Visible Edge Line */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          strokeWidth: isHovered || selected ? (style.strokeWidth || 2) + 1.8 : style.strokeWidth,
          transition: 'stroke-width 0.2s ease, stroke 0.2s ease, opacity 0.2s ease'
        }}
        markerEnd={markerEnd}
      />

      {/* Floating Glassmorphic Pill Label (on hover or selection) */}
      {showLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              zIndex: 100
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group"
          >
            <div
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-tight shadow-md border backdrop-blur-md transition-all duration-150 flex items-center gap-1.5 cursor-pointer select-none ${
                isExit
                  ? 'bg-destructive/15 text-destructive border-destructive/40 shadow-destructive/10'
                  : isBackward
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 shadow-amber-500/10'
                  : isMainPath
                  ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/40 shadow-teal-500/10'
                  : 'bg-card/95 text-foreground border-border shadow-xs'
              } ${isHovered || selected ? 'scale-105 ring-2 ring-primary/40' : ''}`}
            >
              <span>{data?.weight?.toLocaleString() || 0} users</span>
              <span className="opacity-40">•</span>
              <span>{data?.transition_rate || 0}%</span>
              {isBackward && <span className="text-[10px] text-amber-500 font-bold ml-0.5">(Rework)</span>}
              {isExit && <span className="text-[10px] text-destructive font-bold ml-0.5">(Drop)</span>}
            </div>

            {/* Hover Tooltip with Full Telemetry */}
            {isHovered && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-3 py-2 rounded-xl bg-popover text-popover-foreground text-[10px] shadow-xl border border-border whitespace-nowrap z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                <div className="font-semibold text-foreground mb-0.5 flex items-center gap-1.5">
                  <span>{data?.sourceLabel}</span>
                  <span className="text-muted-foreground">→</span>
                  <span>{data?.targetLabel}</span>
                </div>
                <div className="text-muted-foreground flex items-center gap-2 pt-0.5">
                  <span>Volume: <strong className="text-foreground">{data?.weight} users</strong></span>
                  <span>•</span>
                  <span>Rate: <strong className="text-foreground">{data?.transition_rate}%</strong></span>
                  {data?.average_transition_time > 0 && (
                    <>
                      <span>•</span>
                      <span>Avg Dwell: <strong className="text-foreground">{data?.average_transition_time}s</strong></span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
