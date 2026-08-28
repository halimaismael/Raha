import { io, Socket } from 'socket.io-client';
import { API_URL } from './api';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_URL.replace('/api', ''), { transports: ['websocket'] });
  }
  return socket;
}

export function joinTripRoom(tripId: string) {
  getSocket().emit('join:trip', { tripId });
}

export function leaveTripRoom(tripId: string) {
  getSocket().emit('leave:trip', { tripId });
}
