import React, { useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, getSmoothStepPath } from '@xyflow/react';

export function ProcessMapEdge({
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
  const isBackbone = Boolean(data?.is_backbone);
  const selectedMetric = data?.selectedMetric || 'frequency';

  let edgePath = '';
  let labelX = 0;
  let labelY = 0;

  if (isBackward) {
    // Upward curved arc for backward rework loop
    const dx = Math.abs(targetX - sourceX);
    const arcHeight = Math.max(50, Math.min(100, dx * 0.2));
    const midX = (sourceX + targetX) / 2;
    const midY = Math.min(sourceY, targetY) - arcHeight;

    edgePath = `M ${sourceX} ${sourceY} Q ${midX} ${midY} ${targetX} ${targetY}`;
    labelX = midX;
    labelY = midY + 12;
  } else if (isExit) {
    // Stepping downward branch for abandonment exit
    const [path, lx, ly] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 14
    });
    edgePath = path;
    labelX = lx;
    labelY = ly;
  } else {
    // Standard forward transition
    const [path, lx, ly] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      curvature: 0.16
    });
    edgePath = path;
    labelX = lx;
    labelY = ly;
  }

  // Edge coloring based on role and selected metric
  let strokeColor = '#94a3b8'; // default neutral slate
  let dashArray = undefined;

  if (isExit) {
    strokeColor = '#ef4444'; // Red for abandonment
  } else if (isBackward) {
    strokeColor = '#f59e0b'; // Amber for rework
    dashArray = '6 4';
  } else if (isBackbone) {
    strokeColor = '#0d9488'; // Strong teal for main backbone
  }

  // Metric-specific edge emphasis
  if (selectedMetric === 'rework') {
    if (isBackward) {
      strokeColor = '#f59e0b';
      dashArray = '6 3';
    } else {
      // Mute forward backbone in rework mode
      strokeColor = '#cbd5e1';
    }
  } else if (selectedMetric === 'avg_time' && data?.average_transition_time > 30) {
    strokeColor = '#d97706'; // highlight slower transitions
  }

  // Base thickness calculation (scales from 2px up to 7px based on weight)
  const maxWeight = data?.maxWeight || 500;
  const weightRatio = Math.max(0.1, Math.min(1, (data?.weight || 1) / maxWeight));
  let baseWidth = Math.max(1.8, Math.min(7, 1.8 + weightRatio * 5.2));

  if (isBackward && selectedMetric === 'rework') {
    baseWidth = Math.max(3.5, baseWidth);
  }

  const currentStrokeWidth = isHovered || selected ? baseWidth + 1.8 : baseWidth;

  return (
    <>
      {/* Invisible wider hover path */}
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
          stroke: strokeColor,
          strokeWidth: currentStrokeWidth,
          strokeDasharray: dashArray,
          opacity: selectedMetric === 'rework' && !isBackward ? 0.35 : 0.9,
          transition: 'stroke-width 0.15s ease, stroke 0.15s ease, opacity 0.15s ease'
        }}
        markerEnd={markerEnd}
      />

      {/* Floating Hover Tooltip - ONLY SHOWN ON HOVER */}
      {isHovered && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -100%) translate(${labelX}px,${labelY - 10}px)`,
              pointerEvents: 'none',
              zIndex: 1000
            }}
          >
            <div className="px-3 py-2 rounded-xl bg-popover/95 text-popover-foreground text-xs shadow-xl border border-border backdrop-blur-md whitespace-nowrap animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-1">
              <div className="font-bold text-foreground flex items-center gap-1.5 border-b border-border/50 pb-1">
                <span>{data?.sourceLabel}</span>
                <span className="text-muted-foreground">→</span>
                <span>{data?.targetLabel}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-0.5">
                <span>
                  Cases: <strong className="text-foreground">{data?.weight?.toLocaleString() || 0}</strong>
                </span>
                <span>•</span>
                <span>
                  Transition Rate: <strong className="text-foreground">{data?.transition_rate || 0}%</strong>
                </span>
                {data?.average_transition_time > 0 && (
                  <>
                    <span>•</span>
                    <span>
                      Avg Time: <strong className="text-foreground">{data?.average_transition_time}s</strong>
                    </span>
                  </>
                )}
              </div>
              {isBackward && (
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  ↺ Rework transition
                </span>
              )}
              {isExit && (
                <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                  ↓ Abandonment transition
                </span>
              )}
              {isBackbone && !isBackward && !isExit && (
                <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400">
                  ★ Core backbone transition
                </span>
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
