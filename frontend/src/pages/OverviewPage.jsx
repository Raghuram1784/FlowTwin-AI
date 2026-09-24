import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ShieldAlert,
  ArrowUpRight,
  TrendingDown,
  Layers,
  ArrowRight,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  Skeleton,
  Progress,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '../components/ui';
import { WorkflowStepPreview } from '../components/WorkflowStepPreview';
import { analyticsService } from '../services/analyticsService';
import { sessionService } from '../services/sessionService';
import { useWorkflow } from '../context/WorkflowContext';
import { useTheme } from '../context/ThemeContext';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

export function OverviewPage() {
  const navigate = useNavigate();
  const { currentWorkflowId, workflows, setWorkflowId, currentWorkflow } = useWorkflow();
  const { resolvedTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [bottlenecks, setBottlenecks] = useState([]);
  const [highRiskSessions, setHighRiskSessions] = useState([]);

  const loadOverviewData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, bottleRes, sessRes] = await Promise.all([
        analyticsService.getSummary(currentWorkflowId),
        analyticsService.getBottlenecks(currentWorkflowId),
        sessionService.getSessions({ workflow_id: currentWorkflowId, risk: 'high', limit: 5 })
      ]);
      setSummary(sumRes);
      setBottlenecks(bottleRes || []);
      setHighRiskSessions(sessRes?.sessions || []);
    } catch (err) {
      console.error("Failed to load overview data:", err);
      setError("Unable to fetch real-time analytics for this workflow. Ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverviewData();
  }, [currentWorkflowId]);

  const kpis = [
    {
      title: "Total Sessions",
      value: summary ? summary.total_sessions.toLocaleString() : "--",
      description: "Recorded journeys",
      icon: Users,
      accent: "text-primary",
      bg: "bg-primary/10"
    },
    {
      title: "Completion Rate",
      value: summary ? `${summary.completion_rate}%` : "--",
      description: `${summary?.completed_sessions || 0} completed`,
      icon: CheckCircle2,
      accent: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10"
    },
    {
      title: "Abandonment Rate",
      value: summary ? `${summary.abandonment_rate}%` : "--",
      description: `${summary?.abandoned_sessions || 0} dropped off`,
      icon: XCircle,
      accent: "text-destructive",
      bg: "bg-destructive/10"
    },
    {
      title: "Avg Completion Time",
      value: summary ? `${summary.avg_completion_time}s` : "--",
      description: `Avg path: ${summary?.avg_journey_length || 0} steps`,
      icon: Clock,
      accent: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-500/10"
    },
    {
      title: "Top Bottleneck",
      value: summary?.highest_bottleneck || "None",
      description: "Highest drop-off step",
      icon: AlertTriangle,
      accent: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10"
    },
    {
      title: "High-Risk Sessions",
      value: summary ? summary.high_risk_sessions_count.toLocaleString() : "--",
      description: "Flagged by ML model",
      icon: ShieldAlert,
      accent: "text-destructive",
      bg: "bg-destructive/10"
    }
  ];

  const pieData = summary ? [
    { name: 'Completed', value: summary.completed_sessions, color: '#10b981' },
    { name: 'Abandoned', value: summary.abandoned_sessions, color: '#ef4444' },
    { name: 'In Progress', value: summary.in_progress_sessions, color: '#3b82f6' }
  ] : [];

  const stepTrafficData = summary?.workflow_steps?.map(s => ({
    name: s.label,
    visits: s.visits,
    dropOff: s.drop_off_pct,
    avgTime: s.avg_time_spent
  })) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Header with Title and Workflow Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              FlowTwin AI
            </h1>
            <Badge variant="outline" className="text-xs">SaaS Digital Twin</Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Predictive Digital Workflow Optimization &middot; NetworkX Graph Intelligence
          </p>
        </div>

        {/* Workflow Switcher & Refresh */}
        <div className="flex items-center gap-3">
          <div className="w-56">
            <Select value={currentWorkflowId} onValueChange={setWorkflowId}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Choose Workflow" />
              </SelectTrigger>
              <SelectContent>
                {workflows.map((wf) => (
                  <SelectItem key={wf.id} value={wf.id}>
                    {wf.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadOverviewData}
            disabled={loading}
            className="h-9 px-3 text-xs"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4 rounded-2xl">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-7 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </Card>
          ))
        ) : (
          kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <Card key={idx} className="p-4 rounded-2xl hover:scale-[1.02] transition-transform">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-muted-foreground truncate">
                    {kpi.title}
                  </span>
                  <div className={`p-1.5 rounded-lg ${kpi.bg}`}>
                    <Icon className={`w-3.5 h-3.5 ${kpi.accent}`} />
                  </div>
                </div>
                <div className="text-lg font-bold text-foreground tracking-tight truncate">
                  {kpi.value}
                </div>
                <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {kpi.description}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Compact Workflow Preview Ribbon */}
      <WorkflowStepPreview
        steps={summary?.workflow_steps}
        onStepClick={() => navigate('/workflow')}
      />

      {/* Primary Analytics Section: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completion vs Abandonment */}
        <Card className="lg:col-span-1 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Completion vs Abandonment</span>
              <Badge variant="outline" className="text-[10px]">Ratio</Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Overall termination distribution
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="h-[220px] flex items-center justify-center">
                <Skeleton className="h-40 w-40 rounded-full" />
              </div>
            ) : summary?.total_sessions === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">
                No session data available for this workflow yet.
              </div>
            ) : (
              <>
                <div className="h-[200px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: resolvedTheme === 'dark' ? '#0f172a' : '#ffffff',
                          borderRadius: '12px',
                          border: resolvedTheme === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0',
                          fontSize: '12px',
                          color: resolvedTheme === 'dark' ? '#f8fafc' : '#0f172a'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border text-center">
                  {pieData.map((item, i) => (
                    <div key={i} className="text-xs">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground text-[10px] truncate">{item.name}</span>
                      </div>
                      <span className="font-bold text-foreground">
                        {summary?.total_sessions ? Math.round((item.value / summary.total_sessions) * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Workflow Traffic by Step */}
        <Card className="lg:col-span-2 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Workflow Traffic by Step</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/workflow')}
                className="text-xs text-primary h-7"
              >
                Inspect Graph <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </CardTitle>
            <CardDescription className="text-xs">
              User traffic volume and progression drop-offs across workflow stages
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="h-[240px] flex items-center justify-center">
                <Skeleton className="h-full w-full rounded-xl" />
              </div>
            ) : stepTrafficData.length === 0 ? (
              <div className="h-[240px] flex items-center justify-center text-xs text-muted-foreground">
                No traffic data available.
              </div>
            ) : (
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stepTrafficData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={resolvedTheme === 'dark' ? '#1e293b' : '#f1f5f9'}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: resolvedTheme === 'dark' ? '#94a3b8' : '#64748b' }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 10, fill: resolvedTheme === 'dark' ? '#94a3b8' : '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: resolvedTheme === 'dark' ? '#0f172a' : '#ffffff',
                        borderRadius: '12px',
                        border: resolvedTheme === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0',
                        fontSize: '12px',
                        color: resolvedTheme === 'dark' ? '#f8fafc' : '#0f172a'
                      }}
                    />
                    <Bar dataKey="visits" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Total Visits" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary Section: Top 3 Bottlenecks & Recent High-Risk Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 3 Bottlenecks */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Top Workflow Bottlenecks
                </CardTitle>
                <CardDescription className="text-xs">
                  Prioritized friction choke points ranked by drop-off rate
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/bottlenecks')}
                className="text-xs text-primary h-7"
              >
                View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 divide-y divide-border space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="py-2 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))
            ) : bottlenecks.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No bottlenecks identified for this workflow.
              </div>
            ) : (
              bottlenecks.slice(0, 3).map((b, idx) => (
                <div key={b.step} className="pt-3 first:pt-0 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground">
                          {b.label}
                        </span>
                        <Badge
                          variant={b.severity === 'critical' ? 'destructive' : b.severity === 'high' ? 'warning' : 'secondary'}
                          className="text-[10px] py-0 px-1.5"
                        >
                          {b.drop_off_pct}% Drop-off
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                        {b.recommendation}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-muted-foreground block">Avg Dwell</span>
                    <span className="text-xs font-semibold text-foreground">
                      {b.avg_time_spent}s
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent High-Risk Sessions */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-destructive" />
                  Recent High-Risk Sessions
                </CardTitle>
                <CardDescription className="text-xs">
                  Sessions flagged by Scikit-Learn predictive model
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/sessions')}
                className="text-xs text-primary h-7"
              >
                Inspect All <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="py-2.5 flex justify-between">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))
            ) : highRiskSessions.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No high-risk sessions detected for this workflow.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {highRiskSessions.map((s) => (
                  <div key={s.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-muted-foreground text-[11px]">{s.id.slice(0, 12)}</span>
                      <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-xs">
                        {s.journey_path}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-muted-foreground text-[11px] hidden sm:inline">
                        {s.total_duration}s &middot; {s.backward_count} loops
                      </span>
                      <Badge variant="destructive" className="text-[10px]">
                        High Risk
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
