import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ELK from 'elkjs/lib/elk.bundled.js';
import {
  Badge,
  Button,
  Slider,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from './ui';
import {
  Activity,
  Clock,
  TrendingDown,
  RotateCcw,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  RefreshCw,
  Compass,
  Zap,
  Info
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useWorkflow } from '../context/WorkflowContext';
import { ProcessActivityNode } from './ProcessActivityNode';
import { ProcessTerminalNode } from './ProcessTerminalNode';
import { ProcessMapEdge } from './ProcessMapEdge';

const nodeTypes = {
  processActivity: ProcessActivityNode,
  processTerminal: ProcessTerminalNode
};

const edgeTypes = {
  processEdge: ProcessMapEdge
};

const elk = new ELK();

function ProcessMapInner({
  graphData,
  pathsData,
  onNodeSelect,
  selectedNodeId
}) {
  const { theme } = useTheme();
  const { currentWorkflow } = useWorkflow();
  const { setViewport, getViewport } = useReactFlow();

  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Process Map Metrics: 'frequency' | 'avg_time' | 'drop_off' | 'rework'
  const [selectedMetric, setSelectedMetric] = useState('frequency');

  // Complexity control: 0 (Most Relevant, ~top 30%) to 100 (All Paths, 100%)
  const [pathDetail, setPathDetail] = useState(60);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLayoutReady, setIsLayoutReady] = useState(false);

  // 1. Identify dominant backbone from path analytics
  const backboneSteps = useMemo(() => {
    if (pathsData?.top_successful_paths?.length > 0 && pathsData.top_successful_paths[0]?.steps?.length > 0) {
      return pathsData.top_successful_paths[0].steps;
    }
    if (pathsData?.shortest_successful_path?.length > 0) {
      return pathsData.shortest_successful_path;
    }
    // Fallback: collect non-exit nodes
    return graphData?.nodes
      ?.filter(n => n.id !== (currentWorkflow?.exit_step || 'exit'))
      ?.map(n => n.id) || [];
  }, [pathsData, graphData, currentWorkflow]);

  // Set of backbone edge signatures: "source->target"
  const backboneEdgeSet = useMemo(() => {
    const set = new Set();
    for (let i = 0; i < backboneSteps.length - 1; i++) {
      set.add(`${backboneSteps[i]}->${backboneSteps[i + 1]}`);
    }
    return set;
  }, [backboneSteps]);

  // 2. Filter edges based on Path Detail Slider
  const filteredRawEdges = useMemo(() => {
    if (!graphData?.edges?.length) return [];

    const exitStepId = currentWorkflow?.exit_step || 'exit';
    const nonBackboneEdges = [];
    const mustKeepEdges = [];

    graphData.edges.forEach((e) => {
      const isBb = backboneEdgeSet.has(`${e.source}->${e.target}`);
      if (isBb) {
        mustKeepEdges.push(e);
      } else {
        nonBackboneEdges.push(e);
      }
    });

    // Sort non-backbone edges descending by weight
    nonBackboneEdges.sort((a, b) => (b.weight || 0) - (a.weight || 0));

    // Calculate how many non-backbone edges to keep:
    // pathDetail = 0 -> top 30%
    // pathDetail = 100 -> 100%
    const keepRatio = 0.3 + (pathDetail / 100) * 0.7;
    const keepCount = Math.max(1, Math.round(nonBackboneEdges.length * keepRatio));
    const keptNonBackbone = nonBackboneEdges.slice(0, keepCount);

    return [...mustKeepEdges, ...keptNonBackbone];
  }, [graphData, backboneEdgeSet, pathDetail, currentWorkflow]);

  // 3. Compute ELK layout
  useEffect(() => {
    if (!graphData?.nodes?.length) {
      setNodes([]);
      setEdges([]);
      return;
    }

    let isMounted = true;
    const exitStepId = currentWorkflow?.exit_step || 'exit';
    const startStepId = backboneSteps[0] || 'start';
    const successStepId = backboneSteps[backboneSteps.length - 1] || 'submit';

    // Build ELK children
    const elkChildren = graphData.nodes.map((n) => {
      const isStart = n.id === startStepId || n.role === 'start';
      const isSuccess = n.id === successStepId || n.role === 'successful_completion';
      const isExit = n.id === exitStepId || n.role === 'exit';
      const isTerminal = isStart || isSuccess || isExit;

      const width = isTerminal ? 94 : 170;
      const height = isTerminal ? 44 : 74;

      const ports = [];
      if (!isStart) {
        ports.push({ id: `${n.id}_in`, layoutOptions: { 'port.side': 'WEST' } });
      }
      if (!isSuccess && !isExit) {
        ports.push({ id: `${n.id}_out`, layoutOptions: { 'port.side': 'EAST' } });
      }
      if (isExit) {
        ports.push({ id: `${n.id}_in_north`, layoutOptions: { 'port.side': 'NORTH' } });
      }
      if (!isExit && !isSuccess) {
        ports.push({ id: `${n.id}_exit_south`, layoutOptions: { 'port.side': 'SOUTH' } });
      }

      return {
        id: n.id,
        width,
        height,
        layoutOptions: { 'elk.portConstraints': 'FIXED_SIDE' },
        ports
      };
    });

    // Build ELK forward edges (exclude backward edges to avoid cycle breaking distortion)
    const elkEdges = [];
    filteredRawEdges.forEach((e, idx) => {
      if (e.is_backward) return; // routed separately via upward curved arcs

      const isExitTarget = e.target === exitStepId;
      let srcPort = `${e.source}_out`;
      let tgtPort = `${e.target}_in`;

      if (isExitTarget) {
        srcPort = `${e.source}_exit_south`;
        tgtPort = `${exitStepId}_in_north`;
      }

      elkEdges.push({
        id: `elk_e_${idx}`,
        sources: [srcPort],
        targets: [tgtPort],
        layoutOptions: {
          'elk.priority': isExitTarget ? '5' : '100'
        }
      });
    });

    const elkGraph = {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': 'RIGHT',
        'elk.spacing.nodeNode': '50',
        'elk.layered.spacing.nodeNodeBetweenLayers': '80',
        'elk.edgeRouting': 'SPLINES',
        'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
        'elk.layered.nodePlacement.favorStraightEdges': 'true',
        'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP'
      },
      children: elkChildren,
      edges: elkEdges
    };

    elk.layout(elkGraph).then((layoutRes) => {
      if (!isMounted) return;

      const positionMap = new Map();
      layoutRes.children.forEach((c) => {
        positionMap.set(c.id, { x: c.x, y: c.y });
      });

      // Total visits for percentage calculation
      const totalWorkflowVisits = graphData.nodes.reduce((acc, curr) => acc + (curr.visits || 0), 0);
      const maxEdgeWeight = Math.max(...filteredRawEdges.map(e => e.weight || 1), 1);

      // Map to React Flow Nodes
      const flowNodes = graphData.nodes.map((n) => {
        const isStart = n.id === startStepId || n.role === 'start';
        const isSuccess = n.id === successStepId || n.role === 'successful_completion';
        const isExit = n.id === exitStepId || n.role === 'exit';
        const isTerminal = isStart || isSuccess || isExit;

        const terminalType = isStart ? 'start' : isSuccess ? 'success' : isExit ? 'exit' : null;
        const pos = positionMap.get(n.id) || { x: 50, y: 50 };

        // Count rework returns into this node
        const reworkInCount = graphData.edges
          .filter(e => e.target === n.id && e.is_backward)
          .reduce((sum, e) => sum + (e.weight || 0), 0);

        return {
          id: n.id,
          type: isTerminal ? 'processTerminal' : 'processActivity',
          position: pos,
          selected: selectedNodeId === n.id,
          data: {
            ...n,
            rawNode: n,
            terminalType,
            isStart,
            isSuccess,
            isExit,
            selectedMetric,
            rework_count: reworkInCount,
            frequency_pct: totalWorkflowVisits > 0 ? Math.round((n.visits / totalWorkflowVisits) * 100) : 0,
            isBottleneck: n.role === 'bottleneck'
          }
        };
      });

      // Map to React Flow Edges
      const flowEdges = filteredRawEdges.map((e) => {
        const isBackward = Boolean(e.is_backward);
        const isExit = e.target === exitStepId;
        const isBackbone = backboneEdgeSet.has(`${e.source}->${e.target}`);

        // Source and target handle bindings
        let sourceHandle = 'right-source';
        let targetHandle = 'left-target';

        if (isBackward) {
          sourceHandle = 'top-source';
          targetHandle = 'top-target';
        } else if (isExit) {
          sourceHandle = 'bottom-source';
          targetHandle = 'top-target';
        }

        const sourceNode = graphData.nodes.find(n => n.id === e.source);
        const targetNode = graphData.nodes.find(n => n.id === e.target);

        return {
          id: `edge_${e.source}_${e.target}`,
          source: e.source,
          target: e.target,
          sourceHandle,
          targetHandle,
          type: 'processEdge',
          data: {
            ...e,
            sourceLabel: sourceNode?.label || e.source,
            targetLabel: targetNode?.label || e.target,
            is_backward: isBackward,
            is_exit: isExit,
            is_backbone: isBackbone,
            maxWeight: maxEdgeWeight,
            selectedMetric
          }
        };
      });

      setNodes(flowNodes);
      setEdges(flowEdges);
      setIsLayoutReady(true);
    }).catch(err => {
      console.error("ELK layout failed:", err);
    });

    return () => {
      isMounted = false;
    };
  }, [graphData, filteredRawEdges, selectedMetric, selectedNodeId, backboneSteps, backboneEdgeSet, currentWorkflow]);

  // Center & zoom on the backbone without shrinking to tiny nodes
  const fitProcessBackbone = useCallback(() => {
    if (!containerRef.current || nodes.length === 0) return;

    const containerWidth = containerRef.current.clientWidth || 1000;
    const containerHeight = containerRef.current.clientHeight || 450;

    // Find bounding box of backbone nodes
    const backboneNodeList = nodes.filter(n => backboneSteps.includes(n.id));
    if (backboneNodeList.length === 0) return;

    let minX = Infinity;
    let maxX = -Infinity;
    let avgY = 0;

    backboneNodeList.forEach((n) => {
      minX = Math.min(minX, n.position.x);
      maxX = Math.max(maxX, n.position.x + (n.type === 'processTerminal' ? 94 : 170));
      avgY += n.position.y + 37;
    });
    avgY /= backboneNodeList.length;

    const backboneWidth = maxX - minX;
    // Set readable zoom: between 0.88 and 1.0 depending on container width
    const targetZoom = Math.min(1.0, Math.max(0.85, (containerWidth - 100) / Math.max(backboneWidth, 1)));

    const targetX = 50;
    const targetY = (containerHeight / 2) - (avgY * targetZoom);

    setViewport({ x: targetX, y: targetY, zoom: targetZoom }, { duration: 300 });
  }, [nodes, backboneSteps, setViewport]);

  // Trigger initial viewport alignment once layout is ready
  useEffect(() => {
    if (isLayoutReady && nodes.length > 0) {
      const timer = setTimeout(() => {
        fitProcessBackbone();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isLayoutReady, fitProcessBackbone]);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleNodeClick = (_, node) => {
    if (node.data?.rawNode && onNodeSelect) {
      onNodeSelect(node.data.rawNode);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl border border-border bg-card shadow-sm flex flex-col overflow-hidden transition-all duration-200 ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen rounded-none' : 'min-h-[460px] h-[520px]'
      }`}
    >
      {/* ── Process Map Controls Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-muted/30 border-b border-border z-10">
        {/* Left Side: Metric Selector & Path Detail Slider */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Metric Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Metric:
            </span>
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-[145px] h-8 text-xs bg-background">
                <SelectValue placeholder="Metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="frequency">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-teal-500" />
                    <span>Frequency</span>
                  </div>
                </SelectItem>
                <SelectItem value="avg_time">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Average Time</span>
                  </div>
                </SelectItem>
                <SelectItem value="drop_off">
                  <div className="flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                    <span>Drop-off Rate</span>
                  </div>
                </SelectItem>
                <SelectItem value="rework">
                  <div className="flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                    <span>Rework</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="h-4 w-px bg-border/80 hidden sm:block" />

          {/* Path Detail Slider */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
              Path Detail:
            </span>
            <div className="flex items-center gap-2 w-40 sm:w-48">
              <span className="text-[10px] text-muted-foreground select-none shrink-0">
                Most Relevant
              </span>
              <Slider
                value={[pathDetail]}
                onValueChange={(val) => setPathDetail(val[0])}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
              <span className="text-[10px] text-muted-foreground select-none shrink-0">
                All Paths
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Process Canvas View Actions */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fitProcessBackbone}
            className="h-8 text-xs gap-1.5 px-3"
            title="Fit readable process backbone"
          >
            <Zap className="w-3.5 h-3.5 text-primary" />
            Fit Process
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-8 w-8"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>

      {/* ── React Flow Interactive Process Canvas ── */}
      <div className="flex-1 w-full h-full relative bg-muted/10">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{
            type: 'processEdge'
          }}
          panOnDrag={true}
          zoomOnScroll={true}
          minZoom={0.3}
          maxZoom={1.5}
          nodesDraggable={true}
          elementsSelectable={true}
          fitView={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            gap={20}
            size={1.2}
            color={theme === 'dark' ? '#334155' : '#cbd5e1'}
            className="opacity-40"
          />
          <Controls
            showInteractive={false}
            showFitView={false}
            position="bottom-left"
            className="!bg-background !border-border !shadow-sm !rounded-xl !overflow-hidden [&>button]:!border-border [&>button]:!bg-background [&>button]:!text-foreground"
          />
        </ReactFlow>

        {/* Process Map Legend Indicator */}
        <div className="absolute bottom-3 right-3 z-10 pointer-events-none flex items-center gap-3 px-3 py-1.5 rounded-xl bg-card/85 border border-border text-[10px] text-muted-foreground backdrop-blur-md shadow-xs">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-teal-600 rounded-full" />
            <span>Main Backbone</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-amber-500 rounded-full border-t border-dashed" />
            <span>Rework Loop</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-rose-500 rounded-full" />
            <span>Exit / Drop-off</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProcessMapCanvas(props) {
  // Check empty state
  if (!props.graphData?.nodes || props.graphData.nodes.length === 0) {
    return (
      <div className="w-full h-[460px] rounded-2xl border border-dashed border-border bg-card/50 flex flex-col items-center justify-center p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <Info className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-base text-foreground">
          No workflow event data available.
        </h3>
        <p className="text-xs text-muted-foreground max-w-md">
          Import or generate workflow events to build the digital twin process map.
        </p>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <ProcessMapInner {...props} />
    </ReactFlowProvider>
  );
}
