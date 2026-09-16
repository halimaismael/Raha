import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, saveToken, clearToken } from '../services/api';
import { User, AppRole, AgencyDriverProfile, IndependentDriverProfile } from '../types';

const STORAGE_KEY = '@raha_session';

interface AuthContextValue {
  // Rétrocompatibilité usager (inchangé, utilisé par tout le parcours usager existant)
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: { firstName: string; lastName: string; phone: string; email?: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;

  // Multi-rôle (professionnels)
  role: AppRole;
  driverProfile: AgencyDriverProfile | null;
  independentProfile: IndependentDriverProfile | null;
  // identifier : numéro de téléphone OU identifiant professionnel Raha (RAHA-CH-xxxxxx)
  loginDriver: (identifier: string, password: string) => Promise<void>;
  loginIndependentDriver: (identifier: string, password: string) => Promise<void>;
  registerIndependentDriver: (data: {
    firstName: string; lastName: string; phone: string; email?: string; password: string;
    zones?: string[]; services?: string[]; licenseNumber?: string;
  }) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

interface StoredSession {
  role: AppRole;
  user: User | null;
  driverProfile: AgencyDriverProfile | null;
  independentProfile: IndependentDriverProfile | null;
}

const EMPTY_SESSION: StoredSession = { role: 'USER', user: null, driverProfile: null, independentProfile: null };

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StoredSession>(EMPTY_SESSION);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSession(JSON.parse(stored));
      } else {
        // Compat : anciennes installations ayant seulement @comoro_move_user
        const legacy = await AsyncStorage.getItem('@comoro_move_user');
        if (legacy) setSession({ ...EMPTY_SESSION, role: 'USER', user: JSON.parse(legacy) });
      }
      setLoading(false);
    })();
  }, []);

  async function persist(next: StoredSession) {
    setSession(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  async function login(phone: string, password: string) {
    const { data } = await api.post('/auth/users/login', { phone, password });
    await saveToken(data.token);
    await persist({ role: 'USER', user: data.user, driverProfile: null, independentProfile: null });
  }

  async function register(payload: { firstName: string; lastName: string; phone: string; email?: string; password: string }) {
    const { data } = await api.post('/auth/users/register', payload);
    await saveToken(data.token);
    await persist({ role: 'USER', user: data.user, driverProfile: null, independentProfile: null });
  }

  async function loginDriver(identifier: string, password: string) {
    const { data } = await api.post('/auth/drivers/login', { identifier, password });
    await saveToken(data.token);
    await persist({ role: 'AGENCY_DRIVER', user: null, driverProfile: { ...data.driver, agency: data.agency }, independentProfile: null });
  }

  async function loginIndependentDriver(identifier: string, password: string) {
    const { data } = await api.post('/auth/independent-drivers/login', { identifier, password });
    await saveToken(data.token);
    await persist({ role: 'INDEPENDENT_DRIVER', user: null, driverProfile: null, independentProfile: data.driver });
  }

  // Ne connecte PAS automatiquement : le compte est créé en attente ("PENDING")
  // et n'a pas encore d'identifiant professionnel. L'écran appelant doit
  // renvoyer la personne vers l'onglet "Se connecter" (avec son numéro pour
  // l'instant, puis avec son identifiant Raha une fois celui-ci attribué).
  async function registerIndependentDriver(payload: {
    firstName: string; lastName: string; phone: string; email?: string; password: string;
    zones?: string[]; services?: string[]; licenseNumber?: string;
  }) {
    await api.post('/auth/independent-drivers/register', payload);
  }

  async function refreshProfile() {
    try {
      if (session.role === 'AGENCY_DRIVER') {
        const { data } = await api.get('/drivers/me');
        await persist({ ...session, driverProfile: data });
      } else if (session.role === 'INDEPENDENT_DRIVER') {
        const { data } = await api.get('/independent-drivers/me');
        await persist({ ...session, independentProfile: data });
      }
    } catch {
      // silencieux : on garde la copie locale si le rafraîchissement échoue
    }
  }

  async function logout() {
    await clearToken();
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem('@comoro_move_user');
    setSession(EMPTY_SESSION);
  }

  return (
    <AuthContext.Provider
      value={{
        user: session.user,
        loading,
        login,
        register,
        logout,
        role: session.user ? 'USER' : session.role,
        driverProfile: session.driverProfile,
        independentProfile: session.independentProfile,
        loginDriver,
        loginIndependentDriver,
        registerIndependentDriver,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return ctx;
}
