const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
const QUEUE_KEY = 'complet_cont_offline_queue';
const TOKEN_KEY = 'cc_token';
const USER_KEY  = 'cc_user';

// ── Token / user storage ──────────────────────────────────────────────────────

export function storeUser(userData) {
  localStorage.setItem(TOKEN_KEY, userData.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify({
    id:          userData.id,
    email:       userData.email,
    name:        userData.name,
    role:        userData.role,
    permissions: userData.permissions || [],
    companyName: userData.companyName,
  }));
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || null;
}

export function clearUser() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ── Refresh token logic ───────────────────────────────────────────────────────
// If multiple requests get 401 simultaneously, only ONE refresh call goes out.
// The rest wait in _pendingQueue and retry once the refresh resolves.

let _isRefreshing = false;
let _pendingQueue = [];

function _processQueue(error, token = null) {
  _pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  _pendingQueue = [];
}

async function _refreshAccessToken() {
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',  // sends the httpOnly cookie
  });
  if (!res.ok) throw new Error('Refresh failed');
  const data = await res.json();
  localStorage.setItem(TOKEN_KEY, data.access_token);
  return data.access_token;
}

// ── Core fetch ────────────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${BASE}${path}`, { headers, credentials: 'include', ...options });

  if (res.status === 401) {
    // Never try to refresh on auth endpoints themselves
    if (path.startsWith('/auth/')) {
      const err = await res.json().catch(() => ({ detail: 'Unauthorized' }));
      throw Object.assign(new Error(err.detail || 'Unauthorized'), { status: 401 });
    }

    if (_isRefreshing) {
      return new Promise((resolve, reject) => {
        _pendingQueue.push({ resolve, reject });
      }).then(() => apiFetch(path, options));
    }

    _isRefreshing = true;
    try {
      await _refreshAccessToken();
      _processQueue(null);
      _isRefreshing = false;
      return apiFetch(path, options);
    } catch (refreshError) {
      _processQueue(refreshError);
      _isRefreshing = false;
      clearUser();
      window.location.reload();
      return;
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw Object.assign(new Error(err.detail || res.statusText), { status: res.status });
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── Records ───────────────────────────────────────────────────────────────────

export function fetchRecords({ page = 1, pageSize = 5, month, year } = {}) {
  const p = new URLSearchParams({ page, page_size: pageSize });
  if (month != null) p.set('month', month);
  if (year  != null) p.set('year', year);
  return apiFetch(`/records?${p}`);
}

export function fetchAllRecords() {
  return apiFetch('/records?page=1&page_size=100');
}

export function createRecord(data) {
  return apiFetch('/records', { method: 'POST', body: JSON.stringify(data) });
}

export function updateRecord(id, data) {
  return apiFetch(`/records/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteRecord(id) {
  return apiFetch(`/records/${id}`, { method: 'DELETE' });
}

export function fetchStats() {
  return apiFetch('/records/stats');
}

// ── Companies ─────────────────────────────────────────────────────────────────

export function fetchCompanies() {
  return apiFetch('/companies');
}

export function createCompany(data) {
  return apiFetch('/companies', { method: 'POST', body: JSON.stringify(data) });
}

export function updateCompany(id, data) {
  return apiFetch(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteCompany(id) {
  return apiFetch(`/companies/${id}`, { method: 'DELETE' });
}

// ── Observations ──────────────────────────────────────────────────────────────

export function addObservation(companyId, data) {
  return apiFetch(`/companies/${companyId}/observations`, { method: 'POST', body: JSON.stringify(data) });
}

export function toggleObservation(companyId, obsId) {
  return apiFetch(`/companies/${companyId}/observations/${obsId}/toggle`, { method: 'PATCH' });
}

export function deleteObservation(companyId, obsId) {
  return apiFetch(`/companies/${companyId}/observations/${obsId}`, { method: 'DELETE' });
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export function loginUser(email, password) {
  return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function registerUser({ name, email, password, role, staffCode, firmCode }) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role, staffCode, firmCode }),
  });
}

export function fetchCurrentUser() {
  return apiFetch('/auth/me');
}

export async function logoutUser() {
  await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
  clearUser();
}

export function requestPasswordReset(email) {
  return apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
}

export function resetPassword(token, password) {
  return apiFetch(`/auth/reset-password/${token}`, { method: 'POST', body: JSON.stringify({ password }) });
}

export function requestMagicLink(email) {
  return apiFetch('/auth/magic/request', { method: 'POST', body: JSON.stringify({ email }) });
}

export function validateMagicLink(token) {
  return apiFetch(`/auth/magic/${token}`);
}

// ── Logs ──────────────────────────────────────────────────────────────────────

export function fetchLogs(limit = 100) {
  return apiFetch(`/logs?limit=${limit}`);
}

export function fetchSuspicious() {
  return apiFetch('/logs/suspicious');
}

export function resolveFlag(id) {
  return apiFetch(`/logs/suspicious/${id}/resolve`, { method: 'PATCH' });
}

// ── Offline queue ─────────────────────────────────────────────────────────────

export function getQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); }
  catch { return []; }
}

function saveQueue(q) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

export function enqueueOp(op) {
  const q = getQueue();
  q.push({ ...op, _qid: `${Date.now()}_${Math.random()}` });
  saveQueue(q);
}

export async function flushQueue() {
  const q = getQueue();
  if (!q.length) return 0;
  let synced = 0;
  const remaining = [];
  for (const op of q) {
    try {
      await apiFetch(op.path, {
        method: op.method,
        body: op.body ? JSON.stringify(op.body) : undefined,
      });
      synced++;
    } catch (e) {
      if (e.name === 'TypeError') remaining.push(op);
    }
  }
  saveQueue(remaining);
  return synced;
}
