import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quota, setQuota] = useState({
    dailyLimit: 5,
    usedToday: 0,
    remainingToday: 5,
    isAuthenticated: false,
  });

  const refreshQuota = useCallback(async () => {
    try {
      const res = await api.urls.getQuota();
      if (res.success) {
        setQuota(res.data);
      }
    } catch {
    }
  }, []);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      refreshQuota();
      return;
    }

    try {
      const res = await api.auth.getMe();
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
      refreshQuota();
    }
  }, [refreshQuota]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    const res = await api.auth.login({ email, password });
    if (res.success && res.token) {
      localStorage.setItem('token', res.token);
      setUser(res.user);
      await refreshQuota();
    }
    return res;
  };

  const register = async (name, email, password) => {
    const res = await api.auth.register({ name, email, password });
    if (res.success && res.token) {
      localStorage.setItem('token', res.token);
      setUser(res.user);
      await refreshQuota();
    }
    return res;
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
    await refreshQuota();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        quota,
        login,
        register,
        logout,
        refreshQuota,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}