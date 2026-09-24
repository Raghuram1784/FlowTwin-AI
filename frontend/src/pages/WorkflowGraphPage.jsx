import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { WorkflowFlowGraph } from '../components/WorkflowFlowGraph';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button, Skeleton } from '../components/ui';
import { GitFork, Layers, Info, Filter, ArrowUpRight, Compass, ShieldAlert, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { useWorkflow } from '../context/WorkflowContext';

export function WorkflowGraphPage() {
  const { currentWorkflowId, currentWorkflow } = useWorkflow();
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterMode, setFilterMode] = useState('all');
  const [selectedNode, setSelectedNode] = useState(null);

  const filterOptions = [
    { id: 'all', label: 'All Steps' },
    { id: 'high_traffic', label: 'High Traffic Core' },
    { id: 'bottlenecks', label: 'Bottlenecks Only' },
    { id: 'successful_paths', label: 'Successful Journeys' },
    { id: 'failed_paths', label: 'Abandonment Trajectories' }
  ];

  const fetchGraph = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyticsService.getGraph(currentWorkflowId);
      setGraphData(data);
    } catch (e) {
      console.error("Failed to fetch graph data:", e);
      setError("Unable to build workflow digital twin graph.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [currentWorkflowId]);

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
          <div className="flex items-center gap-2">
            <GitFork className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Digital Twin Workflow Graph
            </h1>
            <Badge variant="outline" className="text-xs">{currentWorkflow?.name || 'Workflow'}</Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            NetworkX directed graph with Dagre automatic layout, PageRank, betweenness choke points, and transition rates
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchGraph}
            disabled={loading}
            className="text-xs h-8"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Graph
          </Button>
        </div>
      </div>

      {/* Graph Metrics Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl border border-border bg-card shadow-xs text-xs">
          <span className="text-muted-foreground block text-[11px] mb-0.5">Total Workflow Nodes</span>
          <span className="text-lg font-bold text-foreground">
            {loading ? <Skeleton className="h-6 w-12" /> : graphData?.total_nodes || 0}
          </span>
        </div>
        <div className="p-3 rounded-xl border border-border bg-card shadow-xs text-xs">
          <span className="text-muted-foreground block text-[11px] mb-0.5">Directed Transitions</span>
          <span className="text-lg font-bold text-foreground">
            {loading ? <Skeleton className="h-6 w-12" /> : graphData?.total_edges || 0}
          </span>
        </div>
        <div className="p-3 rounded-xl border border-border bg-card shadow-xs text-xs">
          <span className="text-muted-foreground block text-[11px] mb-0.5">Graph Density</span>
          <span className="text-lg font-bold text-primary">
            {loading ? <Skeleton className="h-6 w-12" /> : graphData?.density || 0}
          </span>
        </div>
        <div className="p-3 rounded-xl border border-border bg-card shadow-xs text-xs">
          <span className="text-muted-foreground block text-[11px] mb-0.5">Topology</span>
          <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
            {loading ? <Skeleton className="h-6 w-16" /> : graphData?.is_dag ? 'Acyclic DAG' : 'Cyclic (Back-loops)'}
          </span>
        </div>
      </div>

      {/* Main Interactive Canvas Card */}
      <Card className="p-2 border-border shadow-xs">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border-b border-border mb-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="w-4 h-4 text-primary shrink-0" />
            <span>Click any node to inspect Centralities, Drop-off %, and In/Out Transitions in the slide-over Sheet.</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mr-1">
              Filter:
            </span>
            {filterOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setFilterMode(opt.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  filterMode === opt.id
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
          <div className="h-[620px] w-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              <span className="text-xs text-muted-foreground">Synthesizing NetworkX directed graph & Dagre layout...</span>
            </div>
          </div>
        ) : error ? (
          <div className="h-[620px] w-full flex items-center justify-center text-xs text-destructive">
            {error}
          </div>
        ) : (
          <WorkflowFlowGraph
            graphData={graphData}
            onNodeSelect={setSelectedNode}
            selectedNodeId={selectedNode?.id}
            filterMode={filterMode}
          />
        )}
      </Card>
    </motion.div>
  );
}
