import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  GitFork,
  BarChart2,
  Sparkles,
  TrendingDown,
  Layers,
  Clock,
  RefreshCw,
  Sliders,
  Calendar,
  ShieldCheck,
  Zap
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Separator,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Skeleton
} from '../components/ui';
import { reportService } from '../services/reportService';
import { useWorkflow } from '../context/WorkflowContext';

export function ReportsPage() {
  const { workflows, currentWorkflowId, currentWorkflow } = useWorkflow();

  const [selectedWorkflowId, setSelectedWorkflowId] = useState(currentWorkflowId);
  const [dateRange, setDateRange] = useState('all');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  const generateReport = async (wfId = selectedWorkflowId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportService.generateWorkflowReport(wfId, { dateRange });
      setReportData(data);
    } catch (err) {
      console.error("Report generation failed:", err);
      setError("Failed to synthesize report data. Ensure backend analytics service is responding.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedWorkflowId) {
      generateReport(selectedWorkflowId);
    }
  }, [selectedWorkflowId]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!reportData?.graph?.nodes) return;
    const rows = reportData.graph.nodes.map(n => ({
      workflow_id: reportData.workflowId,
      step_id: n.id,
      label: n.label,
      role: n.role,
      visits: n.visits,
      drop_off_pct: n.drop_off_pct,
      avg_time: n.avg_time,
      pagerank: n.pagerank,
      betweenness: n.betweenness_centrality,
      degree: n.degree_centrality,
      closeness: n.closeness_centrality
    }));
    reportService.exportToCSV(`flowtwin_report_${reportData.workflowId}_${Date.now()}.csv`, rows);
  };

  const selectedWfMeta = workflows.find(w => w.id === selectedWorkflowId) || currentWorkflow;

  // PageRank centrality ranking sorted
  const sortedCentralityNodes = reportData?.graph?.nodes
    ? [...reportData.graph.nodes].sort((a, b) => b.pagerank - a.pagerank)
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      {/* Report Builder Controls Bar (Hidden during print) */}
      <div className="print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              Dynamic Report Generator
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Synthesize real-time graph centrality, ML predictions, and bottleneck audits into an exportable executive report
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={!reportData || loading}
              className="text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export CSV
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handlePrint}
              disabled={!reportData || loading}
              className="text-xs"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print / Save PDF
            </Button>
          </div>
        </div>

        {/* Builder Config Filter Bar */}
        <Card className="p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-64">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Select Workflow
              </label>
              <Select value={selectedWorkflowId} onValueChange={setSelectedWorkflowId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Choose workflow..." />
                </SelectTrigger>
                <SelectContent>
                  {workflows.map(wf => (
                    <SelectItem key={wf.id} value={wf.id}>
                      {wf.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-48">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Date Range
              </label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Date range..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Available History</SelectItem>
                  <SelectItem value="last_30d">Last 30 Days</SelectItem>
                  <SelectItem value="last_7d">Last 7 Days</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-auto sm:ml-auto pt-3 sm:pt-0">
              <Button
                variant="default"
                size="sm"
                onClick={() => generateReport(selectedWorkflowId)}
                disabled={loading}
                className="w-full sm:w-auto h-9 text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Synthesizing...' : 'Generate Report'}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Report Document Sheet */}
      {loading ? (
        <Card className="p-8 space-y-6">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <div className="grid grid-cols-4 gap-4 pt-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="h-48 pt-4" />
        </Card>
      ) : reportData ? (
        <Card className="p-8 shadow-sm space-y-8 bg-card border-border print:border-none print:shadow-none print:p-0">
          {/* Document Header */}
          <div className="border-b border-border pb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" /> FlowTwin AI Digital Twin Intelligence
              </div>
              <h2 className="text-xl font-bold text-foreground">
                Digital Workflow Optimization & Graph Analytics Synthesis
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Workflow: <strong className="text-foreground">{selectedWfMeta?.name}</strong> ({selectedWfMeta?.category}) &middot; Generated: {new Date(reportData.generatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <Badge variant="outline" className="text-xs px-3 py-1 shrink-0">
              Verified Synthesis
            </Badge>
          </div>

          {/* Section 1: Executive KPI Overview */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              1. Executive Performance Metrics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                <span className="text-[11px] text-muted-foreground block">Total User Sessions</span>
                <span className="text-xl font-bold text-foreground">
                  {reportData.summary?.total_sessions?.toLocaleString() ?? '0'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/60">
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-medium">Completion Rate</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {reportData.summary?.completion_rate ?? 0}%
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/60">
                <span className="text-[11px] text-rose-600 dark:text-rose-400 block font-medium">Abandonment Rate</span>
                <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
                  {reportData.summary?.abandonment_rate ?? 0}%
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/60">
                <span className="text-[11px] text-teal-600 dark:text-teal-400 block font-medium">Avg Completion Time</span>
                <span className="text-xl font-bold text-teal-600 dark:text-teal-400">
                  {reportData.summary?.avg_completion_time ?? 0}s
                </span>
              </div>
            </div>

            {/* Dynamic Executive Narrative Box */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs text-foreground leading-relaxed">
              <span className="font-semibold text-primary block mb-1">Executive Summary:</span>
              {reportData.narratives?.executive}
            </div>
          </div>

          <Separator />

          {/* Section 2: Network Centrality Comparative Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <GitFork className="w-4 h-4 text-primary" />
              2. Graph Centrality Rankings (NetworkX Algorithms)
            </h3>
            <p className="text-xs text-muted-foreground">
              Mathematical centrality evaluated across the directed journey graph for <span className="font-semibold text-foreground">{selectedWfMeta?.name}</span>.
            </p>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workflow Step</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>PageRank</TableHead>
                    <TableHead>Betweenness Centrality</TableHead>
                    <TableHead>Degree Centrality</TableHead>
                    <TableHead>Closeness</TableHead>
                    <TableHead className="text-right">Drop-off %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCentralityNodes.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell className="font-semibold text-xs text-foreground">
                        {n.label}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={n.role === 'bottleneck' ? 'warning' : n.role === 'successful_completion' ? 'success' : 'secondary'}
                          className="text-[10px]"
                        >
                          {n.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-primary font-medium">{n.pagerank}</TableCell>
                      <TableCell className="font-mono text-xs text-amber-600 font-medium">{n.betweenness_centrality}</TableCell>
                      <TableCell className="font-mono text-xs">{n.degree_centrality}</TableCell>
                      <TableCell className="font-mono text-xs">{n.closeness_centrality}</TableCell>
                      <TableCell className={`text-right font-bold text-xs ${n.drop_off_pct > 20 ? 'text-destructive' : 'text-foreground'}`}>
                        {n.drop_off_pct}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <Separator />

          {/* Section 3: Journey Efficiency & Path Analysis */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              3. Journey Path Efficiency
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs space-y-2">
                <span className="font-semibold text-foreground block">Theoretical Optimal Path:</span>
                <p className="font-mono text-[11px] text-primary">
                  {reportData.paths?.shortest_successful_path?.join(" → ") || "No successful path recorded"}
                </p>
                <div className="text-muted-foreground pt-1 text-[11px]">
                  Theoretical Length: <strong>{reportData.paths?.shortest_successful_path?.length || 0} steps</strong>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs space-y-2">
                <span className="font-semibold text-foreground block">Observed Navigation Patterns:</span>
                <p className="text-foreground leading-relaxed">
                  {reportData.narratives?.efficiency}
                </p>
                <div className="text-muted-foreground pt-1 text-[11px]">
                  Common Exit Steps: <strong>{(reportData.paths?.most_common_exit_steps || []).join(', ') || 'None'}</strong>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Section 4: Deterministic Optimization Directives */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              4. Dynamic Bottleneck Directives
            </h3>
            <div className="space-y-2.5">
              {reportData.bottlenecks && reportData.bottlenecks.length > 0 ? (
                reportData.bottlenecks.slice(0, 3).map((b) => (
                  <div
                    key={b.step}
                    className="p-3.5 rounded-xl border border-border bg-card text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">
                        Rank #{b.rank}: {b.label} ({b.drop_off_pct}% Drop-off &middot; {b.users_abandoning} abandonments)
                      </span>
                      <Badge variant={b.severity === 'critical' ? 'destructive' : 'warning'} className="text-[10px]">
                        Priority {b.rank}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {b.recommendation}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic">No critical bottlenecks identified for this workflow period.</p>
              )}
            </div>
          </div>

          {/* Section 5: ML Predictive Model Telemetry */}
          {reportData.modelMetrics && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  5. Predictive Model Telemetry (Scikit-Learn)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <span className="text-muted-foreground block text-[10px]">Model Type</span>
                    <span className="font-semibold text-foreground">{reportData.modelMetrics.model_type || 'RandomForest'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <span className="text-muted-foreground block text-[10px]">Accuracy</span>
                    <span className="font-semibold text-foreground">{Math.round((reportData.modelMetrics.accuracy || 0) * 100)}%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <span className="text-muted-foreground block text-[10px]">Precision / Recall</span>
                    <span className="font-semibold text-foreground">
                      {Math.round((reportData.modelMetrics.precision || 0) * 100)}% / {Math.round((reportData.modelMetrics.recall || 0) * 100)}%
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <span className="text-muted-foreground block text-[10px]">F1 Score</span>
                    <span className="font-semibold text-foreground">{Math.round((reportData.modelMetrics.f1_score || 0) * 100)}%</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
      ) : (
        <Card className="p-12 text-center text-xs text-muted-foreground">
          Click "Generate Report" above to build a synthesis for {selectedWfMeta?.name}.
        </Card>
      )}
    </motion.div>
  );
}
