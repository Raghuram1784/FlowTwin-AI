const BASE_URL = '/api';

export async function fetchApi(endpoint, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`API error ${res.status}: ${errText || res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  getSummaryAnalytics: () => fetchApi('/analytics/summary'),
  getGraphData: () => fetchApi('/analytics/graph'),
  getBottlenecks: () => fetchApi('/analytics/bottlenecks'),
  getPathsAnalytics: () => fetchApi('/analytics/paths'),

  getSessions: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params.risk && params.risk !== 'all') searchParams.set('risk', params.risk);
    if (params.step && params.step !== 'all') searchParams.set('step', params.step);
    if (params.search) searchParams.set('search', params.search);
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    const queryString = searchParams.toString();
    return fetchApi(`/sessions${queryString ? '?' + queryString : ''}`);
  },

  getSessionDetail: (sessionId) => fetchApi(`/sessions/${sessionId}`),

  getModelMetrics: () => fetchApi('/model/metrics'),
  retrainModel: () => fetchApi('/model/retrain', { method: 'POST' }),

  predictLive: (data) => fetchApi('/prediction/live', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  simulateStep: (data) => fetchApi('/simulator/step', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  seedData: (count = 500, reset = true) => fetchApi('/simulator/seed', {
    method: 'POST',
    body: JSON.stringify({ count, reset })
  }),

  resetDatabase: () => fetchApi('/simulator/reset', { method: 'POST' }),

  logEvent: (eventData) => fetchApi('/events', {
    method: 'POST',
    body: JSON.stringify(eventData)
  })
};
