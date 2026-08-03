"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  authApi,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
} from "@/lib/api";
import type { AuthUser } from "@/lib/types";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hydrate auth state from localStorage after the initial render so the
    // server-rendered HTML and client hydration stay consistent.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydrate
    setUser(getStoredUser());
    setTokenState(getToken());
    setLoading(false);
  }, []);

  // React to an expired/revoked token anywhere in the app (see api.ts 401 handler).
  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      setTokenState(null);
    };
    window.addEventListener("stockreview:unauthorized", onUnauthorized);
    return () =>
      window.removeEventListener("stockreview:unauthorized", onUnauthorized);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setToken(res.token);
    setStoredUser(res.user);
    setUser(res.user);
    setTokenState(res.token);
  }, []);

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const res = await authApi.register(username, email, password);
      setToken(res.token);
      setStoredUser(res.user);
      setUser(res.user);
      setTokenState(res.token);
    },
    []
  );

  const logout = useCallback(() => {
    setToken(null);
    setStoredUser(null);
    setUser(null);
    setTokenState(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!token && !!user,
      loading,
      login,
      register,
      logout,
    }),
    [user, token, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
