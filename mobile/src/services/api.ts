import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ Remplacez par l'URL de votre backend déployé (ex: https://api.raha.km)
export const API_URL = 'https://comoro-move-backend-production.up.railway.app/api';

export const api = axios.create({ baseURL: API_URL, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@comoro_move_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function saveToken(token: string) {
  await AsyncStorage.setItem('@comoro_move_token', token);
}

export async function clearToken() {
  await AsyncStorage.removeItem('@comoro_move_token');
}
