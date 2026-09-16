import { io, Socket } from 'socket.io-client';
import { API_URL } from './api';

let socket: Socket | null = null;

// Se connecte au serveur temps réel et rejoint la room de l'agence connectée,
// pour recevoir les nouvelles réservations et mises à jour instantanément.
export function connectAgencySocket(agencyId: string): Socket {
  if (!socket) {
    socket = io(API_URL.replace('/api', ''), { transports: ['websocket'] });
  }
  socket.emit('join:agency', { agencyId });
  return socket;
}

export function getAgencySocket(): Socket | null {
  return socket;
}
