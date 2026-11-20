import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, loadToken, saveToken, setUnauthorizedHandler } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => { await saveToken(null); setUser(null); }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    (async () => {
      try {
        if (await loadToken()) setUser(await api('/profile/me'));
      } catch {
        await saveToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [logout]);

  const login = useCallback(async (email, password) => {
    const r = await api('/auth/login', { method: 'POST', body: { email, password } });
    await saveToken(r.token);
    setUser(r.user);
  }, []);

  const register = useCallback(async (data) => {
    const r = await api('/auth/register', { method: 'POST', body: data });
    await saveToken(r.token);
    setUser(r.user);
  }, []);

  const refreshUser = useCallback(async () => setUser(await api('/profile/me')), []);

  const value = useMemo(() => ({ user, setUser, loading, login, register, logout, refreshUser }), [user, loading, login, register, logout, refreshUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
