'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';
import { connectAgencySocket } from '../lib/socket';

interface Admin { id: string; name: string; email: string; role: string }
interface Agency { id: string; name: string; status: string; type?: 'AGENCE' | 'PARTICULIER' }

interface AuthContextValue {
  admin: Admin | null;
  agency: Agency | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedAdmin = localStorage.getItem('cm_admin');
    const storedAgency = localStorage.getItem('cm_agency');
    if (storedAdmin) setAdmin(JSON.parse(storedAdmin));
    if (storedAgency) {
      const parsedAgency = JSON.parse(storedAgency);
      setAgency(parsedAgency);
      connectAgencySocket(parsedAgency.id);
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/agencies/login', { email, password });
    localStorage.setItem('cm_admin_token', data.token);
    localStorage.setItem('cm_admin', JSON.stringify(data.admin));
    localStorage.setItem('cm_agency', JSON.stringify(data.agency));
    setAdmin(data.admin);
    setAgency(data.agency);
    connectAgencySocket(data.agency.id);
  }

  function logout() {
    localStorage.removeItem('cm_admin_token');
    localStorage.removeItem('cm_admin');
    localStorage.removeItem('cm_agency');
    setAdmin(null);
    setAgency(null);
  }

  return (
    <AuthContext.Provider value={{ admin, agency, loading, login, logout }}>
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
