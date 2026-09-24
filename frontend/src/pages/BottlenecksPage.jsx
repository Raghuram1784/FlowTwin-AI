import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingDown,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  CheckCircle2,
  Users,
  RefreshCw,
  CornerDownRight,
  ArrowLeft
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  Progress,
  Skeleton,
  Separator
} from '../components/ui';
import { analyticsService } from '../services/analyticsService';
import { useWorkflow } from '../context/WorkflowContext';

export function BottlenecksPage() {
  const { currentWorkflowId, currentWorkflow } = useWorkflow();
  const [bottlenecks, setBottlenecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedStep, setExpandedStep] = useState(null);

  const fetchBottlenecks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyticsService.getBottlenecks(currentWorkflowId);
      setBottlenecks(data || []);
      if (data && data.length > 0) {
        setExpandedStep(data[0].step);
      }
    } catch (e) {
      console.error("Failed to fetch bottlenecks:", e);
      setError("Unable to calculate workflow bottlenecks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBottlenecks();
  }, [currentWorkflowId]);

  const toggleExpand = (stepId) => {
    setExpandedStep(prev => prev === stepId ? null : stepId);
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive" className="font-semibold text-xs">Critical Friction</Badge>;
      case 'high':
        return <Badge variant="warning" className="font-semibold text-xs">High Friction</Badge>;
      case 'medium':
        return <Badge variant="warning" className="font-medium text-xs">Moderate Friction</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Low Friction</Badge>;
    }
  };

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
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Bottleneck Intelligence & Friction Ranking
            </h1>
            <Badge variant="outline" className="text-xs">{currentWorkflow?.name || 'Workflow'}</Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Algorithmic ranking of user drop-offs, rework loops, and deterministic actionable solutions
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchBottlenecks}
          disabled={loading}
          className="text-xs h-8"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Recalculate
        </Button>
      </div>

      {/* Optimization Explainer Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-foreground leading-relaxed">
          <span className="font-semibold block text-sm mb-0.5">Analytics-Derived Friction Ranking</span>
          FlowTwin AI scores bottlenecks dynamically using composite factors: attrition drop-off %, dwell time anomalies relative to workflow baselines, backtracking frequency, and NetworkX betweenness choke points.
        </div>
      </div>

      {/* Bottlenecks List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-full" />
            </Card>
          ))
        ) : bottlenecks.length === 0 ? (
          <Card className="p-12 text-center text-xs text-muted-foreground">
            No friction bottlenecks detected for {currentWorkflow?.name}. User navigation is progressing smoothly.
          </Card>
        ) : (
          bottlenecks.map((item) => {
            const isExpanded = expandedStep === item.step;
            const dropOffColor = item.drop_off_pct >= 25 ? 'text-destructive' : 'text-amber-500';

            return (
              <Card
                key={item.step}
                className={`transition-all duration-200 overflow-hidden ${
                  isExpanded ? 'ring-2 ring-primary/20 shadow-md' : 'hover:border-border/80'
                }`}
              >
                {/* Header Bar */}
                <div
                  onClick={() => toggleExpand(item.step)}
                  className="p-5 flex items-center justify-between cursor-pointer select-none bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center font-bold text-sm text-foreground shadow-2xs">
                      #{item.rank}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-bold text-base text-foreground">
                          {item.label}
                        </h3>
                        {getSeverityBadge(item.severity)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Step ID: <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-[11px]">{item.step}</code>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <span className="text-[11px] text-muted-foreground block">Drop-off Rate</span>
                      <span className={`text-base font-bold ${dropOffColor}`}>
                        {item.drop_off_pct}%
                      </span>
                    </div>

                    <div className="text-right hidden sm:block">
                      <span className="text-[11px] text-muted-foreground block">Avg Dwell Time</span>
                      <span className="text-base font-semibold text-foreground">
                        {item.avg_time_spent}s
                      </span>
                    </div>

                    <div className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Body */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="p-6 pt-2 border-t border-border space-y-6">
                        {/* Funnel Metrics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-3.5 rounded-xl bg-muted/30 border border-border">
                            <span className="text-[11px] text-muted-foreground block mb-1">Users Entering</span>
                            <span className="text-lg font-bold text-foreground">
                              {item.users_entering?.toLocaleString()}
                            </span>
                          </div>

                          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mb-1">Users Continuing</span>
                            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                              {item.users_continuing?.toLocaleString()}
                            </span>
                          </div>

                          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20">
                            <span className="text-[11px] text-destructive block mb-1">Users Abandoning</span>
                            <span className="text-lg font-bold text-destructive">
                              {item.users_abandoning?.toLocaleString()}
                            </span>
                          </div>

                          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 block mb-1">Backtracking Loops</span>
                            <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                              {item.repeated_nav_count} cycles
                            </span>
                          </div>
                        </div>

                        {/* Drop-off Ratio Bar */}
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                            <span>Continuance Ratio: {100 - item.drop_off_pct}%</span>
                            <span className="text-destructive font-semibold">Drop-off: {item.drop_off_pct}%</span>
                          </div>
                          <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden flex">
                            <div
                              className="bg-emerald-500 h-full"
                              style={{ width: `${100 - item.drop_off_pct}%` }}
                            />
                            <div
                              className="bg-destructive h-full"
                              style={{ width: `${item.drop_off_pct}%` }}
                            />
                          </div>
                        </div>

                        {/* Transition Context (Most Common Previous & Next Steps) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-muted/20 border border-border flex items-center justify-between">
                            <span className="text-muted-foreground">Most Common Previous Step:</span>
                            <Badge variant="outline" className="font-semibold">{item.most_common_prev || 'Workflow Start'}</Badge>
                          </div>
                          <div className="p-3 rounded-xl bg-muted/20 border border-border flex items-center justify-between">
                            <span className="text-muted-foreground">Most Common Next Step:</span>
                            <Badge variant="outline" className="font-semibold">{item.most_common_next || 'Workflow Exit'}</Badge>
                          </div>
                        </div>

                        {/* Deterministic Optimization Recommendation */}
                        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                            <Sparkles className="w-3.5 h-3.5" />
                            Deterministic Optimization Recommendation
                          </div>
                          <p className="text-xs text-foreground leading-relaxed font-medium">
                            {item.recommendation}
                          </p>
                        </div>

                        {/* Associated Failed Paths */}
                        {item.related_failed_paths && item.related_failed_paths.length > 0 && (
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                              Associated Failed Paths Traversed by Users
                            </span>
                            <div className="space-y-1.5">
                              {item.related_failed_paths.map((path, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs font-mono text-muted-foreground border border-border"
                                >
                                  <TrendingDown className="w-3.5 h-3.5 text-destructive shrink-0" />
                                  <span className="truncate">{path}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
