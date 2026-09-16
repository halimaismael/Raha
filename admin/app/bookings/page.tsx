'use client';
import { useEffect, useState } from 'react';
import DashboardShell from '../../components/DashboardShell';
import { api } from '../../lib/api';
import { getAgencySocket } from '../../lib/socket';

interface Booking {
  id: string; reference: string; bookingType: string; scheduledDate: string;
  totalPrice: number; status: string; paymentStatus: string; paymentMethod: string;
  purpose?: string;
  user: { firstName: string; lastName: string; phone: string | null };
  vehicle: { brand: string; model: string; type: string };
  driver?: { id: string; name: string; phone: string | null } | null;
}
interface DriverOption { id: string; name: string; phone: string; active: boolean }

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  ACCEPTED: 'Acceptée',
  CONFIRMED: 'Confirmée',
  DRIVER_ASSIGNED: 'Chauffeur attribué',
  DRIVER_ARRIVING: 'Chauffeur en route',
  DRIVER_ARRIVED: 'Chauffeur arrivé',
  TRIP_STARTED: 'Trajet en cours',
  COMPLETED: 'Terminée',
  REJECTED: 'Refusée',
  CANCELLED: 'Annulée',
  EXPIRED: 'Expirée',
};
const TYPE_LABELS: Record<string, string> = {
  SHARED_SEAT: 'Place partagée',
  PRIVATE_FULL_DAY: 'Location journée',
  CARGO_MOVING: 'Déménagement/Cargo',
  POINT_TO_POINT: 'Trajet point à point',
};
const CANCELLABLE = ['CONFIRMED', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'DRIVER_ARRIVED'];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [{ data: b }, { data: d }] = await Promise.all([
      api.get('/bookings/agency/mine'),
      api.get('/drivers/mine'),
    ]);
    setBookings(b);
    setDrivers(d);
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

  async function accept(id: string) {
    try {
      await api.patch(`/bookings/${id}/accept`);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Action impossible');
    }
  }

  async function reject(id: string) {
    if (!confirm("Refuser cette réservation ? L'usager sera informé.")) return;
    try {
      await api.patch(`/bookings/${id}/reject`);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Action impossible');
    }
  }

  async function assignDriver(id: string, driverId: string) {
    if (!driverId) return;
    try {
      await api.patch(`/bookings/${id}/assign-driver`, { driverId });
      setAssigningId(null);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Impossible d'attribuer ce chauffeur");
    }
  }

  async function cancel(id: string) {
    if (!confirm('Annuler cette réservation ?')) return;
    try {
      await api.patch(`/bookings/${id}/status`, { status: 'CANCELLED' });
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Action impossible');
    }
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
        {['ALL', 'PENDING', 'CONFIRMED', 'DRIVER_ASSIGNED', 'TRIP_STARTED', 'COMPLETED', 'CANCELLED', 'REJECTED'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-full text-xs font-semibold border ${
              filter === s ? 'bg-ocean text-white border-ocean' : 'bg-white text-slate border-line'
            }`}
          >
            {s === 'ALL' ? 'Toutes' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-line overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate bg-sandDeep/50">
              <th className="px-6 py-4 font-medium">Référence</th>
              <th className="px-6 py-4 font-medium">Client</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Véhicule</th>
              <th className="px-6 py-4 font-medium">Chauffeur</th>
              <th className="px-6 py-4 font-medium">Montant</th>
              <th className="px-6 py-4 font-medium">Paiement</th>
              <th className="px-6 py-4 font-medium">Statut</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="px-6 py-6 text-slate" colSpan={9}>Chargement...</td></tr>}
            {!loading && filtered.length === 0 && (
              <tr><td className="px-6 py-6 text-slate" colSpan={9}>Aucune réservation ici.</td></tr>
            )}
            {filtered.map((b) => (
              <tr key={b.id} className="border-t border-line align-top">
                <td className="px-6 py-4 font-semibold">{b.reference}</td>
                <td className="px-6 py-4">
                  <div>{b.user.firstName} {b.user.lastName}</div>
                  <div className="text-xs text-slate">{b.user.phone || '—'}</div>
                </td>
                <td className="px-6 py-4">
                  <div>{TYPE_LABELS[b.bookingType]}</div>
                  {b.purpose && <div className="text-xs text-slate">{b.purpose}</div>}
                </td>
                <td className="px-6 py-4">{b.vehicle.brand} {b.vehicle.model}</td>
                <td className="px-6 py-4">
                  {assigningId === b.id ? (
                    <select
                      autoFocus
                      defaultValue=""
                      onChange={(e) => assignDriver(b.id, e.target.value)}
                      onBlur={() => setAssigningId(null)}
                      className="px-2 py-1.5 rounded-lg border border-line text-xs"
                    >
                      <option value="" disabled>Choisir...</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id} disabled={!d.active}>
                          {d.name}{!d.active ? ' (non activé)' : ''}
                        </option>
                      ))}
                    </select>
                  ) : b.driver ? (
                    <div>
                      <div>{b.driver.name}</div>
                      {['CONFIRMED', 'DRIVER_ASSIGNED'].includes(b.status) && (
                        <button onClick={() => setAssigningId(b.id)} className="text-xs text-ocean hover:underline">Réattribuer</button>
                      )}
                    </div>
                  ) : ['CONFIRMED', 'DRIVER_ASSIGNED'].includes(b.status) ? (
                    <button onClick={() => setAssigningId(b.id)} className="text-xs font-semibold text-coral hover:underline">
                      Attribuer un chauffeur
                    </button>
                  ) : (
                    <span className="text-xs text-slate">—</span>
                  )}
                </td>
                <td className="px-6 py-4">{b.totalPrice.toLocaleString('fr-FR')} KMF</td>
                <td className="px-6 py-4">
                  <div>{b.paymentMethod === 'MOBILE_MONEY' ? 'Mobile Money' : 'À bord'}</div>
                  <span className={`text-xs font-semibold ${b.paymentStatus === 'PAID' ? 'text-lagoon' : 'text-ylang'}`}>
                    {b.paymentStatus === 'PAID' ? 'Payé' : 'En attente'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sandDeep">{STATUS_LABELS[b.status]}</span>
                </td>
                <td className="px-6 py-4 space-y-1">
                  {b.status === 'PENDING' && (
                    <>
                      <button onClick={() => accept(b.id)} className="block text-xs font-semibold text-lagoon hover:underline">Accepter</button>
                      <button onClick={() => reject(b.id)} className="block text-xs font-semibold text-red-500 hover:underline">Refuser</button>
                    </>
                  )}
                  {b.paymentMethod === 'CASH_ON_BOARD' && b.paymentStatus !== 'PAID' && (
                    <button onClick={() => confirmCash(b.id)} className="block text-xs font-semibold text-ocean hover:underline">Paiement reçu</button>
                  )}
                  {CANCELLABLE.includes(b.status) && (
                    <button onClick={() => cancel(b.id)} className="block text-xs font-semibold text-red-500 hover:underline">Annuler</button>
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
