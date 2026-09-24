import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button, Progress } from './ui';
import { Sparkles, AlertTriangle, ShieldCheck, ShieldAlert, RotateCcw, PlusCircle, ArrowRight, Info, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

const PRESET_JOURNEYS = [
  {
    name: "Standard Direct (Low Risk)",
    steps: ["start", "search", "job_details", "apply", "resume_upload"],
    current_step: "resume_upload",
    backward_count: 0,
    errors_count: 0,
    time_spent: 25.0
  },
  {
    name: "Questions Friction (High Risk)",
    steps: ["start", "search", "job_details", "apply", "resume_upload", "questions", "resume_upload", "questions"],
    current_step: "questions",
    backward_count: 2,
    errors_count: 1,
    time_spent: 110.0
  },
  {
    name: "Near Completion (Very Low Risk)",
    steps: ["start", "search", "job_details", "apply", "resume_upload", "questions", "review"],
    current_step: "review",
    backward_count: 0,
    errors_count: 0,
    time_spent: 22.0
  },
  {
    name: "Hesitant Searcher (Medium Risk)",
    steps: ["start", "search", "job_details", "search"],
    current_step: "search",
    backward_count: 1,
    errors_count: 0,
    time_spent: 45.0
  }
];

export function LivePredictionCard({ onSessionSelected }) {
  const [journeySteps, setJourneySteps] = useState(["start", "search", "job_details", "apply", "resume_upload"]);
  const [currentStep, setCurrentStep] = useState("resume_upload");
  const [backwardCount, setBackwardCount] = useState(0);
  const [errorsCount, setErrorsCount] = useState(0);
  const [timeSpent, setTimeSpent] = useState(35.0);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState({
    journey: "Start -> Search -> Details -> Apply -> Resume",
    current_step: "resume_upload",
    completion_probability: 0.34,
    abandonment_probability: 0.66,
    predicted_risk: "High",
    reasons: [
      "Screening Questions & Resume Upload are designated high-attrition bottleneck nodes.",
      "Elevated dwell time detected relative to canonical step duration."
    ],
    feature_values: {}
  });

  const runPrediction = async (steps, curr, back, errs, time) => {
    setLoading(true);
    try {
      const res = await api.predictLive({
        journey_steps: steps,
        current_step: curr,
        total_duration: time * steps.length,
        time_spent_current: time,
        backward_count: back,
        errors_count: errs,
        repeated_steps: back
      });
      setPrediction(res);
    } catch (e) {
      console.error("Live prediction failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runPrediction(journeySteps, currentStep, backwardCount, errorsCount, timeSpent);
  }, []);

  const handleApplyPreset = (preset) => {
    setJourneySteps(preset.steps);
    setCurrentStep(preset.current_step);
    setBackwardCount(preset.backward_count);
    setErrorsCount(preset.errors_count);
    setTimeSpent(preset.time_spent);
    runPrediction(preset.steps, preset.current_step, preset.backward_count, preset.errors_count, preset.time_spent);
  };

  const handleAddStep = (nextStep, isBackward = false) => {
    const updated = [...journeySteps, nextStep];
    const newBack = isBackward ? backwardCount + 1 : backwardCount;
    setJourneySteps(updated);
    setCurrentStep(nextStep);
    setBackwardCount(newBack);
    runPrediction(updated, nextStep, newBack, errorsCount, timeSpent);
  };

  const handleAddError = () => {
    const updatedErrs = errorsCount + 1;
    setErrorsCount(updatedErrs);
    runPrediction(journeySteps, currentStep, backwardCount, updatedErrs, timeSpent);
  };

  const handleReset = () => {
    handleApplyPreset(PRESET_JOURNEYS[0]);
  };

  const riskVariant =
    prediction.predicted_risk === 'High' ? 'destructive' :
    prediction.predicted_risk === 'Medium' ? 'warning' : 'success';

  const RiskIcon =
    prediction.predicted_risk === 'High' ? ShieldAlert :
    prediction.predicted_risk === 'Medium' ? AlertTriangle : ShieldCheck;

  return (
    <Card className="border-blue-200/70 dark:border-blue-900/50 shadow-md">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base">Live Journey Predictive Engine</CardTitle>
              <CardDescription className="text-xs">
                Real-time Scikit-Learn Random Forest inference on active user session
              </CardDescription>
            </div>
          </div>
          <Badge variant={riskVariant} className="text-xs px-3 py-1 font-semibold flex items-center gap-1.5">
            <RiskIcon className="w-3.5 h-3.5" />
            Risk: {prediction.predicted_risk}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-5">
        {/* Preset scenario shortcuts */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Test Interactive Scenarios
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_JOURNEYS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleApplyPreset(p)}
                className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 transition-colors"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Current Journey Breadcrumb */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
            Current Journey Path
          </span>
          <div className="flex items-center gap-1.5 flex-wrap text-xs font-medium text-slate-800 dark:text-slate-200">
            {journeySteps.map((step, i) => (
              <React.Fragment key={i}>
                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                  {step}
                </span>
                {i < journeySteps.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Probability Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-slate-500">Completion Probability</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {Math.round(prediction.completion_probability * 100)}%
              </span>
            </div>
            <Progress
              value={prediction.completion_probability * 100}
              color="emerald"
              className="h-2.5"
            />
          </div>

          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-slate-500">Abandonment Probability</span>
              <span className="text-lg font-bold text-rose-600 dark:text-rose-400">
                {Math.round(prediction.abandonment_probability * 100)}%
              </span>
            </div>
            <Progress
              value={prediction.abandonment_probability * 100}
              color="rose"
              className="h-2.5"
            />
          </div>
        </div>

        {/* Explainable Reasons */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-500" />
            Predictive Explainability & Feature Drivers
          </span>
          <div className="space-y-1.5">
            {prediction.reasons.map((reason, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Interaction Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddStep('questions')}
              disabled={loading}
              className="text-xs"
            >
              Advance to Questions
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddStep('resume_upload', true)}
              disabled={loading}
              className="text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-50"
            >
              Loop Back to Resume
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddError}
              disabled={loading}
              className="text-xs text-rose-700 dark:text-rose-400 hover:bg-rose-50"
            >
              Trigger Upload Error
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-slate-500"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset State
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
