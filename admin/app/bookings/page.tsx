'use client';
import { useEffect, useState } from 'react';
import DashboardShell from '../../components/DashboardShell';
import Badge, { BadgeTone } from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { api } from '../../lib/api';
import { getAgencySocket } from '../../lib/socket';

interface Booking {
  id: string; reference: string; bookingType: string; scheduledDate: string;
  totalPrice: number; status: string; paymentStatus: string; paymentMethod: string;
  purpose?: string;
  user: { firstName: string; lastName: string; phone: string };
  vehicle: { brand: string; model: string; type: string };
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente', CONFIRMED: 'Confirmée', ONGOING: 'En cours', COMPLETED: 'Terminée', CANCELLED: 'Annulée',
};
const STATUS_TONE: Record<string, BadgeTone> = {
  PENDING: 'warning', CONFIRMED: 'info', ONGOING: 'info', COMPLETED: 'success', CANCELLED: 'danger',
};
const TYPE_LABELS: Record<string, string> = {
  SHARED_SEAT: 'Place partagée', PRIVATE_FULL_DAY: 'Location journée', CARGO_MOVING: 'Déménagement/Cargo',
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await api.get('/bookings/agency/mine');
    setBookings(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // Mise à jour en temps réel : dès qu'un usager réserve ou qu'un paiement/statut change,
  // la liste se rafraîchit automatiquement, sans avoir à recharger la page.
  useEffect(() => {
    const socket = getAgencySocket();
    if (!socket) return;
    const onChange = () => load();
    socket.on('booking:new', onChange);
    socket.on('booking:updated', onChange);
    return () => {
      socket.off('booking:new', onChange);
      socket.off('booking:updated', onChange);
    };
  }, []);

  async function updateStatus(id: string, status: string) {
    await api.patch(`/bookings/${id}/status`, { status });
    load();
  }

  async function confirmCash(id: string) {
    await api.patch(`/payments/${id}/cash-confirm`);
    load();
  }

  const filtered = filter === 'ALL' ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <DashboardShell title="Réservations" subtitle="Suivez et gérez les réservations de vos usagers — mise à jour en temps réel">
      <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-lagoon">
        <span className="w-2 h-2 rounded-full bg-lagoon animate-pulse" /> En direct
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {['ALL', 'PENDING', 'CONFIRMED', 'ONGOING', 'COMPLETED', 'CANCELLED'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
              filter === s ? 'bg-ocean text-white border-ocean' : 'bg-white text-slate border-line hover:border-slate/40'
            }`}
          >
            {s === 'ALL' ? 'Toutes' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-line overflow-hidden shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate bg-sandDeep/50">
              <th className="px-6 py-4 font-medium">Référence</th>
              <th className="px-6 py-4 font-medium">Client</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Véhicule</th>
              <th className="px-6 py-4 font-medium">Montant</th>
              <th className="px-6 py-4 font-medium">Paiement</th>
              <th className="px-6 py-4 font-medium">Statut</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="px-6 py-6 text-slate" colSpan={8}>Chargement...</td></tr>}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={8}><EmptyState message="Aucune réservation ici." /></td></tr>
            )}
            {filtered.map((b) => (
              <tr key={b.id} className="border-t border-line align-top hover:bg-sand/50 transition-colors">
                <td className="px-6 py-4 font-semibold">{b.reference}</td>
                <td className="px-6 py-4">
                  <div>{b.user.firstName} {b.user.lastName}</div>
                  <div className="text-xs text-slate">{b.user.phone}</div>
                </td>
                <td className="px-6 py-4">
                  <div>{TYPE_LABELS[b.bookingType]}</div>
                  {b.purpose && <div className="text-xs text-slate">{b.purpose}</div>}
                </td>
                <td className="px-6 py-4">{b.vehicle.brand} {b.vehicle.model}</td>
                <td className="px-6 py-4">{b.totalPrice.toLocaleString('fr-FR')} KMF</td>
                <td className="px-6 py-4">
                  <div>{b.paymentMethod === 'MOBILE_MONEY' ? 'Mobile Money' : 'À bord'}</div>
                  <span className={`text-xs font-semibold ${b.paymentStatus === 'PAID' ? 'text-lagoon' : 'text-ylang'}`}>
                    {b.paymentStatus === 'PAID' ? 'Payé' : 'En attente'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <Badge label={STATUS_LABELS[b.status] ?? b.status} tone={STATUS_TONE[b.status] ?? 'neutral'} />
                </td>
                <td className="px-6 py-4 space-y-1 whitespace-nowrap">
                  {b.status === 'PENDING' && (
                    <button onClick={() => updateStatus(b.id, 'CONFIRMED')} className="block text-xs font-semibold text-lagoon hover:underline">Confirmer</button>
                  )}
                  {b.paymentMethod === 'CASH_ON_BOARD' && b.paymentStatus !== 'PAID' && (
                    <button onClick={() => confirmCash(b.id)} className="block text-xs font-semibold text-ocean hover:underline">Paiement reçu</button>
                  )}
                  {['PENDING', 'CONFIRMED'].includes(b.status) && (
                    <button onClick={() => updateStatus(b.id, 'CANCELLED')} className="block text-xs font-semibold text-red-500 hover:underline">Annuler</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
