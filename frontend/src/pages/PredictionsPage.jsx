import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  BarChart2,
  RefreshCw,
  Cpu,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sliders,
  Layers,
  Clock,
  ArrowRight,
  Eye,
  Info
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
  Separator,
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
  TableCell
} from '../components/ui';
import { predictionService } from '../services/predictionService';
import { sessionService } from '../services/sessionService';
import { useWorkflow } from '../context/WorkflowContext';
import { useTheme } from '../context/ThemeContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export function PredictionsPage() {
  const { currentWorkflowId, currentWorkflow, getStepLabel } = useWorkflow();
  const { resolvedTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [highRiskSessions, setHighRiskSessions] = useState([]);
  const [selectedSessionDetail, setSelectedSessionDetail] = useState(null);
  const [retraining, setRetraining] = useState(false);

  // Model Sandbox (collapsible section)
  const [sandboxOpen, setSandboxOpen] = useState(false);
  const [sandboxCurrentStep, setSandboxCurrentStep] = useState('');
  const [sandboxBackward, setSandboxBackward] = useState(1);
  const [sandboxErrors, setSandboxErrors] = useState(0);
  const [sandboxDuration, setSandboxDuration] = useState(60);
  const [sandboxPrediction, setSandboxPrediction] = useState(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [metricsRes, sessRes] = await Promise.all([
        predictionService.getModelMetrics(currentWorkflowId),
        sessionService.getSessions({ workflow_id: currentWorkflowId, risk: 'high', limit: 8 })
      ]);
      setModelMetrics(metricsRes);
      setHighRiskSessions(sessRes?.sessions || []);

      if (currentWorkflow?.steps?.length) {
        setSandboxCurrentStep(currentWorkflow.steps[1]?.id || currentWorkflow.steps[0]?.id);
      }
    } catch (e) {
      console.error("Failed to load predictions data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentWorkflowId]);

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      const updated = await predictionService.retrainModel(currentWorkflowId);
      setModelMetrics(updated);
    } catch (e) {
      console.error("Retrain failed:", e);
    } finally {
      setRetraining(false);
    }
  };

  const runSandboxPrediction = async () => {
    if (!sandboxCurrentStep) return;
    setSandboxLoading(true);
    try {
      const res = await predictionService.predictLive({
        workflow_id: currentWorkflowId,
        journey_steps: [currentWorkflow?.start_step || 'start', sandboxCurrentStep],
        current_step: sandboxCurrentStep,
        total_duration: sandboxDuration,
        time_spent_current: sandboxDuration / 2,
        backward_count: sandboxBackward,
        errors_count: sandboxErrors,
        repeated_steps: sandboxBackward
      });
      setSandboxPrediction(res);
    } catch (e) {
      console.error("Sandbox prediction failed:", e);
    } finally {
      setSandboxLoading(false);
    }
  };

  const inspectSession = async (sess) => {
    try {
      const detail = await sessionService.getSessionDetail(sess.id);
      setSelectedSessionDetail(detail);
    } catch (_) {
      setSelectedSessionDetail(sess);
    }
  };

  const featureData = modelMetrics?.feature_importances
    ? Object.entries(modelMetrics.feature_importances).map(([k, v]) => ({
        feature: k
          .replace(/_/g, ' ')
          .replace('count', '')
          .replace('idx', '')
          .trim(),
        importance: Math.round(v * 100)
      }))
    : [];

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
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Predictive Intelligence & High-Risk Sessions
            </h1>
            <Badge variant="outline" className="text-xs">{currentWorkflow?.name || 'Workflow'}</Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Supervised Random Forest classification predicting workflow completion vs abandonment with explainable drivers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetrain}
            disabled={retraining}
            className="text-xs h-8"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${retraining ? 'animate-spin' : ''}`} />
            {retraining ? "Retraining..." : "Retrain Model"}
          </Button>
        </div>
      </div>

      {/* Top Section: Real High-Risk Sessions Table */}
      <Card className="shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-destructive" />
                Active High-Risk Sessions ({highRiskSessions.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Real sessions identified by the ML engine with elevated abandonment likelihood
              </CardDescription>
            </div>
            <Badge variant="destructive" className="text-[10px]">
              Requires Intervention
            </Badge>
          </div>
        </CardHeader>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session ID</TableHead>
              <TableHead>Current Step</TableHead>
              <TableHead>Completion Prob</TableHead>
              <TableHead>Abandonment Prob</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead>Duration / Loops</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-28 text-center text-xs text-muted-foreground">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                  Loading real-time predictive data...
                </TableCell>
              </TableRow>
            ) : highRiskSessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-28 text-center text-xs text-muted-foreground">
                  No active high-risk sessions detected for this workflow.
                </TableCell>
              </TableRow>
            ) : (
              highRiskSessions.map((sess) => (
                <TableRow key={sess.id}>
                  <TableCell className="font-mono text-xs font-semibold text-foreground">
                    {sess.id}
                  </TableCell>
                  <TableCell className="text-xs text-foreground font-medium">
                    {getStepLabel(sess.current_step)}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {Math.round(sess.completion_probability * 100)}%
                  </TableCell>
                  <TableCell className="text-xs font-bold text-destructive">
                    {Math.round(sess.abandonment_probability * 100)}%
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive" className="text-[10px] capitalize">
                      {sess.predicted_risk}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {sess.total_duration}s &middot; {sess.backward_count} loops
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => inspectSession(sess)}
                      className="text-xs text-primary h-8"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Inspect Risk
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Model Sandbox (Expandable Developer Tool) */}
      <Card className="border-border shadow-xs overflow-hidden">
        <div
          onClick={() => setSandboxOpen(prev => !prev)}
          className="p-4 flex items-center justify-between cursor-pointer select-none bg-muted/20 hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-primary" />
            <div>
              <span className="font-semibold text-xs text-foreground">
                Interactive Model Sandbox & Prediction Simulator
              </span>
              <p className="text-[11px] text-muted-foreground">
                Simulate arbitrary parameter states to evaluate real-time Random Forest risk inference
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">Developer Sandbox</Badge>
            {sandboxOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        <AnimatePresence>
          {sandboxOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-6 pt-2 border-t border-border space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="text-muted-foreground block mb-1.5 font-medium">Current Step</label>
                    <select
                      value={sandboxCurrentStep}
                      onChange={(e) => setSandboxCurrentStep(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-input bg-background text-foreground"
                    >
                      {currentWorkflow?.steps?.map((st) => (
                        <option key={st.id} value={st.id}>{st.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-muted-foreground block mb-1.5 font-medium">Backward Loops: {sandboxBackward}</label>
                    <input
                      type="range"
                      min={0}
                      max={6}
                      value={sandboxBackward}
                      onChange={(e) => setSandboxBackward(Number(e.target.value))}
                      className="w-full accent-primary mt-2"
                    />
                  </div>

                  <div>
                    <label className="text-muted-foreground block mb-1.5 font-medium">Errors Logged: {sandboxErrors}</label>
                    <input
                      type="range"
                      min={0}
                      max={5}
                      value={sandboxErrors}
                      onChange={(e) => setSandboxErrors(Number(e.target.value))}
                      className="w-full accent-primary mt-2"
                    />
                  </div>

                  <div>
                    <label className="text-muted-foreground block mb-1.5 font-medium">Total Duration: {sandboxDuration}s</label>
                    <input
                      type="range"
                      min={10}
                      max={300}
                      step={10}
                      value={sandboxDuration}
                      onChange={(e) => setSandboxDuration(Number(e.target.value))}
                      className="w-full accent-primary mt-2"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={runSandboxPrediction}
                    disabled={sandboxLoading}
                    className="text-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    {sandboxLoading ? "Predicting..." : "Run Sandbox Prediction"}
                  </Button>
                </div>

                {sandboxPrediction && (
                  <div className="p-4 rounded-xl bg-card border border-border space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">Simulated Prediction Result:</span>
                      <Badge
                        variant={sandboxPrediction.predicted_risk === 'High' ? 'destructive' : sandboxPrediction.predicted_risk === 'Medium' ? 'warning' : 'success'}
                      >
                        Risk: {sandboxPrediction.predicted_risk}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Completion Probability</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {Math.round(sandboxPrediction.completion_probability * 100)}%
                          </span>
                        </div>
                        <Progress value={sandboxPrediction.completion_probability * 100} color="emerald" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Abandonment Probability</span>
                          <span className="font-bold text-destructive">
                            {Math.round(sandboxPrediction.abandonment_probability * 100)}%
                          </span>
                        </div>
                        <Progress value={sandboxPrediction.abandonment_probability * 100} color="destructive" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-muted-foreground block">Explainable Factors:</span>
                      {sandboxPrediction.reasons?.map((r, i) => (
                        <div key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span>{r}</span>
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

      {/* Model Performance & Feature Importances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Importances Chart */}
        <Card className="shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Predictive Feature Weights</span>
              <Badge variant="teal" className="text-[10px]">Gini Importance</Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Relative importance weights computed by the Random Forest classifier
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="h-[250px] flex items-center justify-center">
                <Skeleton className="h-full w-full rounded-xl" />
              </div>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={featureData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 70, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke={resolvedTheme === 'dark' ? '#1e293b' : '#f1f5f9'}
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: resolvedTheme === 'dark' ? '#94a3b8' : '#64748b' }}
                      unit="%"
                    />
                    <YAxis
                      dataKey="feature"
                      type="category"
                      tick={{ fontSize: 11, fill: resolvedTheme === 'dark' ? '#94a3b8' : '#475569' }}
                      width={90}
                    />
                    <Tooltip
                      formatter={(val) => [`${val}%`, 'Importance']}
                      contentStyle={{
                        backgroundColor: resolvedTheme === 'dark' ? '#0f172a' : '#ffffff',
                        borderRadius: '12px',
                        border: resolvedTheme === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0',
                        fontSize: '12px',
                        color: resolvedTheme === 'dark' ? '#f8fafc' : '#0f172a'
                      }}
                    />
                    <Bar dataKey="importance" fill="#0d9488" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Binary Confusion Matrix */}
        <Card className="shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Binary Confusion Matrix</span>
              <Badge variant="outline" className="text-[10px]">
                Test Samples: {modelMetrics?.test_samples || 0}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Predicted vs Actual completion (1 = Completed, 0 = Abandoned)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">
                  True Positive (TP)
                </span>
                <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {modelMetrics?.confusion_matrix?.true_positive ?? 0}
                </span>
                <span className="text-[10px] text-muted-foreground block mt-1">Predicted Complete & Completed</span>
              </div>

              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                <span className="text-[11px] font-semibold text-destructive block mb-1">
                  False Positive (FP)
                </span>
                <span className="text-3xl font-extrabold text-destructive">
                  {modelMetrics?.confusion_matrix?.false_positive ?? 0}
                </span>
                <span className="text-[10px] text-muted-foreground block mt-1">Predicted Complete & Abandoned</span>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 block mb-1">
                  False Negative (FN)
                </span>
                <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                  {modelMetrics?.confusion_matrix?.false_negative ?? 0}
                </span>
                <span className="text-[10px] text-muted-foreground block mt-1">Predicted Abandon & Completed</span>
              </div>

              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <span className="text-[11px] font-semibold text-primary block mb-1">
                  True Negative (TN)
                </span>
                <span className="text-3xl font-extrabold text-primary">
                  {modelMetrics?.confusion_matrix?.true_negative ?? 0}
                </span>
                <span className="text-[10px] text-muted-foreground block mt-1">Predicted Abandon & Abandoned</span>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-muted/40 border border-border text-[11px] text-muted-foreground leading-relaxed">
              <strong>Model:</strong> {modelMetrics?.model_name || 'Random Forest Classifier'} &middot; Accuracy: <strong>{modelMetrics ? Math.round(modelMetrics.accuracy * 100) : '--'}%</strong> &middot; F1: <strong>{modelMetrics ? Math.round(modelMetrics.f1_score * 100) : '--'}%</strong>.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inspect Session Sheet */}
      <Sheet
        open={!!selectedSessionDetail}
        onOpenChange={(open) => !open && setSelectedSessionDetail(null)}
      >
        <SheetContent side="right" className="w-full sm:max-w-md">
          {selectedSessionDetail && (
            <div className="space-y-6">
              <SheetHeader>
                <SheetTitle>Session Risk Inspection</SheetTitle>
                <SheetDescription>
                  ID: <code>{selectedSessionDetail.id}</code>
                </SheetDescription>
              </SheetHeader>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-border bg-card">
                  <span className="text-xs text-muted-foreground block mb-1">Completion Prob</span>
                  <span className="text-xl font-bold text-emerald-600">
                    {Math.round(selectedSessionDetail.completion_probability * 100)}%
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-card">
                  <span className="text-xs text-muted-foreground block mb-1">Abandonment Prob</span>
                  <span className="text-xl font-bold text-destructive">
                    {Math.round(selectedSessionDetail.abandonment_probability * 100)}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Session Behavioral Dimensions
                </h4>
                <div className="p-3 rounded-xl bg-muted/30 border border-border text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Dwell Time:</span>
                    <span className="font-semibold">{selectedSessionDetail.total_duration}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Steps Traversed:</span>
                    <span className="font-semibold">{selectedSessionDetail.step_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Backward Loops:</span>
                    <span className="font-semibold text-amber-500">{selectedSessionDetail.backward_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Errors Logged:</span>
                    <span className="font-semibold text-destructive">{selectedSessionDetail.error_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Journey Path:</span>
                    <span className="font-mono text-[11px] truncate max-w-[200px]">{selectedSessionDetail.journey_path}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}
