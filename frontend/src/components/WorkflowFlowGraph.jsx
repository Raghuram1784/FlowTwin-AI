import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  MarkerType,
  useNodesState,
  useEdgesState
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
  ArrowRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// Dynamic Workflow Step Node
function WorkflowStepNode({ data, selected }) {
  const {
    label,
    role,
    visits,
    drop_off_pct,
    avg_time_spent,
    pagerank,
    isDimmed,
    isHighlighted
  } = data;

  const roleConfig = {
    start: {
      badge: "Start",
      badgeVariant: "default",
      border: "border-primary",
      bg: "bg-primary/5",
      accent: "text-primary",
      icon: Compass
    },
    successful_completion: {
      badge: "Goal (Success)",
      badgeVariant: "success",
      border: "border-emerald-500 ring-2 ring-emerald-500/20",
      bg: "bg-emerald-500/5",
      accent: "text-emerald-600 dark:text-emerald-400",
      icon: CheckCircle2
    },
    bottleneck: {
      badge: "Bottleneck",
      badgeVariant: "warning",
      border: "border-amber-500 ring-2 ring-amber-500/20",
      bg: "bg-amber-500/5",
      accent: "text-amber-600 dark:text-amber-400",
      icon: AlertTriangle
    },
    high_abandonment: {
      badge: "High Drop-off",
      badgeVariant: "destructive",
      border: "border-destructive ring-2 ring-destructive/20",
      bg: "bg-destructive/5",
      accent: "text-destructive",
      icon: TrendingDown
    },
    high_traffic: {
      badge: "High Traffic",
      badgeVariant: "teal",
      border: "border-teal-500",
      bg: "bg-teal-500/5",
      accent: "text-teal-600 dark:text-teal-400",
      icon: Activity
    },
    exit: {
      badge: "Exit / Drop-off",
      badgeVariant: "destructive",
      border: "border-border border-dashed",
      bg: "bg-muted/40",
      accent: "text-muted-foreground",
      icon: LogOut
    },
    normal: {
      badge: "Step",
      badgeVariant: "secondary",
      border: "border-border",
      bg: "bg-card",
      accent: "text-foreground",
      icon: Layers
    }
  };

  const config = roleConfig[role] || roleConfig.normal;
  const RoleIcon = config.icon;

  return (
    <div
      className={`relative min-w-[210px] max-w-[240px] rounded-2xl border-2 p-3.5 shadow-xs transition-all duration-200 hover:shadow-md cursor-pointer ${
        config.border
      } ${config.bg} ${
        selected ? 'ring-3 ring-primary shadow-primary/20 scale-[1.03]' : ''
      } ${
        isDimmed ? 'opacity-30 grayscale-[50%]' : ''
      } ${
        isHighlighted ? 'ring-2 ring-primary scale-[1.02]' : ''
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-primary !w-2.5 !h-2.5 !border-2 !border-background"
      />

      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 truncate">
          <RoleIcon className={`w-4 h-4 shrink-0 ${config.accent}`} />
          <span className="font-semibold text-xs text-foreground truncate">
            {label}
          </span>
        </div>
        <Badge variant={config.badgeVariant} className="text-[10px] py-0 px-1.5 shrink-0">
          {config.badge}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-border/60">
        <div>
          <span className="text-muted-foreground block text-[10px]">Visits</span>
          <span className="font-semibold text-foreground">
            {visits?.toLocaleString() || 0}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px]">Avg Time</span>
          <span className="font-medium text-foreground">
            {avg_time_spent ? `${avg_time_spent}s` : '0s'}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px]">Drop-off</span>
          <span className={`font-semibold ${drop_off_pct > 20 ? 'text-destructive' : 'text-foreground'}`}>
            {drop_off_pct}%
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px]">PageRank</span>
          <span className="font-medium text-primary">
            {pagerank || 0}
          </span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary !w-2.5 !h-2.5 !border-2 !border-background"
      />
    </div>
  );
}

// Dagre Automatic Graph Layout Engine
const nodeWidth = 230;
const nodeHeight = 110;

function computeDagreLayout(nodes, edges, direction = 'TB') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 60, ranksep: 80 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id) || { x: 200, y: 200 };
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

export function WorkflowFlowGraph({
  graphData,
  onNodeSelect,
  selectedNodeId,
  filterMode = 'all' // all, high_traffic, bottlenecks, successful_paths, failed_paths
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [activeNodeDetails, setActiveNodeDetails] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const { resolvedTheme } = useTheme();

  const nodeTypes = useMemo(() => ({ workflowNode: WorkflowStepNode }), []);

  // Compute Layout with Dagre and apply actual active filter
  useEffect(() => {
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) return;

    const maxWeight = Math.max(...(graphData.edges.map(e => e.weight) || [1]), 1);

    // Filter Logic
    const isExitNode = (id) => id === 'exit' || id.includes('abandon');
    const isSuccessNode = (id) => id === 'submit' || id === 'confirmation' || id === 'approval';

    const rawNodes = graphData.nodes.map((n) => {
      let isDimmed = false;
      let isHighlighted = false;

      if (filterMode === 'bottlenecks') {
        const isB = n.role === 'bottleneck' || n.role === 'high_abandonment';
        isDimmed = !isB;
        isHighlighted = isB;
      } else if (filterMode === 'high_traffic') {
        const isH = n.role === 'high_traffic' || n.visits >= 0.5 * maxWeight;
        isDimmed = !isH;
        isHighlighted = isH;
      } else if (filterMode === 'successful_paths') {
        if (isExitNode(n.id)) isDimmed = true;
      } else if (filterMode === 'failed_paths') {
        if (isSuccessNode(n.id)) isDimmed = true;
      }

      return {
        id: n.id,
        type: 'workflowNode',
        data: {
          ...n,
          label: n.label,
          role: n.role,
          isDimmed,
          isHighlighted
        },
        selected: selectedNodeId === n.id
      };
    });

    const rawEdges = graphData.edges.map((e) => {
      const strokeWidth = Math.max(1.8, Math.min(6, (e.weight / maxWeight) * 6));
      const isExit = isExitNode(e.target);
      const isBack = e.is_backward;

      let edgeColor = resolvedTheme === 'dark' ? '#3b82f6' : '#2563eb';
      if (isExit) edgeColor = '#ef4444';
      else if (isBack) edgeColor = '#f59e0b';
      else if (e.weight > maxWeight * 0.4) edgeColor = '#14b8a6';

      let isDimmed = false;
      if (filterMode === 'bottlenecks') {
        const srcNode = graphData.nodes.find(n => n.id === e.source);
        const tgtNode = graphData.nodes.find(n => n.id === e.target);
        const touchesBottleneck =
          srcNode?.role === 'bottleneck' || tgtNode?.role === 'bottleneck' ||
          srcNode?.role === 'high_abandonment' || tgtNode?.role === 'high_abandonment';
        isDimmed = !touchesBottleneck;
      } else if (filterMode === 'successful_paths') {
        if (isExit) isDimmed = true;
      } else if (filterMode === 'failed_paths') {
        if (!isExit && !isBack) isDimmed = true;
      }

      return {
        id: e.id,
        source: e.source,
        target: e.target,
        animated: isBack || isExit,
        label: `${e.weight} (${e.transition_rate}%)`,
        labelStyle: {
          fill: isExit ? '#ef4444' : isBack ? '#d97706' : resolvedTheme === 'dark' ? '#94a3b8' : '#475569',
          fontWeight: 600,
          fontSize: 10
        },
        labelBgStyle: {
          fill: resolvedTheme === 'dark' ? '#0f172a' : '#ffffff',
          fillOpacity: 0.92,
          rx: 4,
          ry: 4
        },
        labelBgPadding: [4, 2],
        style: {
          stroke: edgeColor,
          strokeWidth,
          strokeDasharray: isBack ? '5 5' : undefined,
          opacity: isDimmed ? 0.2 : 1
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: edgeColor
        }
      };
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = computeDagreLayout(rawNodes, rawEdges, 'TB');
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [graphData, selectedNodeId, filterMode, resolvedTheme]);

  const handleNodeClick = (event, node) => {
    setActiveNodeDetails(node.data);
    if (onNodeSelect) {
      onNodeSelect(node.data);
    }
  };

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
      className={`relative w-full rounded-2xl border border-border bg-card/60 overflow-hidden shadow-inner transition-all ${
        isFullscreen ? 'h-screen w-screen p-0 rounded-none' : 'h-[620px]'
      }`}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.3}
        maxZoom={1.8}
        attributionPosition="bottom-left"
      >
        <Background
          color={resolvedTheme === 'dark' ? '#334155' : '#cbd5e1'}
          gap={24}
          size={1}
        />
        <Controls className="!bg-card !border-border !rounded-xl !shadow-md" />
        <MiniMap
          nodeColor={(n) => {
            if (n.data?.role === 'bottleneck') return '#f59e0b';
            if (n.data?.role === 'successful_completion') return '#10b981';
            if (n.data?.role === 'high_abandonment') return '#ef4444';
            if (n.data?.role === 'exit') return '#94a3b8';
            return '#3b82f6';
          }}
          className="!bg-card/80 !border-border !rounded-xl"
        />
      </ReactFlow>

      {/* Top Controls Overlay */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleFullscreen}
          className="h-8 bg-card/90 backdrop-blur-md border-border text-xs gap-1.5 shadow-sm"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </Button>
      </div>

      {/* Dynamic Graph Legend Overlay */}
      <div className="absolute top-4 left-4 z-10 bg-card/90 backdrop-blur-md rounded-xl p-3 border border-border shadow-xs flex flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span className="text-muted-foreground">Normal / Start</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
          <span className="text-muted-foreground">High Traffic</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-muted-foreground">Bottleneck</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
          <span className="text-muted-foreground">Abandon / Exit</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Goal Achieved</span>
        </div>
      </div>

      {/* Slide-over Sheet for Node Inspection */}
      <Sheet
        open={!!activeNodeDetails}
        onOpenChange={(open) => !open && setActiveNodeDetails(null)}
      >
        <SheetContent side="right" className="w-full sm:max-w-md">
          {activeNodeDetails && (
            <div className="space-y-6">
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <SheetTitle>{activeNodeDetails.label}</SheetTitle>
                  <Badge variant="outline" className="capitalize text-[11px]">
                    {activeNodeDetails.role?.replace('_', ' ')}
                  </Badge>
                </div>
                <SheetDescription>
                  Workflow Step ID: <code>{activeNodeDetails.id}</code>
                </SheetDescription>
              </SheetHeader>

              {/* Core Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs">
                  <span className="text-xs text-muted-foreground block mb-1">Total Visits</span>
                  <span className="text-xl font-bold text-foreground">
                    {activeNodeDetails.visits?.toLocaleString()}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs">
                  <span className="text-xs text-muted-foreground block mb-1">Drop-off Rate</span>
                  <span className={`text-xl font-bold ${activeNodeDetails.drop_off_pct > 20 ? 'text-destructive' : 'text-foreground'}`}>
                    {activeNodeDetails.drop_off_pct}%
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs">
                  <span className="text-xs text-muted-foreground block mb-1">Avg Dwell Time</span>
                  <span className="text-xl font-bold text-foreground">
                    {activeNodeDetails.avg_time_spent}s
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs">
                  <span className="text-xs text-muted-foreground block mb-1">Exits Logged</span>
                  <span className="text-xl font-bold text-muted-foreground">
                    {activeNodeDetails.exit_count}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Centralities */}
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
                    <Progress value={activeNodeDetails.pagerank * 400} color="primary" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Betweenness Centrality (Choke Point)</span>
                      <span className="font-semibold text-amber-500">{activeNodeDetails.betweenness_centrality}</span>
                    </div>
                    <Progress value={activeNodeDetails.betweenness_centrality * 150} color="amber" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Degree Centrality</span>
                      <span className="font-semibold text-teal-500">{activeNodeDetails.degree_centrality}</span>
                    </div>
                    <Progress value={activeNodeDetails.degree_centrality * 100} color="teal" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Closeness Centrality</span>
                      <span className="font-semibold text-foreground">{activeNodeDetails.closeness_centrality}</span>
                    </div>
                    <Progress value={activeNodeDetails.closeness_centrality * 100} color="primary" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Incoming Transitions */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Incoming Transitions ({activeNodeDetails.incoming_paths?.length || 0})
                </h4>
                <div className="space-y-1.5">
                  {activeNodeDetails.incoming_paths && activeNodeDetails.incoming_paths.length > 0 ? (
                    activeNodeDetails.incoming_paths.map((inc, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 text-xs">
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
                <div className="space-y-1.5">
                  {activeNodeDetails.outgoing_paths && activeNodeDetails.outgoing_paths.length > 0 ? (
                    activeNodeDetails.outgoing_paths.map((out, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 text-xs">
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
