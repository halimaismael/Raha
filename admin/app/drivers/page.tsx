'use client';
import { useEffect, useState } from 'react';
import DashboardShell from '../../components/DashboardShell';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import { api } from '../../lib/api';
import { IconPlus, IconUser, IconStar } from '../../components/Icons';

interface Driver {
  id: string; name: string; phone: string; licenseNumber: string; rating: number;
  vehicle?: { brand: string; model: string; plateNumber: string } | null;
}
interface VehicleOption { id: string; brand: string; model: string; plateNumber: string }

const emptyForm = { name: '', phone: '', licenseNumber: '', vehicleId: '' };

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [{ data: d }, { data: v }] = await Promise.all([
      api.get('/drivers/mine'),
      api.get('/vehicles/mine'),
    ]);
    setDrivers(d);
    setVehicles(v);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/drivers', { ...form, vehicleId: form.vehicleId || undefined });
      setOpen(false);
      setForm(emptyForm);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardShell
      title="Chauffeurs"
      subtitle="Gérez votre équipe de chauffeurs et leurs affectations"
      action={
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 bg-coral text-white font-semibold px-5 py-2.5 rounded-full text-sm hover:brightness-105 transition">
          <IconPlus className="w-4 h-4" />
          Ajouter un chauffeur
        </button>
      }
    >
      {loading && <p className="text-slate">Chargement...</p>}
      {!loading && drivers.length === 0 && (
        <div className="bg-white rounded-2xl border border-line">
          <EmptyState message="Aucun chauffeur enregistré." />
        </div>
      )}
      {!loading && drivers.length > 0 && (
        <div className="grid grid-cols-3 gap-5">
          {drivers.map((d) => (
            <div key={d.id} className="bg-white rounded-2xl border border-line p-6 shadow-card hover:shadow-soft transition-shadow">
              <div className="w-12 h-12 rounded-full bg-sandDeep flex items-center justify-center text-slate mb-4">
                <IconUser className="w-5 h-5" />
              </div>
              <div className="font-bold text-charcoal">{d.name}</div>
              <div className="text-sm text-slate mt-0.5">{d.phone}</div>
              <div className="text-xs text-slate mt-1">Permis n° {d.licenseNumber}</div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-line">
                <span className="text-xs text-slate">
                  {d.vehicle ? `${d.vehicle.brand} ${d.vehicle.model}` : 'Non affecté'}
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold text-ylang">
                  <IconStar className="w-3.5 h-3.5" />
                  {d.rating.toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Ajouter un chauffeur">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate uppercase">Nom complet</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-shadow" placeholder="Said Ahmed" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate uppercase">Téléphone</label>
            <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-shadow" placeholder="+269 3XX XX XX" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate uppercase">Numéro de permis</label>
            <input required value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-shadow" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate uppercase">Véhicule affecté (optionnel)</label>
            <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-shadow">
              <option value="">— Aucun —</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plateNumber})</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={saving} className="w-full bg-ocean text-white font-semibold py-3 rounded-full mt-2 hover:bg-oceanDark transition-colors disabled:opacity-60">
            {saving ? 'Enregistrement...' : 'Ajouter le chauffeur'}
          </button>
        </form>
      </Modal>
    </DashboardShell>
  );
}
