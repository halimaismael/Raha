import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, saveToken, clearToken } from '../services/api';
import { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: { firstName: string; lastName: string; phone: string; email?: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('@comoro_move_user');
      if (stored) setUser(JSON.parse(stored));
      setLoading(false);
    })();
  }, []);

  async function persistUser(u: User) {
    setUser(u);
    await AsyncStorage.setItem('@comoro_move_user', JSON.stringify(u));
  }

  async function login(phone: string, password: string) {
    const { data } = await api.post('/auth/users/login', { phone, password });
    await saveToken(data.token);
    await persistUser(data.user);
  }

  async function register(payload: { firstName: string; lastName: string; phone: string; email?: string; password: string }) {
    const { data } = await api.post('/auth/users/register', payload);
    await saveToken(data.token);
    await persistUser(data.user);
  }

  async function logout() {
    await clearToken();
    await AsyncStorage.removeItem('@comoro_move_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return ctx;
}
