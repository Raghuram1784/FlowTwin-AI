import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FlowViewSankey } from '../components/FlowViewSankey';
import { WorkflowFlowGraph } from '../components/WorkflowFlowGraph';
import { WorkflowNodeInspectionSheet } from '../components/WorkflowNodeInspectionSheet';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '../components/ui';
import {
  GitFork,
  Activity,
  Layers,
  Info,
  Filter,
  ArrowRight,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Zap,
  MapPin,
  Compass
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { useWorkflow } from '../context/WorkflowContext';

export function WorkflowGraphPage() {
  const { currentWorkflowId, currentWorkflow, getStepLabel } = useWorkflow();

  const [activeTab, setActiveTab] = useState('flow'); // 'flow' | 'journey' | 'network'
  const [graphData, setGraphData] = useState(null);
  const [pathsData, setPathsData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected node for inspection sheet
  const [selectedNode, setSelectedNode] = useState(null);

  // Filter mode for Network Analysis tab
  const [networkFilterMode, setNetworkFilterMode] = useState('all');

  const filterOptions = [
    { id: 'all', label: 'All Steps' },
    { id: 'high_traffic', label: 'High Traffic Core' },
    { id: 'bottlenecks', label: 'Bottlenecks Only' },
    { id: 'successful_paths', label: 'Successful Journeys' },
    { id: 'failed_paths', label: 'Abandonment Trajectories' }
  ];

  const fetchWorkflowIntelligence = async () => {
    setLoading(true);
    setError(null);
    try {
      const [gData, pData, sData] = await Promise.all([
        analyticsService.getGraph(currentWorkflowId),
        analyticsService.getPaths(currentWorkflowId).catch(() => null),
        analyticsService.getSummary(currentWorkflowId).catch(() => null)
      ]);
      setGraphData(gData);
      setPathsData(pData);
      setSummaryData(sData);
    } catch (e) {
      console.error("Failed to fetch workflow intelligence:", e);
      setError("Unable to build workflow digital twin analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflowIntelligence();
  }, [currentWorkflowId]);

  // Derive highest drop-off node from graph nodes
  const highestDropOffNode = graphData?.nodes?.length
    ? [...graphData.nodes]
        .filter(n => n.id !== (currentWorkflow?.exit_step || 'exit'))
        .sort((a, b) => (b.drop_off_pct || 0) - (a.drop_off_pct || 0))[0]
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Digital Twin Workflow Intelligence
            </h1>
            <Badge variant="outline" className="text-xs font-semibold">
              {currentWorkflow?.name || 'Workflow'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Analyze workflow progression, drop-offs, user journeys, and network structure.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchWorkflowIntelligence}
            disabled={loading}
            className="text-xs h-8.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Primary Navigation Tabs: Flow View (Default), Journey View, Network Analysis */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <TabsList className="h-10 bg-muted/70 p-1">
            <TabsTrigger value="flow" className="text-xs gap-1.5 px-4 font-medium">
              <Activity className="w-3.5 h-3.5" />
              Flow View
            </TabsTrigger>
            <TabsTrigger value="journey" className="text-xs gap-1.5 px-4 font-medium">
              <Layers className="w-3.5 h-3.5" />
              Journey View
            </TabsTrigger>
            <TabsTrigger value="network" className="text-xs gap-1.5 px-4 font-medium">
              <GitFork className="w-3.5 h-3.5" />
              Network Analysis
            </TabsTrigger>
          </TabsList>

          {/* Dynamic contextual info */}
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Digital Twin Active &middot; {graphData?.total_nodes || 0} Stages &middot; {graphData?.total_edges || 0} Transitions</span>
          </div>
        </div>

        {/* 1. FLOW VIEW (PRIMARY DEFAULT VIEW) */}
        <TabsContent value="flow" className="space-y-4 m-0">
          {/* Compact Flow View KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 rounded-xl border border-border bg-card shadow-xs">
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold tracking-wider mb-0.5">
                Total Sessions
              </span>
              <span className="text-lg font-bold text-foreground">
                {loading ? <Skeleton className="h-6 w-16" /> : summaryData?.total_sessions?.toLocaleString() || 0}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-border bg-card shadow-xs">
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold tracking-wider mb-0.5">
                Completion Rate
              </span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {loading ? <Skeleton className="h-6 w-16" /> : `${summaryData?.completion_rate || 0}%`}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-border bg-card shadow-xs">
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold tracking-wider mb-0.5">
                Abandonment Rate
              </span>
              <span className="text-lg font-bold text-rose-600 dark:text-rose-400">
                {loading ? <Skeleton className="h-6 w-16" /> : `${summaryData?.abandonment_rate || 0}%`}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-border bg-card shadow-xs">
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold tracking-wider mb-0.5">
                Highest Drop-off
              </span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 truncate block mt-1" title={highestDropOffNode?.label}>
                {loading ? (
                  <Skeleton className="h-5 w-24" />
                ) : highestDropOffNode ? (
                  `${highestDropOffNode.label} (${highestDropOffNode.drop_off_pct}%)`
                ) : (
                  'None'
                )}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-border bg-card shadow-xs col-span-2 sm:col-span-1">
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold tracking-wider mb-0.5">
                Avg Completion Time
              </span>
              <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
                {loading ? <Skeleton className="h-6 w-16" /> : `${summaryData?.avg_completion_time || 0}s`}
              </span>
            </div>
          </div>

          {/* ECharts Sankey Flow Diagram */}
          {loading ? (
            <Card className="h-[540px] flex items-center justify-center p-8">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                <span className="text-xs text-muted-foreground">Synthesizing ECharts Sankey Flow View...</span>
              </div>
            </Card>
          ) : error ? (
            <Card className="h-[540px] flex items-center justify-center p-8 text-destructive text-xs">
              {error}
            </Card>
          ) : (
            <FlowViewSankey
              graphData={graphData}
              pathsData={pathsData}
              onNodeSelect={setSelectedNode}
            />
          )}
        </TabsContent>

        {/* 2. JOURNEY VIEW (PATHWAYS & USER TRAJECTORIES) */}
        <TabsContent value="journey" className="space-y-4 m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Theoretical Optimal Path */}
            <Card className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Theoretical Optimal Path</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The shortest frictionless journey from initial entry to successful goal conversion:
              </p>
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs font-mono text-primary leading-relaxed break-words">
                {pathsData?.shortest_successful_path?.map(s => getStepLabel(s)).join(' → ') || 'No successful route identified'}
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                <span>Benchmark Length: <strong>{pathsData?.shortest_successful_path?.length || 0} steps</strong></span>
                <span>Observed Avg: <strong>{summaryData?.avg_journey_length || 0} steps</strong></span>
              </div>
            </Card>

            {/* Path Efficiency Directives */}
            <Card className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-foreground">Path Efficiency Telemetry</h3>
              </div>
              <div className="space-y-2 text-xs text-foreground">
                <div className="flex justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
                  <span className="text-muted-foreground">Path Bloat Ratio:</span>
                  <span className="font-semibold text-foreground">
                    {summaryData?.avg_journey_length && pathsData?.shortest_successful_path?.length
                      ? `${(summaryData.avg_journey_length / Math.max(pathsData.shortest_successful_path.length, 1)).toFixed(2)}x`
                      : '1.00x'}
                  </span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
                  <span className="text-muted-foreground">Most Common Exit Steps:</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    {pathsData?.most_common_exit_steps?.map(s => getStepLabel(s)).join(', ') || 'None recorded'}
                  </span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
                  <span className="text-muted-foreground">Rework Loops Identified:</span>
                  <span className="font-semibold text-amber-600">
                    {graphData?.edges?.filter(e => e.is_backward)?.length || 0} back-track routes
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Top Observed Successful Journeys Table */}
          <Card className="p-5 space-y-3 overflow-hidden">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Observed Completed Journeys (Sample Sequences)
            </h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Journey Sequence</TableHead>
                    <TableHead className="w-24">Steps</TableHead>
                    <TableHead className="w-28">Sessions</TableHead>
                    <TableHead className="w-28 text-right">Avg Dwell</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pathsData?.top_successful_paths?.length ? (
                    pathsData.top_successful_paths.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs text-foreground">
                          {p.steps?.map(s => getStepLabel(s)).join(' → ') || p.path}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {p.steps?.length || 0}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="secondary">{p.count} sessions ({p.percentage}%)</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-right font-medium text-foreground">
                          {p.avg_duration}s
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-6">
                        No completed journeys recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* 3. NETWORK ANALYSIS (PRESERVED REACT FLOW GRAPH) */}
        <TabsContent value="network" className="space-y-4 m-0">
          <Card className="p-2 border-border shadow-xs overflow-hidden">
            {/* Filter toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border-b border-border mb-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="w-4 h-4 text-primary shrink-0" />
                <span>Directed network graph with PageRank centrality, upward rework arcs, and downward abandonment.</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mr-1">
                  Filter:
                </span>
                {filterOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setNetworkFilterMode(opt.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      networkFilterMode === opt.id
                        ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="h-[640px] w-full flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <WorkflowFlowGraph
                graphData={graphData}
                pathsData={pathsData}
                onNodeSelect={setSelectedNode}
                selectedNodeId={selectedNode?.id}
                filterMode={networkFilterMode}
              />
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Shared Slide-over Sheet for Node Inspection (Shared across Flow View, Journey View & Network Analysis) */}
      <WorkflowNodeInspectionSheet
        nodeDetails={selectedNode}
        isOpen={Boolean(selectedNode)}
        onClose={() => setSelectedNode(null)}
      />
    </motion.div>
  );
}
