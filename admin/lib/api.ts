import axios from 'axios';

// ⚠️ Remplacez par l'URL de votre backend déployé
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('cm_admin_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
