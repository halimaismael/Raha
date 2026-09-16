'use client';
import { useEffect, useState } from 'react';
import DashboardShell from '../../components/DashboardShell';
import Modal from '../../components/Modal';
import { api } from '../../lib/api';

interface Driver {
  id: string; name: string; phone: string; licenseNumber: string; rating: number;
  professionalCode: string; active: boolean;
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

  const [activating, setActivating] = useState<Driver | null>(null);
  const [activatePassword, setActivatePassword] = useState('');
  const [activateSaving, setActivateSaving] = useState(false);

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

  function openActivate(d: Driver) {
    setActivating(d);
    setActivatePassword('');
  }

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    if (!activating) return;
    if (activatePassword.length < 4) {
      alert('Le mot de passe doit contenir au moins 4 caractères.');
      return;
    }
    setActivateSaving(true);
    try {
      const { data } = await api.patch(`/drivers/${activating.id}/activate`, { password: activatePassword });
      alert(data.message || `Compte activé. Le chauffeur peut se connecter avec le numéro ${activating.phone}.`);
      setActivating(null);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Erreur lors de l'activation");
    } finally {
      setActivateSaving(false);
    }
  }

  return (
    <DashboardShell
      title="Chauffeurs"
      subtitle="Gérez votre équipe de chauffeurs et leurs affectations"
      action={
        <button onClick={() => setOpen(true)} className="bg-coral text-white font-semibold px-5 py-2.5 rounded-full text-sm">
          + Ajouter un chauffeur
        </button>
      }
    >
      <div className="grid grid-cols-3 gap-5">
        {loading && <p className="text-slate">Chargement...</p>}
        {!loading && drivers.length === 0 && <p className="text-slate">Aucun chauffeur enregistré.</p>}
        {drivers.map((d) => (
          <div key={d.id} className="bg-white rounded-2xl border border-line p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-sandDeep flex items-center justify-center text-xl">🧑</div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${d.active ? 'bg-lagoon/15 text-lagoon' : 'bg-ylang/20 text-ylang'}`}>
                {d.active ? 'Actif' : 'Non activé'}
              </span>
            </div>
            <div className="font-bold text-charcoal">{d.name}</div>
            <div className="text-sm text-slate mt-0.5">{d.phone}</div>
            <div className="text-xs text-slate mt-1">Permis n° {d.licenseNumber}</div>
            <div className="text-xs font-semibold text-ocean mt-2">{d.professionalCode}</div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-line">
              <span className="text-xs text-slate">
                {d.vehicle ? `${d.vehicle.brand} ${d.vehicle.model}` : 'Non affecté'}
              </span>
              <span className="text-xs font-semibold text-ylang">★ {d.rating.toFixed(1)}</span>
            </div>
            {!d.active && (
              <button
                onClick={() => openActivate(d)}
                className="w-full mt-4 bg-ocean text-white font-semibold py-2 rounded-full text-xs"
              >
                Activer le compte
              </button>
            )}
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Ajouter un chauffeur">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate uppercase">Nom complet</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-line text-sm" placeholder="Said Ahmed" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate uppercase">Téléphone</label>
            <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-line text-sm" placeholder="+269 3XX XX XX" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate uppercase">Numéro de permis</label>
            <input required value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-line text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate uppercase">Véhicule affecté (optionnel)</label>
            <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-line text-sm">
              <option value="">— Aucun —</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plateNumber})</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate">
            Un identifiant professionnel Raha (RAHA-CH-xxxxxx) sera généré automatiquement. Le chauffeur ne pourra se connecter à son espace qu'une fois son compte activé (bouton "Activer le compte").
          </p>
          <button type="submit" disabled={saving} className="w-full bg-ocean text-white font-semibold py-3 rounded-full mt-2">
            {saving ? 'Enregistrement...' : 'Ajouter le chauffeur'}
          </button>
        </form>
      </Modal>

      <Modal open={!!activating} onClose={() => setActivating(null)} title={`Activer le compte de ${activating?.name ?? ''}`}>
        <form onSubmit={handleActivate} className="space-y-4">
          <p className="text-sm text-slate">
            Choisissez un mot de passe initial pour ce chauffeur. Il pourra ensuite se connecter à son espace professionnel Raha
            avec son numéro <span className="font-semibold text-charcoal">{activating?.phone}</span> et ce mot de passe (modifiable ensuite par lui-même).
          </p>
          <div>
            <label className="text-xs font-semibold text-slate uppercase">Mot de passe initial</label>
            <input
              required
              type="text"
              minLength={4}
              value={activatePassword}
              onChange={(e) => setActivatePassword(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 rounded-xl border border-line text-sm"
              placeholder="4 caractères minimum"
            />
          </div>
          <button type="submit" disabled={activateSaving} className="w-full bg-ocean text-white font-semibold py-3 rounded-full mt-2">
            {activateSaving ? 'Activation...' : 'Activer le compte'}
          </button>
        </form>
      </Modal>
    </DashboardShell>
  );
}
