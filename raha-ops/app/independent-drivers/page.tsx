'use client';
import { useEffect, useState } from 'react';
import DashboardShell from '../../components/DashboardShell';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';
import { api } from '../../lib/api';

interface PendingDriver {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  zones: string[];
  createdAt: string;
}

export default function IndependentDriversPage() {
  const [drivers, setDrivers] = useState<PendingDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/independent-drivers/pending');
      setDrivers(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleValidate(d: PendingDriver) {
    if (!confirm(`Valider ${d.firstName} ${d.lastName} (${d.phone}) comme chauffeur indépendant Raha ?`)) return;
    setBusyId(d.id);
    try {
      const { data } = await api.patch(`/independent-drivers/${d.id}/validate`);
      alert(data.message);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur lors de la validation');
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(d: PendingDriver) {
    if (!confirm(`Refuser la candidature de ${d.firstName} ${d.lastName} ? Cette action supprime définitivement son dossier.`)) return;
    setBusyId(d.id);
    try {
      const { data } = await api.delete(`/independent-drivers/${d.id}/reject`);
      alert(data.message);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur lors du refus');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <DashboardShell
      title="Chauffeurs indépendants"
      subtitle="Validez ou refusez les candidatures inscrites depuis l'application mobile"
    >
      {loading && <p className="text-slate">Chargement...</p>}
      {!loading && error && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4 mb-6">{error}</div>}
      {!loading && !error && drivers.length === 0 && (
        <EmptyState message="Aucune candidature en attente pour le moment." />
      )}

      {!loading && !error && drivers.length > 0 && (
        <div className="grid grid-cols-2 gap-5">
          {drivers.map((d) => (
            <div key={d.id} className="bg-white rounded-2xl border border-line p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="font-bold text-charcoal">{d.firstName} {d.lastName}</div>
                <Badge label="En attente" tone="warning" />
              </div>
              <div className="text-sm text-slate">{d.phone}</div>
              {d.zones?.length > 0 && (
                <div className="text-xs text-slate mt-1">Zones : {d.zones.join(', ')}</div>
              )}
              <div className="text-xs text-slate mt-1">
                Inscrit le {new Date(d.createdAt).toLocaleDateString('fr-FR')}
              </div>
              <div className="flex items-center gap-3 mt-5 pt-4 border-t border-line">
                <button
                  onClick={() => handleValidate(d)}
                  disabled={busyId === d.id}
                  className="flex-1 bg-ocean text-white font-semibold py-2 rounded-full text-xs disabled:opacity-50"
                >
                  Valider
                </button>
                <button
                  onClick={() => handleReject(d)}
                  disabled={busyId === d.id}
                  className="flex-1 bg-white border border-red-200 text-red-600 font-semibold py-2 rounded-full text-xs disabled:opacity-50"
                >
                  Refuser
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
