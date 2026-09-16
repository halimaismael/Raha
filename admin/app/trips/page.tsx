'use client';
import { useEffect, useState } from 'react';
import DashboardShell from '../../components/DashboardShell';
import Modal from '../../components/Modal';
import Badge, { BadgeTone } from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { api } from '../../lib/api';
import { IconPlus } from '../../components/Icons';

interface Trip {
  id: string; originName: string; destinationName: string; departureTime: string;
  pricePerSeat: number; totalSeats: number; bookedSeats: number; status: string;
  vehicle: { brand: string; model: string; type: string };
}
interface VehicleOption { id: string; brand: string; model: string; type: string }

const emptyForm = {
  vehicleId: '', originName: '', originLat: '-11.7042', originLng: '43.2402',
  destinationName: '', destinationLat: '-11.3833', destinationLng: '43.2833',
  departureTime: '', pricePerSeat: '1500',
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Programmé', BOARDING: 'Embarquement', ONGOING: 'En route', COMPLETED: 'Terminé', CANCELLED: 'Annulé',
};
const STATUS_TONE: Record<string, BadgeTone> = {
  SCHEDULED: 'info', BOARDING: 'warning', ONGOING: 'warning', COMPLETED: 'success', CANCELLED: 'danger',
};

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [{ data: t }, { data: v }] = await Promise.all([
      api.get('/trips/mine'),
      api.get('/vehicles/mine'),
    ]);
    setTrips(t);
    setVehicles(v);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/trips', form);
      setOpen(false);
      setForm(emptyForm);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    await api.patch(`/trips/${id}/status`, { status });
    load();
  }

  return (
    <DashboardShell
      title="Trajets programmés"
      subtitle="Planifiez les départs de bus et taxis partagés"
      action={
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 bg-coral text-white font-semibold px-5 py-2.5 rounded-full text-sm hover:brightness-105 transition">
          <IconPlus className="w-4 h-4" />
          Programmer un trajet
        </button>
      }
    >
      <div className="bg-white rounded-2xl border border-line overflow-hidden shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate bg-sandDeep/50">
              <th className="px-6 py-4 font-medium">Trajet</th>
              <th className="px-6 py-4 font-medium">Véhicule</th>
              <th className="px-6 py-4 font-medium">Départ</th>
              <th className="px-6 py-4 font-medium">Places</th>
              <th className="px-6 py-4 font-medium">Prix/place</th>
              <th className="px-6 py-4 font-medium">Statut</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="px-6 py-6 text-slate" colSpan={7}>Chargement...</td></tr>}
            {!loading && trips.length === 0 && (
              <tr><td colSpan={7}><EmptyState message="Aucun trajet programmé." /></td></tr>
            )}
            {trips.map((t) => (
              <tr key={t.id} className="border-t border-line hover:bg-sand/50 transition-colors">
                <td className="px-6 py-4 font-semibold">{t.originName} → {t.destinationName}</td>
                <td className="px-6 py-4">{t.vehicle.brand} {t.vehicle.model}</td>
                <td className="px-6 py-4">{new Date(t.departureTime).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                <td className="px-6 py-4">{t.bookedSeats}/{t.totalSeats}</td>
                <td className="px-6 py-4">{t.pricePerSeat.toLocaleString('fr-FR')} KMF</td>
                <td className="px-6 py-4">
                  <Badge label={STATUS_LABELS[t.status] ?? t.status} tone={STATUS_TONE[t.status] ?? 'neutral'} />
                </td>
                <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                  {t.status === 'SCHEDULED' && (
                    <button onClick={() => updateStatus(t.id, 'ONGOING')} className="text-xs font-semibold text-lagoon hover:underline">Démarrer</button>
                  )}
                  {t.status === 'ONGOING' && (
                    <button onClick={() => updateStatus(t.id, 'COMPLETED')} className="text-xs font-semibold text-ocean hover:underline">Terminer</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Programmer un trajet">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate uppercase">Véhicule</label>
            <select required value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-shadow">
              <option value="">Sélectionner un véhicule</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.type})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate uppercase">Départ</label>
              <input required value={form.originName} onChange={(e) => setForm({ ...form, originName: e.target.value })} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-shadow" placeholder="Moroni" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate uppercase">Destination</label>
              <input required value={form.destinationName} onChange={(e) => setForm({ ...form, destinationName: e.target.value })} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-shadow" placeholder="Mitsamiouli" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate uppercase">Date et heure de départ</label>
            <input required type="datetime-local" value={form.departureTime} onChange={(e) => setForm({ ...form, departureTime: e.target.value })} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-shadow" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate uppercase">Prix par place (KMF)</label>
            <input required type="number" value={form.pricePerSeat} onChange={(e) => setForm({ ...form, pricePerSeat: e.target.value })} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-shadow" />
          </div>
          <p className="text-xs text-slate">
            Coordonnées GPS pré-remplies pour Moroni / Mitsamiouli à titre d'exemple — ajustez-les selon votre trajet réel (utilisables via Google Maps).
          </p>
          <button type="submit" disabled={saving} className="w-full bg-ocean text-white font-semibold py-3 rounded-full mt-2 hover:bg-oceanDark transition-colors disabled:opacity-60">
            {saving ? 'Enregistrement...' : 'Programmer le trajet'}
          </button>
        </form>
      </Modal>
    </DashboardShell>
  );
}
