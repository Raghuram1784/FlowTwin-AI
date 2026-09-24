const BASE_URL = '/api';

export async function apiClient(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      let errorMsg = `API Error ${res.status}: ${res.statusText}`;
      try {
        const errorData = await res.json();
        if (errorData?.detail) {
          errorMsg = errorData.detail;
        }
      } catch (_) {
        const text = await res.text();
        if (text) errorMsg = text;
      }
      throw new Error(errorMsg);
    }
    return await res.json();
  } catch (error) {
    console.error(`[FlowTwin API Error] ${endpoint}:`, error);
    throw error;
  }
}
