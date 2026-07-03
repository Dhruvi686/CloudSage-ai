import type {
  DashboardResponse,
  Recommendation,
  ResourceCollection,
  ForecastResponse,
  ScoreResponse,
  UploadResponse,
  ErrorResponse,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const body: ErrorResponse = await res.json().catch(() => ({
      error: { code: 'NETWORK_ERROR', message: res.statusText },
    }));
    throw new ApiError(body.error.code, body.error.message, res.status);
  }
  return res.json();
}

export const api = {
  health: () => fetchJson<{ status: string }>('/health'),

  upload: async (files: FormData): Promise<UploadResponse> => {
    const res = await fetch(`${API_BASE}/api/v1/upload`, { method: 'POST', body: files });
    if (!res.ok) {
      const body: ErrorResponse = await res.json();
      throw new ApiError(body.error.code, body.error.message, res.status);
    }
    return res.json();
  },

  dashboard: () => fetchJson<DashboardResponse>('/api/v1/dashboard'),

  recommendations: (params?: URLSearchParams) =>
    fetchJson<Recommendation[]>(`/api/v1/recommendations${params ? '?' + params : ''}`),

  resources: (params?: URLSearchParams) =>
    fetchJson<ResourceCollection>(`/api/v1/resources${params ? '?' + params : ''}`),

  forecast: () => fetchJson<ForecastResponse>('/api/v1/forecast'),

  score: () => fetchJson<ScoreResponse>('/api/v1/score'),

  report: async (): Promise<Blob> => {
    const res = await fetch(`${API_BASE}/api/v1/report`);
    if (!res.ok) throw new Error('Failed to download report');
    return res.blob();
  },
};

export { ApiError };
