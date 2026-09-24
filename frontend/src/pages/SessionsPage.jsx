import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  ArrowRight,
  Eye,
  RefreshCw,
  Calendar,
  Layers,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Separator,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Skeleton
} from '../components/ui';
import { sessionService } from '../services/sessionService';
import { useWorkflow } from '../context/WorkflowContext';

export function SessionsPage() {
  const { currentWorkflowId, currentWorkflow, getStepLabel } = useWorkflow();

  const [sessions, setSessions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [stepFilter, setStepFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected session for inspection
  const [selectedSessionDetail, setSelectedSessionDetail] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sessionService.getSessions({
        workflow_id: currentWorkflowId,
        status: statusFilter,
        risk: riskFilter,
        step: stepFilter,
        search: searchQuery,
        page,
        limit: 12
      });
      setSessions(data.sessions || []);
      setTotalCount(data.total || 0);
    } catch (e) {
      console.error("Failed to load sessions:", e);
      setError("Unable to load session journeys from the backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [currentWorkflowId]);

  useEffect(() => {
    fetchSessions();
  }, [currentWorkflowId, page, statusFilter, riskFilter, stepFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSessions();
  };

  const handleInspectSession = async (session) => {
    setLoadingDetail(true);
    setIsSheetOpen(true);
    try {
      const detail = await sessionService.getSessionDetail(session.id);
      setSelectedSessionDetail(detail);
    } catch (e) {
      console.error("Failed to fetch session detail:", e);
      setSelectedSessionDetail(session);
    } finally {
      setLoadingDetail(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed') return <Badge variant="success">Completed</Badge>;
    if (s === 'abandoned') return <Badge variant="destructive">Abandoned</Badge>;
    return <Badge variant="secondary">In Progress</Badge>;
  };

  const getRiskBadge = (risk) => {
    const r = (risk || 'low').toLowerCase();
    if (r === 'high') return <Badge variant="destructive">High Risk</Badge>;
    if (r === 'medium') return <Badge variant="warning">Medium Risk</Badge>;
    return <Badge variant="success">Low Risk</Badge>;
  };

  // Convert raw journey path string (e.g., "start -> search -> exit") to human labels
  const renderJourneyLabels = (journeyPath) => {
    if (!journeyPath) return '--';
    const parts = journeyPath.split(' -> ');
    return parts.map((step, idx) => (
      <span key={idx} className="inline-flex items-center">
        <span className="font-medium text-foreground">{getStepLabel(step.trim())}</span>
        {idx < parts.length - 1 && <span className="mx-1 text-muted-foreground">→</span>}
      </span>
    ));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Session Journeys
            </h1>
            <Badge variant="outline" className="text-xs">
              {currentWorkflow?.name || 'Active Workflow'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Audit individual user journeys, inspect step-by-step dwell events, and assess predicted abandonment risk
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchSessions}
          disabled={loading}
          className="text-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Records
        </Button>
      </div>

      {/* Filter Controls Card */}
      <Card className="p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by Session ID or User ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-xs"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Abandoned</option>
              <option value="in_progress">In Progress</option>
            </select>
          </div>

          {/* Risk Filter */}
          <div>
            <select
              value={riskFilter}
              onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Risk Levels</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>

          {/* Dynamic Workflow Step Filter */}
          <div>
            <select
              value={stepFilter}
              onChange={(e) => { setStepFilter(e.target.value); setPage(1); }}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Workflow Steps</option>
              {(currentWorkflow?.steps || []).map((st) => (
                <option key={st.id} value={st.id}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Card>

      {/* Sessions Data Table with Responsive Scroll */}
      <Card className="shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Session ID</TableHead>
                <TableHead>Workflow</TableHead>
                <TableHead>Started At</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Current / Final Step</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-7 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-xs text-muted-foreground">
                    No sessions matching the selected filter criteria. Try clearing filters or switching workflows.
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((sess) => (
                  <TableRow key={sess.id}>
                    <TableCell className="font-mono text-xs font-semibold text-foreground">
                      {sess.id}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {currentWorkflow?.name || sess.workflow_id}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {sess.start_time ? new Date(sess.start_time).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '--'}
                    </TableCell>
                    <TableCell className="text-xs text-foreground whitespace-nowrap">
                      {sess.total_duration}s ({sess.step_count} steps)
                    </TableCell>
                    <TableCell className="text-xs text-foreground">
                      <Badge variant="outline" className="text-[11px] font-normal">
                        {getStepLabel(sess.current_step)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(sess.status)}
                    </TableCell>
                    <TableCell>
                      {getRiskBadge(sess.predicted_risk)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleInspectSession(sess)}
                        className="text-xs text-primary h-8 hover:bg-primary/10"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Inspect
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>Showing {sessions.length} of {totalCount} sessions</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="text-xs h-8"
            >
              Previous
            </Button>
            <span className="font-medium text-foreground px-2">Page {page}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={sessions.length < 12 || loading}
              className="text-xs h-8"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Session Detailed Inspector Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          {loadingDetail ? (
            <div className="py-12 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="grid grid-cols-2 gap-3 pt-4">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
              </div>
            </div>
          ) : selectedSessionDetail ? (
            <div className="space-y-6 pt-2">
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-lg font-bold font-mono">
                    {selectedSessionDetail.id}
                  </SheetTitle>
                  {getStatusBadge(selectedSessionDetail.status)}
                </div>
                <SheetDescription className="text-xs">
                  User ID: <span className="font-mono text-foreground">{selectedSessionDetail.user_id}</span> &middot; Workflow: <span className="font-semibold text-foreground">{currentWorkflow?.name}</span>
                </SheetDescription>
              </SheetHeader>

              {/* KPI Badges Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-card border border-border">
                  <span className="text-[11px] text-muted-foreground block mb-1">Abandonment Risk</span>
                  <div className="flex items-center gap-2">
                    {getRiskBadge(selectedSessionDetail.predicted_risk)}
                    <span className="text-xs font-semibold text-foreground">
                      {Math.round((selectedSessionDetail.abandonment_probability || 0) * 100)}%
                    </span>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-card border border-border">
                  <span className="text-[11px] text-muted-foreground block mb-1">Completion Probability</span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {Math.round((selectedSessionDetail.completion_probability || 0) * 100)}%
                  </span>
                </div>
              </div>

              {/* Session Stats */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/30 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Total Dwell</span>
                  <span className="font-semibold text-foreground">{selectedSessionDetail.total_duration || 0}s</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Backward Loops</span>
                  <span className="font-semibold text-amber-600">{selectedSessionDetail.backward_count || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Errors Logged</span>
                  <span className="font-semibold text-destructive">{selectedSessionDetail.error_count || 0}</span>
                </div>
              </div>

              {/* Visual Full Journey Pathway */}
              <div className="p-3.5 rounded-xl border border-border bg-card space-y-2">
                <span className="text-xs font-semibold text-foreground block">
                  Full Journey Sequence:
                </span>
                <div className="text-xs leading-relaxed">
                  {renderJourneyLabels(selectedSessionDetail.journey_path)}
                </div>
              </div>

              <Separator />

              {/* Step-by-Step Timestamped Event Stream */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  Chronological Event Timeline ({selectedSessionDetail.events?.length || 0} events)
                </h4>

                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {selectedSessionDetail.events && selectedSessionDetail.events.length > 0 ? (
                    selectedSessionDetail.events.map((ev, i) => (
                      <div
                        key={ev.id || i}
                        className="p-3 rounded-xl bg-card border border-border text-xs flex items-start justify-between gap-3 hover:border-primary/40 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 font-medium text-foreground flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-muted border border-border text-[11px]">
                              {getStepLabel(ev.from_step)}
                            </span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="px-2 py-0.5 rounded bg-muted border border-border text-[11px]">
                              {getStepLabel(ev.to_step)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
                            <span>Action: <code className="text-foreground font-mono">{ev.action}</code></span>
                            <span>&middot;</span>
                            <span>Time: {new Date(ev.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <Badge variant="secondary" className="text-[10px]">
                            {ev.time_spent}s dwell
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No detailed events recorded for this session.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Select a session to view its journey details.
            </div>
          )}
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}
