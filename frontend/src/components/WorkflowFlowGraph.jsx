import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';
import {
  Badge,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Separator,
  Button,
  Progress
} from './ui';
import {
  Compass,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  Activity,
  LogOut,
  Layers,
  BarChart2,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Map as MapIcon,
  Tag,
  Eye,
  SlidersHorizontal,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useWorkflow } from '../context/WorkflowContext';
import { WorkflowNode } from './WorkflowNode';
import { WorkflowEdge } from './WorkflowEdge';

const NODE_WIDTH = 210;
const NODE_HEIGHT = 94;
const HORIZONTAL_SPACING = 290;

/**
 * Computes Left-to-Right layout with Dagre & post-processing alignment:
 * 1. Main canonical path steps are locked horizontally along y = 110.
 * 2. Terminal exit/abandonment node is placed cleanly below at y = 310,
 *    centered under the primary drop-off zone.
 */
function computeGraphLayout(nodes, edges, canonicalSteps = [], exitStepId = 'exit') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 90 });

  nodes.forEach((n) => {
    dagreGraph.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((e) => {
    dagreGraph.setEdge(e.source, e.target);
  });

  dagre.layout(dagreGraph);

  // Map step order for canonical main-line steps (excluding exit)
  const canonicalOrderMap = {};
  const mainCanonicalSteps = canonicalSteps.filter(s => s.id !== exitStepId);
  mainCanonicalSteps.forEach((s, idx) => {
    canonicalOrderMap[s.id] = idx;
  });

  // Identify nodes dropping off to exit
  const exitSourceIds = edges
    .filter(e => e.target === exitStepId)
    .map(e => e.source);

  // Layout calculations
  const layoutedNodes = nodes.map((n) => {
    const isExit = n.id === exitStepId || n.data?.role === 'exit';

    if (isExit) {
      // Place exit node below the primary drop-off zone
      let exitX = 40 + Math.floor(mainCanonicalSteps.length / 2) * HORIZONTAL_SPACING;
      if (exitSourceIds.length > 0) {
        const sourcePositions = exitSourceIds.map(srcId => {
          const idx = canonicalOrderMap[srcId];
          return idx !== undefined ? 40 + idx * HORIZONTAL_SPACING : null;
        }).filter(pos => pos !== null);

        if (sourcePositions.length > 0) {
          exitX = Math.round(sourcePositions.reduce((a, b) => a + b, 0) / sourcePositions.length);
        }
      }

      return {
        ...n,
        position: {
          x: exitX,
          y: 310
        }
      };
    }

    // Mainline step positioning
    const stepOrder = canonicalOrderMap[n.id];
    let posX = 40;
    if (stepOrder !== undefined) {
      posX = 40 + stepOrder * HORIZONTAL_SPACING;
    } else {
      // Fallback to Dagre position if non-canonical
      const dPos = dagreGraph.node(n.id) || { x: 200, y: 110 };
      posX = Math.max(40, dPos.x - NODE_WIDTH / 2);
    }

    return {
      ...n,
      position: {
        x: posX,
        y: 110
      }
    };
  });

  return { nodes: layoutedNodes, edges };
}

function WorkflowFlowGraphInner({
  graphData,
  pathsData,
  onNodeSelect,
  selectedNodeId,
  filterMode = 'all' // all, high_traffic, bottlenecks, successful_paths, failed_paths
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [activeNodeDetails, setActiveNodeDetails] = useState(null);
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [showAllEdgeLabels, setShowAllEdgeLabels] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);
  const { resolvedTheme } = useTheme();
  const { currentWorkflow, getStepLabel } = useWorkflow();
  const { fitView } = useReactFlow();

  const nodeTypes = useMemo(() => ({ workflowNode: WorkflowNode }), []);
  const edgeTypes = useMemo(() => ({ workflowEdge: WorkflowEdge }), []);

  // Determine dynamic roles from workflow metadata
  const startStepId = currentWorkflow?.start_step || 'start';
  const successStepId = currentWorkflow?.success_step || 'submit';
  const exitStepId = currentWorkflow?.exit_step || 'exit';
  const canonicalSteps = currentWorkflow?.steps || [];

  // Identify edges that belong to the primary success highway
  const mainSuccessPath = useMemo(() => {
    if (pathsData?.shortest_successful_path?.length) {
      return pathsData.shortest_successful_path;
    }
    return canonicalSteps
      .filter(s => s.id !== exitStepId)
      .map(s => s.id);
  }, [pathsData, canonicalSteps, exitStepId]);

  const mainPathEdgesSet = useMemo(() => {
    const set = new Set();
    for (let i = 0; i < mainSuccessPath.length - 1; i++) {
      set.add(`${mainSuccessPath[i]}->${mainSuccessPath[i + 1]}`);
    }
    return set;
  }, [mainSuccessPath]);

  // Build reactive nodes and edges whenever inputs change
  useEffect(() => {
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) return;

    const maxWeight = Math.max(...(graphData.edges.map(e => e.weight) || [1]), 1);

    // 1. Process Nodes
    const rawNodes = graphData.nodes.map((n) => {
      let isDimmed = false;
      let isHighlighted = false;

      const isStart = n.id === startStepId || n.role === 'start';
      const isSuccess = n.id === successStepId || n.role === 'successful_completion';
      const isExit = n.id === exitStepId || n.role === 'exit';

      if (filterMode === 'bottlenecks') {
        const isB = n.role === 'bottleneck' || n.role === 'high_abandonment';
        isDimmed = !isB;
        isHighlighted = isB;
      } else if (filterMode === 'high_traffic') {
        const isH = n.role === 'high_traffic' || n.visits >= 0.45 * maxWeight;
        isDimmed = !isH;
        isHighlighted = isH;
      } else if (filterMode === 'successful_paths') {
        if (isExit) isDimmed = true;
        if (mainSuccessPath.includes(n.id)) isHighlighted = true;
      } else if (filterMode === 'failed_paths') {
        if (isSuccess) isDimmed = true;
        if (isExit || n.drop_off_pct > 15) isHighlighted = true;
      }

      return {
        id: n.id,
        type: 'workflowNode',
        data: {
          ...n,
          label: n.label || getStepLabel(n.id),
          role: n.role,
          visits: n.visits,
          drop_off_pct: n.drop_off_pct,
          isDimmed,
          isHighlighted,
          isStartNode: isStart,
          isSuccessNode: isSuccess,
          isExitNode: isExit
        },
        selected: selectedNodeId === n.id
      };
    });

    // 2. Process Edges
    const rawEdges = graphData.edges.map((e) => {
      const isExit = e.target === exitStepId;
      const isBack = Boolean(e.is_backward);
      const isMain = mainPathEdgesSet.has(`${e.source}->${e.target}`);

      // Edge stroke styling
      let edgeColor = resolvedTheme === 'dark' ? '#38bdf8' : '#2563eb';
      let strokeWidth = 2;

      if (isExit) {
        edgeColor = '#ef4444';
        strokeWidth = 2.2;
      } else if (isBack) {
        edgeColor = '#f59e0b';
        strokeWidth = 2.4;
      } else if (isMain) {
        edgeColor = resolvedTheme === 'dark' ? '#14b8a6' : '#0d9488';
        strokeWidth = 3.5;
      } else if (e.weight > maxWeight * 0.4) {
        edgeColor = '#14b8a6';
        strokeWidth = 2.5;
      }

      // Filter handling
      let isDimmed = false;
      if (filterMode === 'bottlenecks') {
        const srcNode = graphData.nodes.find(n => n.id === e.source);
        const tgtNode = graphData.nodes.find(n => n.id === e.target);
        const touchesBottleneck =
          srcNode?.role === 'bottleneck' || tgtNode?.role === 'bottleneck' ||
          srcNode?.role === 'high_abandonment' || tgtNode?.role === 'high_abandonment';
        isDimmed = !touchesBottleneck;
      } else if (filterMode === 'high_traffic') {
        isDimmed = e.weight < maxWeight * 0.35;
      } else if (filterMode === 'successful_paths') {
        if (isExit) isDimmed = true;
        if (!isMain && !isBack) isDimmed = true;
      } else if (filterMode === 'failed_paths') {
        if (!isExit && !isBack) isDimmed = true;
      }

      // Handle mappings:
      // - Backward: top-source -> top-target (upward arc)
      // - Exit: bottom-source -> top-target (downward step)
      // - Forward: right-source -> left-target (clean horizontal)
      let sourceHandle = 'right-source';
      let targetHandle = 'left-target';

      if (isBack) {
        sourceHandle = 'top-source';
        targetHandle = 'top-target';
      } else if (isExit) {
        sourceHandle = 'bottom-source';
        targetHandle = 'top-target';
      }

      return {
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'workflowEdge',
        sourceHandle,
        targetHandle,
        animated: isBack,
        data: {
          ...e,
          sourceLabel: getStepLabel(e.source),
          targetLabel: getStepLabel(e.target),
          is_backward: isBack,
          is_exit: isExit,
          is_main_path: isMain,
          forceShowLabel: showAllEdgeLabels
        },
        style: {
          stroke: edgeColor,
          strokeWidth,
          strokeDasharray: isBack ? '6 5' : undefined,
          opacity: isDimmed ? 0.18 : 1
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: isMain ? 18 : 14,
          height: isMain ? 18 : 14,
          color: edgeColor
        }
      };
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = computeGraphLayout(
      rawNodes,
      rawEdges,
      canonicalSteps,
      exitStepId
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);

    // Initial centering onto the horizontal workflow
    setTimeout(() => {
      fitView({ padding: 0.18, minZoom: 0.65, maxZoom: 1.05, duration: 300 });
    }, 50);
  }, [
    graphData,
    pathsData,
    selectedNodeId,
    filterMode,
    resolvedTheme,
    showAllEdgeLabels,
    currentWorkflow,
    mainPathEdgesSet
  ]);

  const handleNodeClick = useCallback((event, node) => {
    setActiveNodeDetails(node.data);
    if (onNodeSelect) {
      onNodeSelect(node.data);
    }
  }, [onNodeSelect]);

  const handleResetView = useCallback(() => {
    fitView({ padding: 0.18, minZoom: 0.65, maxZoom: 1.05, duration: 400 });
  }, [fitView]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl border border-border bg-card/60 overflow-hidden shadow-inner transition-all select-none ${
        isFullscreen ? 'h-screen w-screen p-0 rounded-none z-50' : 'h-[640px]'
      }`}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.18, minZoom: 0.65, maxZoom: 1.05 }}
        minZoom={0.35}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          color={resolvedTheme === 'dark' ? '#334155' : '#cbd5e1'}
          gap={28}
          size={1.2}
          className="opacity-60"
        />

        {showMiniMap && (
          <MiniMap
            nodeColor={(n) => {
              if (n.data?.role === 'bottleneck') return '#f59e0b';
              if (n.data?.role === 'successful_completion') return '#10b981';
              if (n.data?.role === 'high_abandonment') return '#ef4444';
              if (n.data?.role === 'exit') return '#94a3b8';
              if (n.data?.role === 'high_traffic') return '#14b8a6';
              return '#3b82f6';
            }}
            className="!bg-card/90 !border-border !rounded-xl !shadow-md backdrop-blur-md"
            position="bottom-right"
          />
        )}
      </ReactFlow>

      {/* Top Floating Control Bar */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 flex-wrap">
        {/* Toggle All Edge Labels */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAllEdgeLabels(prev => !prev)}
          className={`h-8 text-xs gap-1.5 backdrop-blur-md border-border shadow-xs ${
            showAllEdgeLabels ? 'bg-primary text-primary-foreground font-semibold' : 'bg-card/90 text-foreground'
          }`}
          title="Toggle persistent edge traffic labels"
        >
          <Tag className="w-3.5 h-3.5" />
          <span>{showAllEdgeLabels ? "All Labels" : "Clean Mode"}</span>
        </Button>

        {/* Toggle MiniMap */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMiniMap(prev => !prev)}
          className={`h-8 text-xs gap-1.5 backdrop-blur-md border-border shadow-xs ${
            showMiniMap ? 'bg-primary/15 text-primary border-primary/40 font-semibold' : 'bg-card/90 text-foreground'
          }`}
          title="Toggle Canvas MiniMap"
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Map</span>
        </Button>

        {/* Fit / Reset View */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetView}
          className="h-8 bg-card/90 text-foreground backdrop-blur-md border-border text-xs gap-1.5 shadow-xs"
          title="Center and fit workflow on canvas"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Fit View</span>
        </Button>

        {/* Fullscreen Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleFullscreen}
          className="h-8 bg-card/90 text-foreground backdrop-blur-md border-border text-xs gap-1.5 shadow-xs"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Canvas"}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          <span>{isFullscreen ? "Exit" : "Expand"}</span>
        </Button>
      </div>

      {/* Top Left Clean Legend Overlay */}
      <div className="absolute top-3 left-3 z-10 bg-card/90 backdrop-blur-md rounded-xl px-3 py-2 border border-border shadow-xs hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
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
          <span className="text-foreground font-medium">Goal Success</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
          <span className="text-foreground font-medium">Exit / Drop</span>
        </div>
        <div className="flex items-center gap-1.5 pl-1 border-l border-border/80">
          <span className="w-4 h-0.5 border-t-2 border-dashed border-amber-500" />
          <span className="text-foreground font-medium">Rework Loop</span>
        </div>
      </div>

      {/* Slide-over Sheet for Node Inspection */}
      <Sheet
        open={Boolean(activeNodeDetails)}
        onOpenChange={(open) => !open && setActiveNodeDetails(null)}
      >
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          {activeNodeDetails && (
            <div className="space-y-6 pt-2">
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-lg font-bold">{activeNodeDetails.label}</SheetTitle>
                  <Badge variant="outline" className="capitalize text-[11px]">
                    {activeNodeDetails.role?.replace('_', ' ')}
                  </Badge>
                </div>
                <SheetDescription className="text-xs">
                  Step ID: <code className="text-foreground font-mono">{activeNodeDetails.id}</code> &middot; Workflow: <strong className="text-foreground">{currentWorkflow?.name}</strong>
                </SheetDescription>
              </SheetHeader>

              {/* Traffic & Drop-off Overview Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-border bg-card shadow-xs">
                  <span className="text-[11px] text-muted-foreground block mb-0.5">Total Visits</span>
                  <span className="text-xl font-bold text-foreground">
                    {activeNodeDetails.visits?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card shadow-xs">
                  <span className="text-[11px] text-muted-foreground block mb-0.5">Drop-off Rate</span>
                  <span className={`text-xl font-bold ${activeNodeDetails.drop_off_pct > 20 ? 'text-destructive' : 'text-foreground'}`}>
                    {activeNodeDetails.drop_off_pct || 0}%
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card shadow-xs">
                  <span className="text-[11px] text-muted-foreground block mb-0.5">Avg Dwell Time</span>
                  <span className="text-xl font-bold text-foreground">
                    {activeNodeDetails.avg_time_spent || 0}s
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card shadow-xs">
                  <span className="text-[11px] text-muted-foreground block mb-0.5">Exits Logged</span>
                  <span className="text-xl font-bold text-muted-foreground">
                    {activeNodeDetails.exit_count || 0}
                  </span>
                </div>
              </div>

              <Separator />

              {/* NetworkX Centrality Analytics */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-primary" />
                  NetworkX Centrality Analytics
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">PageRank Importance</span>
                      <span className="font-semibold text-primary">{activeNodeDetails.pagerank}</span>
                    </div>
                    <Progress value={Math.min(100, (activeNodeDetails.pagerank || 0) * 450)} color="primary" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Betweenness Centrality (Choke Point)</span>
                      <span className="font-semibold text-amber-500">{activeNodeDetails.betweenness_centrality}</span>
                    </div>
                    <Progress value={Math.min(100, (activeNodeDetails.betweenness_centrality || 0) * 180)} color="amber" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Degree Centrality</span>
                      <span className="font-semibold text-teal-500">{activeNodeDetails.degree_centrality}</span>
                    </div>
                    <Progress value={Math.min(100, (activeNodeDetails.degree_centrality || 0) * 120)} color="teal" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Closeness Centrality</span>
                      <span className="font-semibold text-foreground">{activeNodeDetails.closeness_centrality}</span>
                    </div>
                    <Progress value={Math.min(100, (activeNodeDetails.closeness_centrality || 0) * 100)} color="primary" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Incoming Transitions */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Incoming Transitions ({activeNodeDetails.incoming_paths?.length || 0})
                </h4>
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {activeNodeDetails.incoming_paths && activeNodeDetails.incoming_paths.length > 0 ? (
                    activeNodeDetails.incoming_paths.map((inc, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50 text-xs">
                        <span className="text-foreground font-medium">From {inc.label}</span>
                        <Badge variant="secondary">{inc.count} users</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No incoming transitions (Workflow Source)</p>
                  )}
                </div>
              </div>

              {/* Outgoing Transitions */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Outgoing Transitions ({activeNodeDetails.outgoing_paths?.length || 0})
                </h4>
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                  {activeNodeDetails.outgoing_paths && activeNodeDetails.outgoing_paths.length > 0 ? (
                    activeNodeDetails.outgoing_paths.map((out, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50 text-xs">
                        <span className="text-foreground font-medium">To {out.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{out.rate}%</span>
                          <Badge variant="secondary">{out.count} users</Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No outgoing transitions (Workflow Sink)</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function WorkflowFlowGraph(props) {
  return (
    <ReactFlowProvider>
      <WorkflowFlowGraphInner {...props} />
    </ReactFlowProvider>
  );
}
