'use client';
import { useEffect, useState } from 'react';
import DashboardShell from '../../components/DashboardShell';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { api } from '../../lib/api';
import { IconPlus, IconMapPin, IconVan } from '../../components/Icons';

interface Vehicle {
  id: string; type: string; brand: string; model: string; plateNumber: string;
  seatCapacity: number; basePrice: number; status: string; features: string[]; photoUrl?: string;
}

const TYPE_LABELS: Record<string, string> = { BUS: 'Bus', TAXI: 'Taxi', VOITURE: 'Voiture', CAMION: 'Camion' };

const emptyForm = {
  type: 'BUS', brand: '', model: '', plateNumber: '', seatCapacity: '25',
  basePrice: '1500', pricePerKm: '', features: '', photoUrl: '',
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await api.get('/vehicles/mine');
    setVehicles(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/vehicles', {
        ...form,
        seatCapacity: Number(form.seatCapacity),
        basePrice: Number(form.basePrice),
        pricePerKm: form.pricePerKm ? Number(form.pricePerKm) : undefined,
        features: form.features ? form.features.split(',').map((f) => f.trim()) : [],
      });
      setOpen(false);
      setForm(emptyForm);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(v: Vehicle) {
    const newStatus = v.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE';
    await api.patch(`/vehicles/${v.id}`, { status: newStatus });
    load();
  }

  async function updateLocation(v: Vehicle) {
    if (!navigator.geolocation) {
      alert("Votre navigateur ne permet pas la géolocalisation.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await api.patch(`/vehicles/${v.id}/location`, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        alert(`Position mise à jour pour ${v.brand} ${v.model}.`);
        load();
      },
      () => alert("Impossible de récupérer votre position. Autorisez la géolocalisation."),
    );
  }

  return (
    <DashboardShell
      title="Véhicules"
      subtitle="Gérez votre flotte : bus, taxis, voitures et camions"
      action={
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 bg-coral text-white font-semibold px-5 py-2.5 rounded-full text-sm hover:brightness-105 transition">
          <IconPlus className="w-4 h-4" />
          Ajouter un véhicule
        </button>
      }
    >
      <div className="bg-white rounded-2xl border border-line overflow-hidden shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate bg-sandDeep/50">
              <th className="px-6 py-4 font-medium">Véhicule</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Immatriculation</th>
              <th className="px-6 py-4 font-medium">Places</th>
              <th className="px-6 py-4 font-medium">Prix de base</th>
              <th className="px-6 py-4 font-medium">Statut</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="px-6 py-6 text-slate" colSpan={7}>Chargement...</td></tr>}
            {!loading && vehicles.length === 0 && (
              <tr><td colSpan={7}><EmptyState message="Aucun véhicule enregistré. Ajoutez-en un pour commencer." /></td></tr>
            )}
            {vehicles.map((v) => (
              <tr key={v.id} className="border-t border-line hover:bg-sand/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sandDeep overflow-hidden flex-shrink-0 flex items-center justify-center text-slate">
                      {v.photoUrl ? <img src={v.photoUrl} alt="" className="w-full h-full object-cover" /> : <IconVan className="w-5 h-5" />}
                    </div>
                    <span className="font-semibold">{v.brand} {v.model}</span>
                  </div>
                </td>
                <td className="px-6 py-4">{TYPE_LABELS[v.type]}</td>
                <td className="px-6 py-4">{v.plateNumber}</td>
                <td className="px-6 py-4">{v.seatCapacity}</td>
                <td className="px-6 py-4">{v.basePrice.toLocaleString('fr-FR')} KMF</td>
                <td className="px-6 py-4">
                  <Badge label={v.status === 'ACTIVE' ? 'Actif' : 'Maintenance'} tone={v.status === 'ACTIVE' ? 'success' : 'warning'} />
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <button onClick={() => updateLocation(v)} className="inline-flex items-center gap-1 text-xs font-semibold text-lagoon hover:underline mr-4">
                    <IconMapPin className="w-3.5 h-3.5" />
                    Position
                  </button>
                  <button onClick={() => toggleStatus(v)} className="text-xs font-semibold text-ocean hover:underline">
                    Changer statut
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Ajouter un véhicule">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate uppercase">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full mt-1 px-4 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-shadow"
            >
              <option value="BUS">Bus</option>
              <option value="TAXI">Taxi</option>
              <option value="VOITURE">Voiture</option>
              <option value="CAMION">Camion</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate uppercase">Marque</label>
              <input required value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-shadow" placeholder="Toyota" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate uppercase">Modèle</label>
              <input required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-shadow" placeholder="Coaster" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate uppercase">Immatriculation</label>
            <input required value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-shadow" placeholder="AB-1234-KM" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate uppercase">Nombre de places</label>
              <input required type="number" value={form.seatCapacity} onChange={(e) => setForm({ ...form, seatCapacity: e.target.value })} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-shadow" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate uppercase">Prix de base (KMF)</label>
              <input required type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-shadow" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate uppercase">Équipements (séparés par virgule)</label>
            <input value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-shadow" placeholder="Climatisation, Wifi" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate uppercase">Photo du véhicule (lien d'image)</label>
            <input value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-shadow" placeholder="https://..." />
            <p className="text-xs text-slate mt-1">
              Cette photo sera affichée aux usagers dans l'app, y compris dans leur page "Mes réservations". Hébergez votre photo sur un service comme imgur.com et collez le lien ici.
            </p>
            {form.photoUrl && (
              <img src={form.photoUrl} alt="Aperçu" className="mt-2 w-full h-32 object-cover rounded-xl border border-line" onError={(e) => (e.currentTarget.style.display = 'none')} />
            )}
          </div>
          <button type="submit" disabled={saving} className="w-full bg-ocean text-white font-semibold py-3 rounded-full mt-2 hover:bg-oceanDark transition-colors disabled:opacity-60">
            {saving ? 'Enregistrement...' : 'Ajouter le véhicule'}
          </button>
        </form>
      </Modal>
    </DashboardShell>
  );
}
