import React, { createContext, useContext, useEffect, useState } from 'react';
import { workflowService } from '../services/workflowService';

const WorkflowContext = createContext({
  workflows: [],
  currentWorkflowId: 'job_application',
  currentWorkflow: null,
  setWorkflowId: () => {},
  getStepLabel: (id) => id,
  stepMap: {},
  loading: true,
  refreshWorkflows: () => {}
});

export function WorkflowProvider({ children }) {
  const [workflows, setWorkflows] = useState([]);
  const [currentWorkflowId, setCurrentWorkflowId] = useState(() => {
    return localStorage.getItem('flowtwin-active-workflow') || 'job_application';
  });
  const [loading, setLoading] = useState(true);

  const fetchWorkflows = async () => {
    try {
      const res = await workflowService.getWorkflows();
      if (res?.workflows?.length) {
        setWorkflows(res.workflows);
        // Ensure currentWorkflowId is valid
        const exists = res.workflows.some(w => w.id === currentWorkflowId);
        if (!exists) {
          setCurrentWorkflowId(res.workflows[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load workflows:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const setWorkflowId = (newId) => {
    localStorage.setItem('flowtwin-active-workflow', newId);
    setCurrentWorkflowId(newId);
  };

  const currentWorkflow =
    workflows.find(w => w.id === currentWorkflowId) || workflows[0] || null;

  const stepMap = (currentWorkflow?.steps || []).reduce((acc, step) => {
    acc[step.id] = step;
    return acc;
  }, {});

  const getStepLabel = (stepId) => {
    if (!stepId) return '--';
    if (stepMap[stepId]) return stepMap[stepId].label;
    // Fallback human readable
    return stepId
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <WorkflowContext.Provider
      value={{
        workflows,
        currentWorkflowId,
        currentWorkflow,
        setWorkflowId,
        getStepLabel,
        stepMap,
        loading,
        refreshWorkflows: fetchWorkflows
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
}
