import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthUser, HistoryEntry } from '../types';
import * as authApi from '../api/auth';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  history: HistoryEntry[];
  loading: boolean;
  historyLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadHistory: () => Promise<void>;
  addHistoryEntry: (title: string, details: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const STORAGE_KEY = 'epidemic_auth_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async (authToken?: string) => {
    const effectiveToken = authToken ?? token;
    if (!effectiveToken) return;
    setHistoryLoading(true);
    setError(null);
    try {
      const items = await authApi.fetchHistory(effectiveToken);
      setHistory(items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [token]);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authApi.login(username, password);
      localStorage.setItem(STORAGE_KEY, result.access_token);
      setToken(result.access_token);
      const profile = await authApi.me(result.access_token);
      setUser(profile);
      await loadHistory(result.access_token);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadHistory]);

  const logout = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      await authApi.logout(token);
    } catch {
      // ignore logout failures and clear local session
    } finally {
      localStorage.removeItem(STORAGE_KEY);
      setToken(null);
      setUser(null);
      setHistory([]);
      setLoading(false);
    }
  }, [token]);

  const addHistoryEntry = useCallback(async (title: string, details: string) => {
    if (!token) throw new Error('Not signed in');
    setHistoryLoading(true);
    try {
      const item = await authApi.postHistory(token, title, details);
      setHistory((current) => [item, ...current]);
    } finally {
      setHistoryLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setHistory([]);
      return;
    }

    authApi.me(token)
      .then((profile) => setUser(profile))
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setUser(null);
        setHistory([]);
      });
  }, [token]);

  useEffect(() => {
    if (!token || !user) return;
    void loadHistory();
  }, [token, user, loadHistory]);

  return (
    <AuthContext.Provider
      value={{ user, token, history, loading, historyLoading, error, login, logout, loadHistory, addHistoryEntry }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
