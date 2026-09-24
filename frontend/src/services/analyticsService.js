import { apiClient } from './apiClient';

export const analyticsService = {
  getSummary: (workflowId = 'job_application') =>
    apiClient(`/analytics/summary?workflow_id=${encodeURIComponent(workflowId)}`),

  getGraph: (workflowId = 'job_application') =>
    apiClient(`/analytics/graph?workflow_id=${encodeURIComponent(workflowId)}`),

  getBottlenecks: (workflowId = 'job_application') =>
    apiClient(`/analytics/bottlenecks?workflow_id=${encodeURIComponent(workflowId)}`),

  getPaths: (workflowId = 'job_application') =>
    apiClient(`/analytics/paths?workflow_id=${encodeURIComponent(workflowId)}`),
};
