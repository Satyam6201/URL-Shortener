const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    getMe: () => request('/auth/me'),
    logout: () => {
      localStorage.removeItem('token');
      return request('/auth/logout', { method: 'POST' }).catch(() => {});
    },
  },

  urls: {
    create: (urlData) => request('/urls', { method: 'POST', body: JSON.stringify(urlData) }),
    bulkCreate: (urls) => request('/urls/bulk', { method: 'POST', body: JSON.stringify({ urls }) }),
    verifyPassword: (shortCode, password) => request('/urls/verify-password', { method: 'POST', body: JSON.stringify({ shortCode, password }) }),
    getPreview: (shortCode) => request(`/urls/preview/${shortCode}`),
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/urls${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/urls/${id}`),
    update: (id, updateData) => request(`/urls/${id}`, { method: 'PATCH', body: JSON.stringify(updateData) }),
    delete: (id) => request(`/urls/${id}`, { method: 'DELETE' }),
    getQuota: () => request('/urls/quota'),
  },

  analytics: {
    getUrlAnalytics: (shortCode, timeframe = '30d') => request(`/analytics/${shortCode}?timeframe=${timeframe}`),
    getOverview: () => request('/analytics/overview'),
    askAi: (query, shortCode = null) => request('/analytics/ask-ai', { method: 'POST', body: JSON.stringify({ query, shortCode }) }),
    getExportUrl: (shortCode) => `${API_BASE}/analytics/${shortCode}/export/csv`,
  },

  ai: {
    suggestSlugs: (url) => request('/ai/suggest-slugs', { method: 'POST', body: JSON.stringify({ url }) }),
    checkSafety: (url) => request('/ai/analyze-safety', { method: 'POST', body: JSON.stringify({ url }) }),
    categorize: (url) => request('/ai/categorize', { method: 'POST', body: JSON.stringify({ url }) }),
  },

  keys: {
    list: () => request('/keys'),
    create: (name) => request('/keys', { method: 'POST', body: JSON.stringify({ name }) }),
    revoke: (key) => request(`/keys/${key}`, { method: 'DELETE' }),
  },

  webhooks: {
    list: () => request('/webhooks'),
    create: (data) => request('/webhooks', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id) => request(`/webhooks/${id}`, { method: 'DELETE' }),
    test: (id) => request(`/webhooks/${id}/test`, { method: 'POST' }),
  },

  domains: {
    list: () => request('/domains'),
    add: (domain) => request('/domains', { method: 'POST', body: JSON.stringify({ domain }) }),
    verify: (id) => request(`/domains/${id}/verify`, { method: 'POST' }),
    delete: (id) => request(`/domains/${id}`, { method: 'DELETE' }),
  },

  teams: {
    getMyTeam: () => request('/teams'),
    invite: (email, role) => request('/teams/invite', { method: 'POST', body: JSON.stringify({ email, role }) }),
    removeMember: (memberUserId) => request(`/teams/members/${memberUserId}`, { method: 'DELETE' }),
  },

  admin: {
    getStats: () => request('/admin/stats'),
    listUsers: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/admin/users${q ? `?${q}` : ''}`);
    },
    toggleUser: (id) => request(`/admin/users/${id}/toggle`, { method: 'PATCH' }),
    listAbuse: () => request('/admin/abuse'),
    actionAbuse: (id, action) => request(`/admin/abuse/${id}/action`, { method: 'POST', body: JSON.stringify({ action }) }),
    reportAbuse: (data) => request('/admin/abuse', { method: 'POST', body: JSON.stringify(data) }),
  },
};