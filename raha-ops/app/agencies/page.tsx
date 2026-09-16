'use client';
import { useEffect, useState } from 'react';
import DashboardShell from '../../components/DashboardShell';
import EmptyState from '../../components/EmptyState';
import Badge, { BadgeTone } from '../../components/Badge';
import { api } from '../../lib/api';

interface Agency {
  id: string;
  name: string;
  professionalCode: string | null;
  type: 'AGENCE' | 'PARTICULIER';
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED';
  city: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  _count: { vehicles: number; drivers: number; trips: number };
}

const STATUS_LABEL: Record<Agency['status'], { label: string; tone: BadgeTone }> = {
  PENDING: { label: 'En attente', tone: 'warning' },
  APPROVED: { label: 'Validée', tone: 'success' },
  SUSPENDED: { label: 'Suspendue', tone: 'danger' },
};

export default function AgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/agencies/admin/all');
      setAgencies(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleApprove(a: Agency) {
    if (!confirm(`Valider l'agence ${a.name} ?`)) return;
    setBusyId(a.id);
    try {
      const { data } = await api.patch(`/agencies/${a.id}/approve`);
      alert(data.message);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur');
    } finally {
      setBusyId(null);
    }
  }

  async function handleSuspend(a: Agency) {
    if (!confirm(`Suspendre l'agence ${a.name} ? Elle ne sera plus visible des usagers.`)) return;
    setBusyId(a.id);
    try {
      const { data } = await api.patch(`/agencies/${a.id}/suspend`);
      alert(data.message);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <DashboardShell
      title="Agences"
      subtitle="Toutes les agences et comptes particuliers inscrits sur la plateforme"
    >
      {loading && <p className="text-slate">Chargement...</p>}
      {!loading && error && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4 mb-6">{error}</div>}
      {!loading && !error && agencies.length === 0 && (
        <EmptyState message="Aucune agence enregistrée pour le moment." />
      )}

      {!loading && !error && agencies.length > 0 && (
        <div className="bg-white rounded-2xl border border-line overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate uppercase tracking-wide border-b border-line">
                <th className="px-6 py-3 font-semibold">Nom</th>
                <th className="px-6 py-3 font-semibold">Type</th>
                <th className="px-6 py-3 font-semibold">Ville</th>
                <th className="px-6 py-3 font-semibold">Contact</th>
                <th className="px-6 py-3 font-semibold">Flotte</th>
                <th className="px-6 py-3 font-semibold">Statut</th>
                <th className="px-6 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {agencies.map((a) => (
                <tr key={a.id} className="border-b border-line last:border-0">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-charcoal">{a.name}</div>
                    <div className="text-xs text-slate">{a.professionalCode || '—'}</div>
                  </td>
                  <td className="px-6 py-4 text-slate">{a.type === 'PARTICULIER' ? 'Particulier' : 'Agence'}</td>
                  <td className="px-6 py-4 text-slate">{a.city || '—'}</td>
                  <td className="px-6 py-4 text-slate">
                    <div>{a.phone || '—'}</div>
                    <div className="text-xs">{a.email || ''}</div>
                  </td>
                  <td className="px-6 py-4 text-slate tabular-nums">
                    {a._count.vehicles} véh. · {a._count.drivers} chauf.
                  </td>
                  <td className="px-6 py-4">
                    <Badge label={STATUS_LABEL[a.status].label} tone={STATUS_LABEL[a.status].tone} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    {a.status === 'PENDING' && (
                      <button
                        onClick={() => handleApprove(a)}
                        disabled={busyId === a.id}
                        className="bg-ocean text-white font-semibold px-4 py-1.5 rounded-full text-xs disabled:opacity-50"
                      >
                        Valider
                      </button>
                    )}
                    {a.status === 'APPROVED' && (
                      <button
                        onClick={() => handleSuspend(a)}
                        disabled={busyId === a.id}
                        className="bg-white border border-red-200 text-red-600 font-semibold px-4 py-1.5 rounded-full text-xs disabled:opacity-50"
                      >
                        Suspendre
                      </button>
                    )}
                    {a.status === 'SUSPENDED' && (
                      <button
                        onClick={() => handleApprove(a)}
                        disabled={busyId === a.id}
                        className="bg-ocean text-white font-semibold px-4 py-1.5 rounded-full text-xs disabled:opacity-50"
                      >
                        Réactiver
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
