import { SESSION_EXPIRED_EVENT } from '../auth/session.js';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

let authToken = null;

// Set by AuthProvider on login, logout and page load
export function setAuthToken(token) {
  authToken = token;
}

export async function request(path, { method = 'GET', body } = {}) {
  const sentToken = authToken;
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (sentToken) headers.Authorization = `Bearer ${sentToken}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // The server no longer accepts this session: close it (unless another one started meanwhile)
    if (res.status === 401 && sentToken && sentToken === authToken) {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    throw new Error(data?.error ?? `Error ${res.status}`);
  }
  return data;
}
