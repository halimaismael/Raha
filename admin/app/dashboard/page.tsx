'use client';
import { useEffect, useState } from 'react';
import DashboardShell from '../../components/DashboardShell';
import Badge, { BadgeTone } from '../../components/Badge';
import { api } from '../../lib/api';
import { getAgencySocket } from '../../lib/socket';
import { useAuth } from '../../context/AuthContext';
import { IconVan, IconUser, IconRoute, IconTicket } from '../../components/Icons';

interface AgencyStats {
  name: string;
  status: string;
  _count: { vehicles: number; drivers: number; trips: number; bookings: number };
}

const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente', CONFIRMED: 'Confirmée', ONGOING: 'En cours', COMPLETED: 'Terminée', CANCELLED: 'Annulée',
};
const BOOKING_STATUS_TONE: Record<string, BadgeTone> = {
  PENDING: 'warning', CONFIRMED: 'info', ONGOING: 'info', COMPLETED: 'success', CANCELLED: 'danger',
};

export default function DashboardPage() {
  const { admin } = useAuth();
  const [stats, setStats] = useState<AgencyStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  useEffect(() => {
    if (!admin) return;
    api.get('/agencies/me').then(({ data }) => setStats(data)).catch(() => {});
    api.get('/bookings/agency/mine').then(({ data }) => setRecentBookings(data.slice(0, 6))).catch(() => {});
  }, [admin]);

  useEffect(() => {
    const socket = getAgencySocket();
    if (!socket) return;
    const refresh = () => {
      api.get('/agencies/me').then(({ data }) => setStats(data)).catch(() => {});
      api.get('/bookings/agency/mine').then(({ data }) => setRecentBookings(data.slice(0, 6))).catch(() => {});
    };
    socket.on('booking:new', refresh);
    socket.on('booking:updated', refresh);
    return () => {
      socket.off('booking:new', refresh);
      socket.off('booking:updated', refresh);
    };
  }, []);

  const cards = [
    { label: 'Véhicules actifs', value: stats?._count.vehicles ?? '—', Icon: IconVan, color: 'bg-ocean' },
    { label: 'Chauffeurs', value: stats?._count.drivers ?? '—', Icon: IconUser, color: 'bg-lagoon' },
    { label: 'Trajets programmés', value: stats?._count.trips ?? '—', Icon: IconRoute, color: 'bg-coral' },
    { label: 'Réservations totales', value: stats?._count.bookings ?? '—', Icon: IconTicket, color: 'bg-ylang' },
  ];

  return (
    <DashboardShell title={`Bonjour, ${admin?.name?.split(' ')[0] || ''}`} subtitle="Voici un aperçu de l'activité de votre agence">
      <div className="grid grid-cols-4 gap-5 mb-10">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-line p-6 shadow-card hover:shadow-soft transition-shadow">
            <div className={`w-11 h-11 rounded-xl ${c.color} flex items-center justify-center mb-4`}>
              <c.Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-3xl font-bold text-charcoal font-display">{c.value}</div>
            <div className="text-sm text-slate mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-line p-6 shadow-card">
        <h3 className="font-bold text-charcoal mb-4 font-display">Réservations récentes</h3>
        {recentBookings.length === 0 ? (
          <p className="text-slate text-sm">Aucune réservation pour le moment.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate border-b border-line">
                <th className="pb-3 font-medium">Référence</th>
                <th className="pb-3 font-medium">Client</th>
                <th className="pb-3 font-medium">Véhicule</th>
                <th className="pb-3 font-medium">Montant</th>
                <th className="pb-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b) => (
                <tr key={b.id} className="border-b border-line last:border-0 hover:bg-sand/50 transition-colors">
                  <td className="py-3 font-semibold">{b.reference}</td>
                  <td className="py-3">{b.user?.firstName} {b.user?.lastName}</td>
                  <td className="py-3">{b.vehicle?.brand} {b.vehicle?.model}</td>
                  <td className="py-3">{b.totalPrice.toLocaleString('fr-FR')} KMF</td>
                  <td className="py-3">
                    <Badge label={BOOKING_STATUS_LABELS[b.status] ?? b.status} tone={BOOKING_STATUS_TONE[b.status] ?? 'neutral'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardShell>
  );
}
