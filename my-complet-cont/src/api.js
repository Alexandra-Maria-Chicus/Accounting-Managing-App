const BASE = 'http://localhost:8000';
const QUEUE_KEY = 'complet_cont_offline_queue';


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

// ── Core fetch ────────────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
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
  if (year != null) p.set('year', year);
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
