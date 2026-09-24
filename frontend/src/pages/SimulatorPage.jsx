import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayCircle,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  LogOut,
  Upload,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Search,
  Briefcase,
  HelpCircle,
  Eye,
  Sparkles,
  ShieldAlert,
  Clock,
  Send,
  Zap,
  Layers,
  Activity,
  UserCheck
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Button,
  Progress,
  Separator,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Input
} from '../components/ui';
import { sessionService } from '../services/sessionService';
import { useWorkflow } from '../context/WorkflowContext';

const JOBS = [
  { id: 'job_1', title: 'Senior AI Engineer', team: 'Platform & Intelligence', salary: '$140k - $180k', location: 'Remote (US/Global)' },
  { id: 'job_2', title: 'Lead Full-Stack Developer', team: 'Core Product', salary: '$130k - $165k', location: 'San Francisco, CA / Hybrid' },
  { id: 'job_3', title: 'Data Scientist - Graph Analytics', team: 'Analytics AI', salary: '$135k - $170k', location: 'New York, NY / Remote' }
];

export function SimulatorPage({ onSessionCreated }) {
  const { workflows, currentWorkflowId, setWorkflowId, currentWorkflow, getStepLabel } = useWorkflow();

  const [sessionId, setSessionId] = useState(`sess_sim_${Math.random().toString(36).substring(2, 9)}`);
  const [userId, setUserId] = useState(`usr_${Math.random().toString(36).substring(2, 8)}`);
  const [currentStep, setCurrentStep] = useState(currentWorkflow?.steps?.[0]?.id || 'start');
  const [timeOnStep, setTimeOnStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [eventsLog, setEventsLog] = useState([]);
  const [selectedJob, setSelectedJob] = useState(JOBS[0]);
  const [uploadedResume, setUploadedResume] = useState(null);
  const [hasError, setHasError] = useState(false);

  // Live session state & prediction
  const [sessionPrediction, setSessionPrediction] = useState({
    completion_probability: 0.5,
    abandonment_probability: 0.5,
    predicted_risk: 'Low',
    reasons: ['Initial entry point. Linear baseline established.']
  });

  // Timer tracking dwell time
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeOnStep(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [currentStep]);

  // When workflow changes, reset session
  useEffect(() => {
    startNewSession();
  }, [currentWorkflowId]);

  const executeTransition = async (toStep, action = 'navigate') => {
    setLoading(true);
    const dwell = Math.max(1, timeOnStep);
    try {
      const res = await sessionService.simulateStep({
        workflow_id: currentWorkflowId,
        session_id: sessionId,
        user_id: userId,
        to_step: toStep,
        action,
        time_spent: dwell
      });

      setCurrentStep(toStep);
      setTimeOnStep(0);
      if (res.event) {
        setEventsLog(prev => [res.event, ...prev]);
      }

      if (res.prediction) {
        setSessionPrediction(res.prediction);
      }

      if (onSessionCreated) onSessionCreated();
    } catch (e) {
      console.error("Transition failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const startNewSession = () => {
    const newSess = `sess_sim_${Math.random().toString(36).substring(2, 9)}`;
    const newUsr = `usr_${Math.random().toString(36).substring(2, 8)}`;
    setSessionId(newSess);
    setUserId(newUsr);
    const initialStep = currentWorkflow?.steps?.[0]?.id || 'start';
    setCurrentStep(initialStep);
    setTimeOnStep(0);
    setEventsLog([]);
    setUploadedResume(null);
    setHasError(false);
    setSessionPrediction({
      completion_probability: 0.5,
      abandonment_probability: 0.5,
      predicted_risk: 'Low',
      reasons: ['Initial workflow entry. Baseline model active.']
    });
  };

  // Run Persona Fast Simulations for active workflow
  const runPersonaSimulation = async (personaType) => {
    startNewSession();
    setLoading(true);
    try {
      const sess = `sess_persona_${Math.random().toString(36).substring(2, 8)}`;
      setSessionId(sess);

      const steps = currentWorkflow?.steps || [];
      if (steps.length === 0) return;

      let stepsSequence = [];
      const endStep = steps[steps.length - 1]?.id || 'submit';

      if (personaType === 'ideal') {
        // Linear through all steps to completion
        for (let i = 1; i < steps.length; i++) {
          const isFinal = i === steps.length - 1;
          stepsSequence.push({
            to: steps[i].id,
            act: isFinal ? 'submit' : 'navigate',
            time: Math.floor(Math.random() * 15) + 10
          });
        }
      } else if (personaType === 'friction') {
        // Hesitation loop halfway, then abandon
        const midIdx = Math.floor(steps.length / 2);
        for (let i = 1; i <= midIdx; i++) {
          stepsSequence.push({ to: steps[i].id, act: 'navigate', time: 20 });
        }
        // Loop back
        if (midIdx > 1) {
          stepsSequence.push({ to: steps[midIdx - 1].id, act: 'back', time: 35 });
          stepsSequence.push({ to: steps[midIdx].id, act: 'navigate', time: 50 });
        }
        stepsSequence.push({ to: 'exit', act: 'exit', time: 25 });
      } else if (personaType === 'error_retry') {
        // Step halfway, error, retry, then continue
        const midIdx = Math.min(3, steps.length - 1);
        for (let i = 1; i <= midIdx; i++) {
          stepsSequence.push({ to: steps[i].id, act: 'navigate', time: 15 });
        }
        stepsSequence.push({ to: steps[midIdx].id, act: 'error', time: 40 });
        stepsSequence.push({ to: 'exit', act: 'exit', time: 20 });
      } else if (personaType === 'early_drop') {
        if (steps.length > 1) {
          stepsSequence.push({ to: steps[1].id, act: 'navigate', time: 8 });
        }
        stepsSequence.push({ to: 'exit', act: 'exit', time: 10 });
      }

      for (const s of stepsSequence) {
        const res = await sessionService.simulateStep({
          workflow_id: currentWorkflowId,
          session_id: sess,
          user_id: userId,
          to_step: s.to,
          action: s.act,
          time_spent: s.time
        });
        setCurrentStep(s.to);
        if (res.event) setEventsLog(prev => [res.event, ...prev]);
        if (res.prediction) setSessionPrediction(res.prediction);
      }
      if (onSessionCreated) onSessionCreated();
    } catch (e) {
      console.error("Persona simulation failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const riskBadgeVariant =
    sessionPrediction.predicted_risk === 'High' ? 'destructive' :
    sessionPrediction.predicted_risk === 'Medium' ? 'warning' : 'success';

  const stepsList = currentWorkflow?.steps || [];
  const currentStepIdx = stepsList.findIndex(s => s.id === currentStep);
  const nextStep = currentStepIdx >= 0 && currentStepIdx < stepsList.length - 1 ? stepsList[currentStepIdx + 1] : null;
  const prevStep = currentStepIdx > 0 ? stepsList[currentStepIdx - 1] : null;
  const isFinalStep = currentStepIdx === stepsList.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <PlayCircle className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              Live Journey Simulator
            </h1>
            <Badge variant="outline" className="text-xs">
              Developer & Demonstration Tool
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Interact with simulated user workflows in real time. Every step generates timestamped events in the database and triggers live ML risk inference.
          </p>
        </div>

        {/* Workflow Switcher & New Session */}
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={currentWorkflowId} onValueChange={setWorkflowId}>
            <SelectTrigger className="h-8.5 text-xs w-48">
              <SelectValue placeholder="Workflow..." />
            </SelectTrigger>
            <SelectContent>
              {workflows.map(wf => (
                <SelectItem key={wf.id} value={wf.id}>
                  {wf.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={startNewSession}
            className="text-xs h-8.5"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            New Clean Session
          </Button>
        </div>
      </div>

      {/* Main Simulator & Live Engine Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Realistic User Interface (Interactive Workflow) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Step Progress Header */}
          <div className="p-3.5 rounded-xl bg-card border border-border shadow-xs flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs font-semibold">
                Step: {getStepLabel(currentStep)}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary" /> Dwell: <strong>{timeOnStep}s</strong>
              </span>
            </div>

            {currentStep !== 'exit' && !isFinalStep && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => executeTransition('exit', 'exit')}
                disabled={loading}
                className="text-xs h-8"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" />
                Exit / Abandon
              </Button>
            )}
          </div>

          {/* Interactive Screen Container */}
          <Card className="min-h-[420px] flex flex-col justify-between p-6 shadow-xs border-border">
            {/* If Job Application workflow, render custom candidate mock views; otherwise render generic dynamic runner */}
            {currentWorkflowId === 'job_application' ? (
              <>
                {/* Step 1: Start */}
                {currentStep === 'start' && (
                  <div className="space-y-4 my-auto text-center max-w-md mx-auto py-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center shadow-inner">
                      <Briefcase className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">
                        Acme Careers Portal
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Welcome to the talent acquisition portal. Begin candidate exploration to discover open engineering and data roles.
                      </p>
                    </div>
                    <Button
                      variant="default"
                      onClick={() => executeTransition('search', 'navigate')}
                      disabled={loading}
                      className="w-full sm:w-auto px-8"
                    >
                      Start Career Exploration <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}

                {/* Step 2: Search */}
                {currentStep === 'search' && (
                  <div className="space-y-4">
                    <div className="border-b border-border pb-3">
                      <h3 className="font-bold text-base text-foreground">Search Open Roles</h3>
                      <p className="text-xs text-muted-foreground">Select a position from the active job listings</p>
                    </div>

                    <div className="space-y-2.5">
                      {JOBS.map((job) => (
                        <div
                          key={job.id}
                          onClick={() => setSelectedJob(job)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            selectedJob.id === job.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-muted-foreground/30'
                          }`}
                        >
                          <div>
                            <span className="font-semibold text-xs text-foreground block">
                              {job.title}
                            </span>
                            <span className="text-[11px] text-muted-foreground">{job.team} &middot; {job.location}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">{job.salary}</Badge>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => executeTransition('start', 'back')}
                        disabled={loading}
                      >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => executeTransition('job_details', 'navigate')}
                        disabled={loading}
                      >
                        View Job Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Job Details */}
                {currentStep === 'job_details' && (
                  <div className="space-y-4">
                    <div className="border-b border-border pb-3">
                      <Badge variant="secondary" className="mb-1 text-[10px]">Open Position</Badge>
                      <h3 className="font-bold text-lg text-foreground">{selectedJob.title}</h3>
                      <p className="text-xs text-muted-foreground">{selectedJob.team} &middot; {selectedJob.location}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-muted/40 text-xs text-foreground space-y-2">
                      <p><strong>Compensation:</strong> {selectedJob.salary} + Equity</p>
                      <p><strong>Responsibilities:</strong> Architect graph data structures, design scalable REST services, and optimize digital user journeys.</p>
                      <p><strong>Key Requirements:</strong> Proficiency in Python, FastAPI, React, and network algorithms.</p>
                    </div>

                    <div className="pt-4 flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => executeTransition('search', 'back')}
                        disabled={loading}
                      >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Search
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => executeTransition('apply', 'navigate')}
                        disabled={loading}
                      >
                        Apply for this Job <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 4: Apply */}
                {currentStep === 'apply' && (
                  <div className="space-y-4">
                    <div className="border-b border-border pb-3">
                      <h3 className="font-bold text-base text-foreground">Applicant Contact Information</h3>
                      <p className="text-xs text-muted-foreground">Provide basic candidate profile details</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-muted-foreground block mb-1">Full Legal Name</label>
                        <Input type="text" defaultValue="Alex Taylor" className="h-9 text-xs" />
                      </div>
                      <div>
                        <label className="text-muted-foreground block mb-1">Email Address</label>
                        <Input type="email" defaultValue="alex.taylor@example.com" className="h-9 text-xs" />
                      </div>
                    </div>

                    <div className="pt-4 flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => executeTransition('job_details', 'back')}
                        disabled={loading}
                      >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => executeTransition('resume_upload', 'navigate')}
                        disabled={loading}
                      >
                        Proceed to Resume Upload <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 5: Resume Upload */}
                {currentStep === 'resume_upload' && (
                  <div className="space-y-4">
                    <div className="border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-foreground">Resume / CV Upload</h3>
                        <Badge variant="warning" className="text-[10px]">High Centrality</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Upload your PDF or Word resume (Max 5MB)</p>
                    </div>

                    <div className={`p-8 rounded-2xl border-2 border-dashed text-center transition-colors ${
                      hasError
                        ? 'border-destructive bg-destructive/5'
                        : uploadedResume
                        ? 'border-emerald-500 bg-emerald-50/20'
                        : 'border-border bg-muted/20'
                    }`}>
                      <Upload className={`w-8 h-8 mx-auto mb-2 ${hasError ? 'text-destructive' : uploadedResume ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                      {hasError ? (
                        <div className="text-xs text-destructive">
                          <strong>Upload Error:</strong> Resume parsing failed. Unsupported format detected.
                        </div>
                      ) : uploadedResume ? (
                        <div className="text-xs text-emerald-600 dark:text-emerald-400">
                          <strong>Resume Uploaded:</strong> Alex_Taylor_Resume_2026.pdf (142 KB)
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          <span>Drag and drop your resume here, or simulate an action below</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setUploadedResume(true); setHasError(false); }}
                        className="text-xs border-emerald-500/50 text-emerald-600 dark:text-emerald-400"
                      >
                        Simulate Valid Resume Upload
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setHasError(true);
                          executeTransition('resume_upload', 'error');
                        }}
                        className="text-xs border-destructive/50 text-destructive"
                      >
                        Simulate Parsing Failure Error
                      </Button>
                    </div>

                    <div className="pt-4 flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => executeTransition('apply', 'back')}
                        disabled={loading}
                      >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Apply
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => executeTransition('questions', 'navigate')}
                        disabled={loading}
                      >
                        Continue to Screening Questions <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 6: Questions */}
                {currentStep === 'questions' && (
                  <div className="space-y-4">
                    <div className="border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-foreground">Screening Questionnaire</h3>
                        <Badge variant="destructive" className="text-[10px]">Identified Drop-off Node</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Please answer role-specific qualification questions</p>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="text-foreground block mb-1 font-medium">
                          1. Years of experience with graph theory and predictive analytics:
                        </label>
                        <select className="w-full h-9 px-3 rounded-lg border border-input bg-background text-foreground text-xs">
                          <option>1-2 years</option>
                          <option>3-5 years</option>
                          <option>5+ years</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-foreground block mb-1 font-medium">
                          2. Authorization to work without visa sponsorship:
                        </label>
                        <select className="w-full h-9 px-3 rounded-lg border border-input bg-background text-foreground text-xs">
                          <option>Yes, authorized without sponsorship</option>
                          <option>No, require sponsorship</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-foreground">
                      <span className="font-semibold block mb-0.5 text-amber-600 dark:text-amber-400">Backtracking Friction Loop:</span>
                      Users frequently navigate backward to Resume Upload to re-check information.
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => executeTransition('resume_upload', 'back')}
                        disabled={loading}
                        className="mt-2 text-xs border-amber-500/40 text-amber-600 dark:text-amber-400"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                        Simulate Loop Back to Resume
                      </Button>
                    </div>

                    <div className="pt-4 flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => executeTransition('resume_upload', 'back')}
                        disabled={loading}
                      >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => executeTransition('review', 'navigate')}
                        disabled={loading}
                      >
                        Proceed to Review <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 7: Review */}
                {currentStep === 'review' && (
                  <div className="space-y-4">
                    <div className="border-b border-border pb-3">
                      <h3 className="font-bold text-base text-foreground">Review & Verify Application</h3>
                      <p className="text-xs text-muted-foreground">Ensure all details are accurate before final submission</p>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-muted/30 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Position:</span>
                        <span className="font-semibold text-foreground">{selectedJob.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Applicant:</span>
                        <span className="font-medium text-foreground">Alex Taylor (alex.taylor@example.com)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Attached Resume:</span>
                        <span className="font-medium text-emerald-600">Alex_Taylor_Resume_2026.pdf (Verified)</span>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => executeTransition('questions', 'back')}
                        disabled={loading}
                      >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Edit Questions
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => executeTransition('submit', 'submit')}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Submit Application
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 8: Submit / Exit Confirmation */}
                {(currentStep === 'submit' || currentStep === 'exit') && (
                  <div className="space-y-4 my-auto text-center max-w-md mx-auto py-8">
                    {currentStep === 'submit' ? (
                      <>
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
                          <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                            Application Submitted Successfully!
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            Session recorded as <strong>Completed (1)</strong>. The journey has been integrated into the digital twin graph.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive mx-auto flex items-center justify-center">
                          <LogOut className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-destructive">
                            User Abandoned Journey
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            Session logged as <strong>Abandoned (0)</strong>. Friction parameters and dwell times logged to analytics.
                          </p>
                        </div>
                      </>
                    )}

                    <Button
                      variant="default"
                      onClick={startNewSession}
                      className="px-8 mt-2"
                    >
                      Start Another Interactive Session
                    </Button>
                  </div>
                )}
              </>
            ) : (
              /* Generic Dynamic Stepper for any other workflow (Hospital, Loan, etc.) */
              <div className="space-y-6 my-auto">
                <div className="border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-semibold">
                      Step {currentStepIdx + 1} of {stepsList.length}
                    </Badge>
                    <span className="text-xs text-muted-foreground">({currentWorkflow?.name})</span>
                  </div>
                  <h3 className="font-bold text-xl text-foreground mt-1">
                    {getStepLabel(currentStep)}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentStepIdx >= 0 ? `Stage type: ${stepsList[currentStepIdx]?.type || 'standard'}` : 'Dynamic workflow phase'}
                  </p>
                </div>

                {/* Step visual timeline bar */}
                <div className="flex items-center gap-2 overflow-x-auto py-2">
                  {stepsList.map((st, i) => (
                    <div
                      key={st.id}
                      className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap border transition-all ${
                        st.id === currentStep
                          ? 'border-primary bg-primary/10 text-primary font-bold'
                          : i < currentStepIdx
                          ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-600'
                          : 'border-border bg-muted/20 text-muted-foreground'
                      }`}
                    >
                      {i + 1}. {st.label}
                    </div>
                  ))}
                </div>

                {/* Simulated interactive actions */}
                <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                  <span className="text-xs font-semibold text-foreground block">
                    Interactive Transition Options:
                  </span>
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => executeTransition(currentStep, 'error')}
                      disabled={loading}
                      className="text-destructive border-destructive/30"
                    >
                      Simulate Form / Processing Error
                    </Button>
                    {prevStep && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => executeTransition(prevStep.id, 'back')}
                        disabled={loading}
                        className="text-amber-600 border-amber-500/30"
                      >
                        Simulate Backtrack to {prevStep.label}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Footer Navigation */}
                <div className="pt-4 flex justify-between items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => prevStep && executeTransition(prevStep.id, 'back')}
                    disabled={!prevStep || loading}
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                    Previous Stage
                  </Button>

                  {isFinalStep ? (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => executeTransition(currentStep, 'submit')}
                      disabled={loading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      Complete Workflow
                    </Button>
                  ) : nextStep ? (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => executeTransition(nextStep.id, 'navigate')}
                      disabled={loading}
                    >
                      Advance to {nextStep.label} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  ) : null}
                </div>
              </div>
            )}
          </Card>

          {/* Quick Persona Batch Simulation Bar */}
          <Card className="p-4 bg-muted/20 border-border">
            <span className="text-xs font-semibold text-foreground block mb-2">
              Automated Persona Generator & Simulator ({currentWorkflow?.name})
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              <Button
                variant="outline"
                size="sm"
                onClick={() => runPersonaSimulation('ideal')}
                disabled={loading}
                className="text-xs"
              >
                <Zap className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                Ideal User (Direct Complete)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runPersonaSimulation('friction')}
                disabled={loading}
                className="text-xs"
              >
                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-500" />
                Friction Loop (Hesitates & Exits)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runPersonaSimulation('error_retry')}
                disabled={loading}
                className="text-xs"
              >
                <ShieldAlert className="w-3.5 h-3.5 mr-1 text-destructive" />
                Error & Drop-off
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runPersonaSimulation('early_drop')}
                disabled={loading}
                className="text-xs"
              >
                <LogOut className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                Early Stage Exit
              </Button>
            </div>
          </Card>
        </div>

        {/* Right: Real-time Live Engine Feedback & Event Stream */}
        <div className="space-y-4">
          {/* Live Risk Badge Card */}
          <Card className="p-5 shadow-xs border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[11px] text-muted-foreground block font-medium">Session ID</span>
                <span className="font-mono text-xs font-semibold text-foreground">{sessionId}</span>
              </div>
              <Badge variant={riskBadgeVariant} className="text-xs font-bold px-3 py-1">
                Risk: {sessionPrediction.predicted_risk}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                <span className="text-[10px] text-muted-foreground block mb-0.5">Completion Prob</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {Math.round((sessionPrediction.completion_probability || 0) * 100)}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-center">
                <span className="text-[10px] text-muted-foreground block mb-0.5">Abandon Prob</span>
                <span className="text-xl font-bold text-destructive">
                  {Math.round((sessionPrediction.abandonment_probability || 0) * 100)}%
                </span>
              </div>
            </div>

            {/* Explanatory Reasons */}
            <div className="space-y-1.5 text-xs text-foreground">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                ML Decision Drivers
              </span>
              {sessionPrediction.reasons?.map((r, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Chronological Event Log Stream */}
          <Card className="p-5 shadow-xs border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Live DB Event Stream ({eventsLog.length})
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {eventsLog.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-4 text-center">
                  Take actions above to log events to the database.
                </p>
              ) : (
                eventsLog.map((ev, i) => (
                  <div
                    key={ev.id || i}
                    className="p-2.5 rounded-xl bg-card border border-border text-xs flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-medium text-foreground text-[11px]">
                        {getStepLabel(ev.from_step)} &rarr; {getStepLabel(ev.to_step)}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        action: <code className="text-foreground font-mono">{ev.action}</code> &middot; {ev.time_spent}s
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      #{ev.id || eventsLog.length - i}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
