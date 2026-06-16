import type { AuthUser, HistoryEntry } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

function getHeaders(token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.detail || response.statusText || 'Request failed';
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function login(username: string, password: string) {
  return request<{ access_token: string; token_type: string }>('/auth/login', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ username, password }),
  });
}

export async function logout(token: string) {
  return request<{ status: string }>('/auth/logout', {
    method: 'POST',
    headers: getHeaders(token),
  });
}

export async function me(token: string) {
  return request<AuthUser>('/auth/me', {
    method: 'GET',
    headers: getHeaders(token),
  });
}

export async function fetchHistory(token: string) {
  return request<HistoryEntry[]>('/history', {
    method: 'GET',
    headers: getHeaders(token),
  });
}

export async function postHistory(token: string, title: string, details: string) {
  return request<HistoryEntry>('/history', {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ title, details }),
  });
}
