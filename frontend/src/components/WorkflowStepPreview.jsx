import React from 'react';
import { ArrowRight, AlertTriangle, CheckCircle2, Layers } from 'lucide-react';
import { useWorkflow } from '../context/WorkflowContext';

export function WorkflowStepPreview({ steps = [], activeStep, onStepClick }) {
  const { currentWorkflow } = useWorkflow();

  // If steps passed from summary API, use them; otherwise use workflow definition steps
  const displaySteps = (steps && steps.length > 0)
    ? steps
    : (currentWorkflow?.steps?.filter(s => s.id !== currentWorkflow?.exit_step) || []);

  if (!displaySteps.length) return null;

  return (
    <div className="w-full bg-card border border-border rounded-2xl p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Canonical Digital Twin Workflow
          </span>
          <span className="text-[11px] text-muted-foreground font-normal">
            ({currentWorkflow?.name || 'Active Workflow'})
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground hidden sm:block">
          Click any step to inspect workflow graph analytics
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {displaySteps.map((step, idx) => {
          const isSelected = activeStep === step.id;
          const isBottleneck = step.role === 'bottleneck' || (step.drop_off_pct && step.drop_off_pct > 20);
          const isSubmit = step.id === currentWorkflow?.success_step;

          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => onStepClick && onStepClick(step.id)}
                className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all duration-200 shrink-0 ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-xs'
                    : isBottleneck
                    ? 'border-amber-500/40 bg-amber-500/5 hover:border-amber-500'
                    : isSubmit
                    ? 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500'
                    : 'border-border bg-card/50 hover:bg-muted/50'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : isBottleneck
                      ? 'bg-amber-500 text-white'
                      : isSubmit
                      ? 'bg-emerald-600 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {idx + 1}
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                      {step.label || step.id}
                    </span>
                    {isBottleneck && (
                      <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                    )}
                  </div>
                  {step.visits !== undefined && (
                    <span className="text-[10px] text-muted-foreground">
                      {step.visits?.toLocaleString()} visits &middot; {step.drop_off_pct || 0}% drop
                    </span>
                  )}
                </div>
              </button>

              {idx < displaySteps.length - 1 && (
                <ArrowRight className="w-4 h-4 text-border shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
