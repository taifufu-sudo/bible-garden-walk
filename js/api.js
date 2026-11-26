// Cloud API Client for 聖經大地圖・牧區多人線上版 (Cloudflare Workers + D1)

// Live Cloudflare Workers API endpoint (updated automatically after Worker deployment)
export const API_BASE_URL = window.__BIBLE_API_URL__ || 'https://bible-garden-api.bible-garden-walk.workers.dev';

const TOKEN_KEY = 'bible_zone_token_v2';

export function getAuthToken() {
  try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
}

export function setAuthToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

async function apiFetch(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => ({ ok: false, error: '伺服器回應格式異常' }));
  if (!res.ok || data.ok === false) {
    const err = new Error(data.error || `連線錯誤 (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  getGroups: () => apiFetch('/api/groups', { auth: false }),
  lookupPhone: phone => apiFetch('/api/auth/lookup', { method: 'POST', body: { phone }, auth: false }),
  login: (phone, pin) => apiFetch('/api/auth/login', { method: 'POST', body: { phone, pin }, auth: false }),
  register: payload => apiFetch('/api/auth/register', { method: 'POST', body: payload, auth: false }),
  logout: () => apiFetch('/api/auth/logout', { method: 'POST' }),

  getMe: () => apiFetch('/api/me'),
  syncMe: payload => apiFetch('/api/me/sync', { method: 'PUT', body: payload }),
  updateProfile: payload => apiFetch('/api/me/profile', { method: 'PUT', body: payload }),

  getGroupOverview: groupId => apiFetch(`/api/group/overview${groupId ? `?groupId=${groupId}` : ''}`),
  visitGarden: userId => apiFetch(`/api/group/garden/${userId}`),
  interactGarden: payload => apiFetch('/api/group/interact', { method: 'POST', body: payload }),
  claimWeeklyGoal: () => apiFetch('/api/group/claim-weekly', { method: 'POST' }),

  getGroupReflections: groupId => apiFetch(`/api/group/reflections${groupId ? `?groupId=${groupId}` : ''}`),
  createReflection: payload => apiFetch('/api/reflections', { method: 'POST', body: payload }),
  deleteReflection: id => apiFetch(`/api/reflections/${id}`, { method: 'DELETE' }),
  toggleReaction: (id, reaction) => apiFetch(`/api/reflections/${id}/react`, { method: 'POST', body: { reaction } }),

  claimAdmin: code => apiFetch('/api/admin/claim', { method: 'POST', body: { code } }),
  getAdminDashboard: () => apiFetch('/api/admin/dashboard'),
  adminCreateGroup: name => apiFetch('/api/admin/groups', { method: 'POST', body: { name } }),
  adminRenameGroup: (id, name) => apiFetch(`/api/admin/groups/${id}`, { method: 'PATCH', body: { name } }),
  adminUpdateUser: (id, patch) => apiFetch(`/api/admin/users/${id}`, { method: 'PATCH', body: patch }),

  async downloadAdminCsv() {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE_URL}/api/admin/export.csv`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('無法匯出報表');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `牧區讀經報表_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};
