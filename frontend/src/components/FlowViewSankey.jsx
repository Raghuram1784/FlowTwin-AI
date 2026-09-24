import React, { useMemo, useRef, useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, Badge, Button } from './ui';
import { Layers, Activity, AlertTriangle, TrendingDown, CheckCircle2, LogOut, Compass, Sparkles, Info } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useWorkflow } from '../context/WorkflowContext';

export function FlowViewSankey({ graphData, pathsData, onNodeSelect }) {
  const { resolvedTheme } = useTheme();
  const { currentWorkflow, getStepLabel } = useWorkflow();
  const echartsRef = useRef(null);

  const startStepId = currentWorkflow?.start_step || 'start';
  const successStepId = currentWorkflow?.success_step || 'submit';
  const exitStepId = currentWorkflow?.exit_step || 'exit';
  const canonicalSteps = currentWorkflow?.steps || [];

  // Order map for steps
  const stepOrderMap = useMemo(() => {
    const map = {};
    canonicalSteps.forEach((s, idx) => {
      map[s.id] = s.order ?? idx;
    });
    return map;
  }, [canonicalSteps]);

  // Color mapping by role
  const getRoleColor = (role, isDark) => {
    switch (role) {
      case 'start':
        return isDark ? '#3b82f6' : '#2563eb'; // blue
      case 'successful_completion':
        return isDark ? '#10b981' : '#059669'; // emerald green
      case 'bottleneck':
        return isDark ? '#f59e0b' : '#d97706'; // amber
      case 'high_abandonment':
        return isDark ? '#f97316' : '#ea580c'; // orange/red
      case 'high_traffic':
        return isDark ? '#14b8a6' : '#0d9488'; // teal
      case 'exit':
        return isDark ? '#ef4444' : '#dc2626'; // red
      default:
        return isDark ? '#64748b' : '#475569'; // neutral slate
    }
  };

  const getRoleName = (role) => {
    switch (role) {
      case 'start': return 'Start / Entry';
      case 'successful_completion': return 'Goal (Success)';
      case 'bottleneck': return 'Bottleneck Choke Point';
      case 'high_abandonment': return 'High Abandonment';
      case 'high_traffic': return 'High Traffic Core';
      case 'exit': return 'Exit / Drop-off';
      default: return 'Standard Step';
    }
  };

  // Convert graphData nodes and edges to Sankey dataset
  const { sankeyNodes, sankeyLinks } = useMemo(() => {
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
      return { sankeyNodes: [], sankeyLinks: [] };
    }

    const isDark = resolvedTheme === 'dark';
    const nodeLookup = {};
    graphData.nodes.forEach(n => {
      nodeLookup[n.id] = n;
    });

    const nodes = [];
    const addedNodeNames = new Set();

    // 1. Add canonical nodes
    graphData.nodes.forEach(n => {
      const label = n.label || getStepLabel(n.id);
      if (!addedNodeNames.has(label)) {
        addedNodeNames.add(label);
        nodes.push({
          name: label,
          id: n.id,
          role: n.role,
          visits: n.visits,
          drop_off_pct: n.drop_off_pct,
          avg_time_spent: n.avg_time_spent,
          pagerank: n.pagerank,
          rawNode: n,
          itemStyle: {
            color: getRoleColor(n.role, isDark),
            borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
            borderWidth: 1.5,
            borderRadius: 4
          }
        });
      }
    });

    // 2. Add Links & Rework Nodes
    const links = [];
    const maxWeight = Math.max(...(graphData.edges.map(e => e.weight) || [1]), 1);

    graphData.edges.forEach(e => {
      const srcNode = nodeLookup[e.source];
      const tgtNode = nodeLookup[e.target];
      if (!srcNode || !tgtNode) return;

      const srcLabel = srcNode.label || getStepLabel(srcNode.id);
      let tgtLabel = tgtNode.label || getStepLabel(tgtNode.id);

      const srcOrder = stepOrderMap[e.source] ?? 0;
      const tgtOrder = stepOrderMap[e.target] ?? 0;
      const isExit = e.target === exitStepId || tgtNode.role === 'exit';
      const isBackward = Boolean(e.is_backward || (tgtOrder < srcOrder && !isExit));

      // If backward rework loop, route to a virtual rework node to keep Sankey DAG strictly acyclic:
      if (isBackward) {
        tgtLabel = `${tgtLabel} (Rework)`;
        if (!addedNodeNames.has(tgtLabel)) {
          addedNodeNames.add(tgtLabel);
          nodes.push({
            name: tgtLabel,
            id: tgtNode.id,
            role: 'bottleneck',
            visits: e.weight,
            drop_off_pct: tgtNode.drop_off_pct,
            avg_time_spent: e.average_transition_time || tgtNode.avg_time_spent,
            pagerank: tgtNode.pagerank,
            rawNode: tgtNode,
            itemStyle: {
              color: isDark ? '#f59e0b' : '#d97706',
              borderColor: 'rgba(245, 158, 11, 0.4)',
              borderWidth: 1.5,
              borderRadius: 4
            }
          });
        }
      }

      // Link color
      let linkColor = isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(37, 99, 235, 0.28)';
      if (isExit) {
        linkColor = isDark ? 'rgba(239, 68, 68, 0.45)' : 'rgba(220, 38, 38, 0.38)';
      } else if (isBackward) {
        linkColor = isDark ? 'rgba(245, 158, 11, 0.5)' : 'rgba(217, 119, 6, 0.42)';
      } else if (e.weight >= maxWeight * 0.45) {
        linkColor = isDark ? 'rgba(20, 184, 166, 0.45)' : 'rgba(13, 148, 136, 0.38)';
      }

      links.push({
        source: srcLabel,
        target: tgtLabel,
        value: e.weight || 1,
        transition_rate: e.transition_rate || 0,
        average_transition_time: e.average_transition_time || 0,
        is_backward: isBackward,
        is_exit: isExit,
        rawEdge: e,
        lineStyle: {
          color: linkColor,
          curveness: isBackward ? 0.35 : 0.5
        }
      });
    });

    return { sankeyNodes: nodes, sankeyLinks: links };
  }, [graphData, resolvedTheme, stepOrderMap, exitStepId, getStepLabel]);

  // ECharts Option configuration
  const chartOption = useMemo(() => {
    const isDark = resolvedTheme === 'dark';
    const textColor = isDark ? '#e2e8f0' : '#1e293b';
    const mutedColor = isDark ? '#94a3b8' : '#64748b';
    const tooltipBg = isDark ? '#0f172a' : '#ffffff';
    const tooltipBorder = isDark ? '#334155' : '#e2e8f0';

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        borderWidth: 1,
        padding: [10, 14],
        textStyle: {
          color: textColor,
          fontFamily: 'inherit',
          fontSize: 12
        },
        formatter: (params) => {
          if (params.dataType === 'node') {
            const data = params.data;
            const roleName = getRoleName(data.role);
            return `
              <div style="font-weight: 700; font-size: 13px; color: ${textColor}; margin-bottom: 6px;">
                ${data.name}
              </div>
              <div style="display: flex; gap: 8px; font-size: 11px; color: ${mutedColor}; margin-bottom: 4px;">
                <span>Role:</span> <strong style="color: ${textColor};">${roleName}</strong>
              </div>
              <div style="display: flex; gap: 8px; font-size: 11px; color: ${mutedColor}; margin-bottom: 4px;">
                <span>Total Visits:</span> <strong style="color: ${textColor};">${(data.visits || 0).toLocaleString()}</strong>
              </div>
              <div style="display: flex; gap: 8px; font-size: 11px; color: ${mutedColor}; margin-bottom: 4px;">
                <span>Drop-off Rate:</span> <strong style="color: ${data.drop_off_pct > 20 ? '#ef4444' : textColor};">${data.drop_off_pct || 0}%</strong>
              </div>
              <div style="display: flex; gap: 8px; font-size: 11px; color: ${mutedColor}; margin-bottom: 4px;">
                <span>Avg Dwell Time:</span> <strong style="color: ${textColor};">${data.avg_time_spent || 0}s</strong>
              </div>
              <div style="display: flex; gap: 8px; font-size: 11px; color: ${mutedColor};">
                <span>PageRank:</span> <strong style="color: #3b82f6;">${data.pagerank || 0}</strong>
              </div>
              <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid ${tooltipBorder}; font-size: 10px; color: #3b82f6;">
                Click node to open full inspection sheet
              </div>
            `;
          } else if (params.dataType === 'edge') {
            const data = params.data;
            const statusLabel = data.is_exit ? 'Drop-off / Exit Branch' : data.is_backward ? 'Backward Rework Loop' : 'Forward Progression';
            return `
              <div style="font-weight: 700; font-size: 12px; color: ${textColor}; margin-bottom: 6px;">
                ${data.source} → ${data.target}
              </div>
              <div style="display: flex; gap: 8px; font-size: 11px; color: ${mutedColor}; margin-bottom: 4px;">
                <span>Type:</span> <strong style="color: ${data.is_exit ? '#ef4444' : data.is_backward ? '#f59e0b' : '#10b981'};">${statusLabel}</strong>
              </div>
              <div style="display: flex; gap: 8px; font-size: 11px; color: ${mutedColor}; margin-bottom: 4px;">
                <span>Flow Volume:</span> <strong style="color: ${textColor};">${(data.value || 0).toLocaleString()} sessions</strong>
              </div>
              <div style="display: flex; gap: 8px; font-size: 11px; color: ${mutedColor}; margin-bottom: 4px;">
                <span>Transition Rate:</span> <strong style="color: ${textColor};">${data.transition_rate || 0}%</strong>
              </div>
              ${data.average_transition_time ? `
                <div style="display: flex; gap: 8px; font-size: 11px; color: ${mutedColor};">
                  <span>Avg Transition Time:</span> <strong style="color: ${textColor};">${data.average_transition_time}s</strong>
                </div>
              ` : ''}
            `;
          }
          return '';
        }
      },
      series: [
        {
          type: 'sankey',
          layout: 'none',
          emphasis: {
            focus: 'adjacency'
          },
          orient: 'horizontal',
          nodeAlign: 'justify',
          nodeWidth: 24,
          nodeGap: 18,
          draggable: true,
          top: 35,
          bottom: 35,
          left: 45,
          right: 140,
          data: sankeyNodes,
          links: sankeyLinks,
          label: {
            position: 'right',
            color: textColor,
            fontSize: 11,
            fontWeight: 600,
            formatter: '{b}'
          },
          lineStyle: {
            color: 'source',
            opacity: 0.45
          }
        }
      ]
    };
  }, [sankeyNodes, sankeyLinks, resolvedTheme]);

  // Click handler to open the detailed node inspection Sheet
  const onChartClick = (params) => {
    if (params.dataType === 'node') {
      const raw = params.data?.rawNode || params.data;
      if (raw && onNodeSelect) {
        onNodeSelect(raw);
      }
    }
  };

  const onEvents = {
    click: onChartClick
  };

  // Resize listener
  useEffect(() => {
    const handleResize = () => {
      if (echartsRef.current) {
        const instance = echartsRef.current.getEchartsInstance();
        instance.resize();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div className="h-[520px] w-full flex flex-col items-center justify-center p-8 text-center bg-card rounded-2xl border border-border">
        <Layers className="w-12 h-12 text-muted-foreground/40 mb-3" />
        <h3 className="font-semibold text-foreground text-sm">No workflow event data available.</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Import or generate workflow events via the Simulator to synthesize the digital twin Flow View.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-2xl border border-border bg-card/60 p-2 shadow-xs transition-all overflow-hidden">
      {/* Legend & Guide Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-b border-border text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Info className="w-4 h-4 text-primary shrink-0" />
          <span>Flow line thickness denotes user volume. Click any stage to open detailed centrality & transition analytics.</span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-foreground font-medium">Start</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
            <span className="text-foreground font-medium">High Volume</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-foreground font-medium">Bottleneck</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-foreground font-medium">Goal Converted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
            <span className="text-foreground font-medium">Exit / Drop</span>
          </div>
        </div>
      </div>

      {/* Sankey Canvas */}
      <div className="w-full h-[540px] pt-2">
        <ReactECharts
          ref={echartsRef}
          option={chartOption}
          onEvents={onEvents}
          style={{ height: '100%', width: '100%' }}
          notMerge={true}
          lazyUpdate={true}
        />
      </div>
    </div>
  );
}
