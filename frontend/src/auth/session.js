const STORAGE_KEY = 'manitas.user';

// Fired when the server rejects the stored session (user removed, database reset…)
export const SESSION_EXPIRED_EVENT = 'manitas:session-expired';

export function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function saveSession(user) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Storage unavailable (private mode, quota): the session just lasts until the page reloads
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing stored, nothing to clear
  }
}
