'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';

interface Admin { id: string; name: string; email: string }

interface AuthContextValue {
  admin: Admin | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('raha_ops_admin');
    if (stored) setAdmin(JSON.parse(stored));
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/super-admin/login', { email, password });
    localStorage.setItem('raha_ops_token', data.token);
    localStorage.setItem('raha_ops_admin', JSON.stringify(data.admin));
    setAdmin(data.admin);
  }

  function logout() {
    localStorage.removeItem('raha_ops_token');
    localStorage.removeItem('raha_ops_admin');
    setAdmin(null);
  }

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Hook pour protéger les pages du dashboard
export function useRequireAuth() {
  const { admin, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !admin) router.replace('/login');
  }, [loading, admin]);
  return { admin, loading };
}
