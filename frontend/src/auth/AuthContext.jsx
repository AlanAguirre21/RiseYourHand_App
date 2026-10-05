import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './context.js';
import { getMe, login as loginRequest } from '../api/users.js';
import { setAuthToken } from '../api/client.js';
import { SESSION_EXPIRED_EVENT, clearSession, loadSession, saveSession } from './session.js';

const stored = loadSession();
setAuthToken(stored?.id ?? null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(stored);

  // Keeps the state, the stored session and the token sent to the API in step
  const updateUser = useCallback(next => {
    setAuthToken(next?.id ?? null);
    if (next) saveSession(next); else clearSession();
    setUser(next);
  }, []);

  const login = useCallback(async name => {
    const loggedIn = await loginRequest(name);
    updateUser(loggedIn);
    return loggedIn;
  }, [updateUser]);

  const logout = useCallback(() => updateUser(null), [updateUser]);

  // The stored user may be stale (role or name changed elsewhere): refresh it once on load.
  // If it no longer exists the request answers 401 and the event below closes the session
  useEffect(() => {
    if (!stored) return;
    let active = true;
    getMe().then(fresh => { if (active) updateUser(fresh); }).catch(() => {});
    return () => { active = false; };
  }, [updateUser]);

  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, logout);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, logout);
  }, [logout]);

  const value = useMemo(() => ({ user, login, logout, updateUser }), [user, login, logout, updateUser]);

  return <AuthContext value={value}>{children}</AuthContext>;
}
