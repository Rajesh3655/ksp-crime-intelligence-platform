/**
 * CIAP API Client
 * Wraps all backend API calls with auth token management, error handling,
 * and graceful fallback to mock data in development
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ── Token management ──────────────────────────────────────────────────────────
const getToken = (): string | null => localStorage.getItem('ciap_token');
const setToken = (token: string): void => { localStorage.setItem('ciap_token', token); };
const clearToken = (): void => { localStorage.removeItem('ciap_token'); localStorage.removeItem('ciap_user'); };

// ── Base fetch with auth ──────────────────────────────────────────────────────
const apiRequest = async <T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-ID': crypto.randomUUID(),
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (response.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  return response.json() as T;
};

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  login: async (email: string, password: string) => {
    const res = await apiRequest<{ data: { token: string; user: Record<string, unknown> } }>(
      '/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    setToken(res.data.token);
    localStorage.setItem('ciap_user', JSON.stringify(res.data.user));
    return res.data;
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      clearToken();
    }
  },

  getMe: () => apiRequest('/auth/me'),

  setLanguage: (language: 'en' | 'kn') =>
    apiRequest('/auth/language', { method: 'PUT', body: JSON.stringify({ language }) }),

  getCurrentUser: () => {
    const raw = localStorage.getItem('ciap_user');
    return raw ? JSON.parse(raw) : null;
  },

  isAuthenticated: () => !!getToken(),
};

// ── Crimes API ────────────────────────────────────────────────────────────────
export const crimesAPI = {
  list: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return apiRequest(`/crimes?${qs}`);
  },

  get: (id: number) => apiRequest(`/crimes/${id}`),

  heatmap: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/crimes/geo/heatmap?${qs}`);
  },
};

// ── Alerts API ────────────────────────────────────────────────────────────────
export const alertsAPI = {
  list: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/alerts?${qs}`);
  },

  acknowledge: (id: string | number) =>
    apiRequest(`/alerts/${id}/acknowledge`, { method: 'POST' }),

  escalate: (id: string | number) =>
    apiRequest(`/alerts/${id}/escalate`, { method: 'POST' }),

  resolve: (id: string | number) =>
    apiRequest(`/alerts/${id}/resolve`, { method: 'POST' }),

  assign: (id: string | number, userId: number) =>
    apiRequest(`/alerts/${id}/assign`, { method: 'POST', body: JSON.stringify({ userId }) }),
};

// ── Forecasting API ───────────────────────────────────────────────────────────
export const forecastAPI = {
  get: (params: { districtId?: number; crimeType?: string; days?: number } = {}) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return apiRequest(`/forecast?${qs}`);
  },

  generate: (data: { districtId?: number; crimeType?: string; days?: number }) =>
    apiRequest('/forecast/generate', { method: 'POST', body: JSON.stringify(data) }),

  history: () => apiRequest('/forecast/history'),
};

// ── Risk API ──────────────────────────────────────────────────────────────────
export const riskAPI = {
  list:    () => apiRequest('/risk'),
  get:     (districtId: number) => apiRequest(`/risk/${districtId}`),
  compute: (districtIds?: number[]) =>
    apiRequest('/risk/compute', { method: 'POST', body: JSON.stringify({ districtIds }) }),
};

// ── AI Copilot API ────────────────────────────────────────────────────────────
export const aiAPI = {
  chat: (message: string, sessionId?: string, context?: Record<string, unknown>, language = 'en') =>
    apiRequest('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, sessionId, context, language }),
    }),

  insights: (params: { districtId?: number; language?: string } = {}) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return apiRequest(`/ai/insights?${qs}`);
  },

  sessions: () => apiRequest('/ai/sessions'),
};

// ── Intelligence API ─────────────────────────────────────────────────────────
export const intelligenceAPI = {
  analyzeCase: (caseMasterId: number) =>
    apiRequest(`/intelligence/cases/${caseMasterId}/analyze`, { method: 'POST' }),

  analyzeRecent: (limit = 50) =>
    apiRequest('/intelligence/cases/analyze-recent', { method: 'POST', body: JSON.stringify({ limit }) }),

  explainCase: (caseMasterId: number) =>
    apiRequest(`/intelligence/cases/${caseMasterId}/explain`),

  graph: (caseMasterId: number) =>
    apiRequest(`/intelligence/graph/${caseMasterId}`),

  recomputeRepeatOffenders: (limit = 50) =>
    apiRequest('/intelligence/repeat-offenders/recompute', { method: 'POST', body: JSON.stringify({ limit }) }),

  geoReplay: (params: { interval?: 'week' | 'month'; districtId?: number } = {}) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return apiRequest(`/intelligence/geo/replay?${qs}`);
  },

  scrbBriefing: () => apiRequest('/intelligence/scrb/briefing'),
};

export const monitoringAPI = {
  health: () => apiRequest('/monitoring/health'),
};

export const mlAPI = {
  dashboard: () => apiRequest('/ml/dashboard'),
  registry: () => apiRequest('/ml/registry'),
  buildDataset: (limit = 5000) => apiRequest('/ml/datasets/build', { method: 'POST', body: JSON.stringify({ limit }) }),
  train: (target = 'risk', limit = 5000) => apiRequest('/ml/train', { method: 'POST', body: JSON.stringify({ target, limit }) }),
  promote: (modelRegistryId: number) => apiRequest(`/ml/registry/${modelRegistryId}/promote`, { method: 'POST' }),
  checkDrift: (limit = 1000) => apiRequest('/ml/drift/check', { method: 'POST', body: JSON.stringify({ limit }) }),
  feedback: (data: { caseMasterId?: number; findingId?: number; feedbackType: string; rating: number; comment?: string }) =>
    apiRequest('/ml/feedback', { method: 'POST', body: JSON.stringify(data) }),
  indexEmbeddings: (limit = 2000) => apiRequest('/ml/embeddings/index', { method: 'POST', body: JSON.stringify({ limit }) }),
  vectorSearch: (q: string, limit = 10) => apiRequest(`/ml/vector-search?${new URLSearchParams({ q, limit: String(limit) })}`),
};

// ── Ingestion API ─────────────────────────────────────────────────────────────
export const ingestionAPI = {
  uploadCSV: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest('/ingest/csv', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set multipart boundary
    });
  },

  uploadExcel: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest('/ingest/excel', { method: 'POST', body: formData, headers: {} });
  },

  syncCCTNS: (opts: { syncType?: string; districtId?: number; dateFrom?: string } = {}) =>
    apiRequest('/ingest/cctns', { method: 'POST', body: JSON.stringify(opts) }),

  batches:   () => apiRequest('/ingest/batches'),
  batchStatus: (id: string) => apiRequest(`/ingest/batches/${id}`),
};

// ── Reports API ───────────────────────────────────────────────────────────────
export const reportsAPI = {
  list: () => apiRequest('/reports'),

  generate: (data: {
    reportType: string;
    districtId?: number;
    periodStart: string;
    periodEnd:   string;
    language?:   string;
  }) => apiRequest('/reports/generate', { method: 'POST', body: JSON.stringify(data) }),

  get: (id: number | string) => apiRequest(`/reports/${id}`),
};

// ── Admin API ─────────────────────────────────────────────────────────────────
export const adminAPI = {
  users: {
    list:   (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return apiRequest(`/admin/users?${qs}`);
    },
    create: (data: Record<string, unknown>) =>
      apiRequest('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Record<string, unknown>) =>
      apiRequest(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  audit:     (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/admin/audit?${qs}`);
  },
  districts: () => apiRequest('/admin/districts'),
  stats:     () => apiRequest('/admin/stats'),
};

// ── Health check ──────────────────────────────────────────────────────────────
export const health = () =>
  fetch(`${BASE_URL.replace('/api', '')}/health`).then(r => r.json());

export default {
  auth:      authAPI,
  crimes:    crimesAPI,
  alerts:    alertsAPI,
  forecast:  forecastAPI,
  risk:      riskAPI,
  ai:        aiAPI,
  intelligence: intelligenceAPI,
  monitoring: monitoringAPI,
  ml: mlAPI,
  ingestion: ingestionAPI,
  reports:   reportsAPI,
  admin:     adminAPI,
  health,
};
