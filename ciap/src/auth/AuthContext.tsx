import React, { useEffect, useMemo, useState } from 'react';
import { authAPI } from '../api/client';
import { AuthContext, type AuthContextValue, type User } from './authContextCore';
const DEMO_BYPASS_ENABLED = import.meta.env.VITE_DEMO_BYPASS === 'true' || import.meta.env.DEV;
const DEMO_USER = {
  userId: 1,
  employeeId: 'KSP-SA-0001',
  name: 'Supt. Ramaiah K.',
  email: 'ramaiah@ksp.gov.in',
  role: 'super_admin',
  districtId: null,
  stationId: null,
  lang: 'en',
  status: 'active',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(authAPI.getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (DEMO_BYPASS_ENABLED) {
        localStorage.setItem('ciap_user', JSON.stringify(DEMO_USER));
        localStorage.setItem('ciap_token', 'ciap-demo-token');
        setUser(DEMO_USER);
        setLoading(false);
        return;
      }
      if (!authAPI.isAuthenticated()) {
        setLoading(false);
        return;
      }
      try {
        const me = await authAPI.getMe();
        const normalized = (me as { data?: unknown; user?: unknown })?.data ?? me;
        setUser(normalized as User);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: !!user,
    loading,
    login: async (email: string, password: string) => {
      if (DEMO_BYPASS_ENABLED) {
        localStorage.setItem('ciap_user', JSON.stringify(DEMO_USER));
        localStorage.setItem('ciap_token', 'ciap-demo-token');
        setUser(DEMO_USER);
        return;
      }
      const result = await authAPI.login(email, password);
      setUser(result.user as User);
    },
    logout: async () => {
      if (DEMO_BYPASS_ENABLED) {
        localStorage.removeItem('ciap_token');
        localStorage.removeItem('ciap_user');
        setUser(null);
        return;
      }
      await authAPI.logout();
      setUser(null);
    },
    refreshUser: async () => {
      if (DEMO_BYPASS_ENABLED) {
        setUser(DEMO_USER);
        return;
      }
      const me = await authAPI.getMe();
      const normalized = (me as { data?: unknown; user?: unknown })?.data ?? me;
      setUser(normalized as User);
    },
    updateLanguage: async (language: 'en' | 'kn') => {
      if (DEMO_BYPASS_ENABLED) {
        setUser(prev => (prev ? { ...prev, lang: language } : prev));
        return;
      }
      await authAPI.setLanguage(language);
      if (user) setUser({ ...user, lang: language });
    },
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
