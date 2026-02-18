import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiUrl } from "./query-client";

interface User {
  id: string;
  email: string;
  name: string;
  provider: string;
  xp: number;
  coins: number;
  wins: number;
  losses: number;
  gamesPlayed: number;
  streak: number;
  lifelines: { [key: string]: number };
  equippedFrame: string;
  equippedTheme: string;
  ownedFrames: string[];
  ownedThemes: string[];
  ownedBadges: string[];
  recentMatches: any[];
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  nameChangedAt: string | null;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  syncToServer: (updates: Partial<User>) => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_KEY = "@quiz_arena_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const apiUrl = getApiUrl();

  const checkAuth = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(AUTH_KEY);
      if (cached) {
        setUser(JSON.parse(cached));
      }
      const res = await fetch(new URL("/api/auth/me", apiUrl).toString(), {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(data.user));
      } else {
        if (!cached) {
          setUser(null);
          await AsyncStorage.removeItem(AUTH_KEY);
        }
      }
    } catch {
      const cached = await AsyncStorage.getItem(AUTH_KEY);
      if (cached) setUser(JSON.parse(cached));
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch(new URL("/api/auth/login", apiUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(data.user));
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch {
      return { success: false, message: "خطأ في الاتصال بالخادم" };
    }
  }, [apiUrl]);

  const register = useCallback(async (email: string, password: string, name: string) => {
    try {
      const res = await fetch(new URL("/api/auth/register", apiUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(data.user));
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch {
      return { success: false, message: "خطأ في الاتصال بالخادم" };
    }
  }, [apiUrl]);

  const logout = useCallback(async () => {
    try {
      await fetch(new URL("/api/auth/logout", apiUrl).toString(), {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    setUser(null);
    await AsyncStorage.removeItem(AUTH_KEY);
  }, [apiUrl]);

  const syncToServer = useCallback(async (updates: Partial<User>) => {
    try {
      const res = await fetch(new URL("/api/user/profile", apiUrl).toString(), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(data.user));
      }
    } catch {}
  }, [apiUrl]);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      AsyncStorage.setItem(AUTH_KEY, JSON.stringify(next));
      return next;
    });
    syncToServer(updates);
  }, [syncToServer]);

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
    syncToServer,
    checkAuth,
  }), [user, isLoading, login, register, logout, updateUser, syncToServer, checkAuth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
