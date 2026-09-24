import { apiClient } from './apiClient';

export const sessionService = {
  getSessions: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.workflow_id && params.workflow_id !== 'all') {
      searchParams.set('workflow_id', params.workflow_id);
    }
    if (params.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params.risk && params.risk !== 'all') searchParams.set('risk', params.risk);
    if (params.step && params.step !== 'all') searchParams.set('step', params.step);
    if (params.search) searchParams.set('search', params.search);
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);

    const qs = searchParams.toString();
    return apiClient(`/sessions${qs ? '?' + qs : ''}`);
  },

  getSessionDetail: (sessionId) => apiClient(`/sessions/${sessionId}`),

  logEvent: (eventData) => apiClient('/events', {
    method: 'POST',
    body: JSON.stringify(eventData)
  }),

  simulateStep: (stepData) => apiClient('/simulator/step', {
    method: 'POST',
    body: JSON.stringify(stepData)
  }),

  seedData: (workflowId = 'all', count = 500, reset = true) => apiClient('/simulator/seed', {
    method: 'POST',
    body: JSON.stringify({ workflow_id: workflowId, count, reset })
  }),

  resetData: (workflowId = 'all') => apiClient(`/simulator/reset?workflow_id=${encodeURIComponent(workflowId)}`, {
    method: 'POST'
  })
};
