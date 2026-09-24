import { apiClient } from './apiClient';

export const predictionService = {
  getModelMetrics: (workflowId = 'job_application') =>
    apiClient(`/model/metrics?workflow_id=${encodeURIComponent(workflowId)}`),

  retrainModel: (workflowId = 'job_application') =>
    apiClient(`/model/retrain?workflow_id=${encodeURIComponent(workflowId)}`, {
      method: 'POST'
    }),

  predictLive: (data) =>
    apiClient('/prediction/live', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getSessionPrediction: (sessionId) =>
    apiClient(`/prediction/${sessionId}`),
};
