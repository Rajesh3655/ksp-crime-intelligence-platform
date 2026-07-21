import { createContext } from 'react';

export type User = Record<string, unknown> | null;

export type AuthContextValue = {
  user: User;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateLanguage: (language: 'en' | 'kn') => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
