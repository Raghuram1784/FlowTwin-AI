import { apiClient } from './apiClient';

export const workflowService = {
  getWorkflows: () => apiClient('/workflows'),
  getWorkflowById: (id) => apiClient(`/workflows/${id}`),
};
