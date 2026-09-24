import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ProcessMapCanvas } from '../components/ProcessMapCanvas';
import { WorkflowNodeInspectionSheet } from '../components/WorkflowNodeInspectionSheet';
import {
  Card,
  Badge,
  Button,
  Skeleton
} from '../components/ui';
import {
  Sparkles,
  RefreshCw,
  Activity,
  Layers
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { useWorkflow } from '../context/WorkflowContext';

export function WorkflowGraphPage() {
  const { currentWorkflowId, currentWorkflow, getStepLabel } = useWorkflow();

  const [graphData, setGraphData] = useState(null);
  const [pathsData, setPathsData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected node for inspection sheet
  const [selectedNode, setSelectedNode] = useState(null);

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
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              Digital Twin Workflow Intelligence
            </h1>
            <Badge variant="outline" className="text-xs font-semibold">
              {currentWorkflow?.name || 'Workflow'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Analyze workflow progression, drop-offs, user journeys, and network structure with Process Mining.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchWorkflowIntelligence}
            disabled={loading}
            className="text-xs h-8"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Compact Top KPI Strip (Reduced visual height to support the map without dominating) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div className="px-3 py-2 rounded-xl border border-border bg-card shadow-xs">
          <span className="text-muted-foreground block text-[10px] uppercase font-semibold tracking-wider">
            Total Sessions
          </span>
          <span className="text-base sm:text-lg font-bold text-foreground">
            {loading ? <Skeleton className="h-5 w-16" /> : summaryData?.total_sessions?.toLocaleString() || 0}
          </span>
        </div>

        <div className="px-3 py-2 rounded-xl border border-border bg-card shadow-xs">
          <span className="text-muted-foreground block text-[10px] uppercase font-semibold tracking-wider">
            Completion Rate
          </span>
          <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {loading ? <Skeleton className="h-5 w-16" /> : `${summaryData?.completion_rate || 0}%`}
          </span>
        </div>

        <div className="px-3 py-2 rounded-xl border border-border bg-card shadow-xs">
          <span className="text-muted-foreground block text-[10px] uppercase font-semibold tracking-wider">
            Abandonment Rate
          </span>
          <span className="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-400">
            {loading ? <Skeleton className="h-5 w-16" /> : `${summaryData?.abandonment_rate || 0}%`}
          </span>
        </div>

        <div className="px-3 py-2 rounded-xl border border-border bg-card shadow-xs">
          <span className="text-muted-foreground block text-[10px] uppercase font-semibold tracking-wider">
            Highest Drop-off
          </span>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 truncate block mt-0.5" title={highestDropOffNode?.label}>
            {loading ? (
              <Skeleton className="h-4 w-20" />
            ) : highestDropOffNode ? (
              `${highestDropOffNode.label} (${highestDropOffNode.drop_off_pct}%)`
            ) : (
              'None'
            )}
          </span>
        </div>

        <div className="px-3 py-2 rounded-xl border border-border bg-card shadow-xs col-span-2 sm:col-span-1">
          <span className="text-muted-foreground block text-[10px] uppercase font-semibold tracking-wider">
            Avg Completion Time
          </span>
          <span className="text-base sm:text-lg font-bold text-teal-600 dark:text-teal-400">
            {loading ? <Skeleton className="h-5 w-16" /> : `${summaryData?.avg_completion_time || 0}s`}
          </span>
        </div>
      </div>

      {/* ONE SINGLE PROFESSIONAL PROCESS MAP VISUALIZATION */}
      {loading ? (
        <Card className="min-h-[460px] h-[520px] flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">
              Computing ELK process mining layout...
            </span>
          </div>
        </Card>
      ) : error ? (
        <Card className="min-h-[460px] h-[520px] flex items-center justify-center p-8 text-destructive text-xs">
          {error}
        </Card>
      ) : (
        <ProcessMapCanvas
          graphData={graphData}
          pathsData={pathsData}
          onNodeSelect={setSelectedNode}
          selectedNodeId={selectedNode?.id}
        />
      )}

      {/* Shared Slide-over Sheet for Activity Node Inspection */}
      <WorkflowNodeInspectionSheet
        nodeDetails={selectedNode}
        isOpen={Boolean(selectedNode)}
        onClose={() => setSelectedNode(null)}
      />
    </motion.div>
  );
}
