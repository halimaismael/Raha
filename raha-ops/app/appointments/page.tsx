'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '../../components/DashboardShell';
import EmptyState from '../../components/EmptyState';
import Badge, { BadgeTone } from '../../components/Badge';
import { api } from '../../lib/api';

interface MwanaRequest {
  id: string;
  reference: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  appointmentDate: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  childName?: string;
  notes?: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    phone: string;
  };
}

const STATUS_LABEL: Record<MwanaRequest['status'], { label: string; tone: BadgeTone }> = {
  PENDING: { label: 'En attente', tone: 'warning' },
  CONFIRMED: { label: 'Confirmé', tone: 'success' },
  CANCELLED: { label: 'Annulé', tone: 'danger' },
  COMPLETED: { label: 'Terminé', tone: 'neutral' },
};

const NEXT_ACTIONS: Record<MwanaRequest['status'], { label: string; next: string }[]> = {
  PENDING: [
    { label: 'Confirmer', next: 'CONFIRMED' },
    { label: 'Annuler', next: 'CANCELLED' },
  ],
  CONFIRMED: [
    { label: 'Marquer terminé', next: 'COMPLETED' },
    { label: 'Annuler', next: 'CANCELLED' },
  ],
  CANCELLED: [],
  COMPLETED: [],
};

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

export default function AppointmentsPage() {
  const [requests, setRequests] = useState<MwanaRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/mwana-requests/admin/all');
      setRequests(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: string, reference: string) {
    if (!confirm(`Confirmer le changement de statut du rendez-vous ${reference} vers "${STATUS_LABEL[status as MwanaRequest['status']].label}" ?`)) {
      return;
    }
    setBusyId(id);
    try {
      const { data } = await api.patch(`/mwana-requests/${id}/status`, { status });
      alert(data?.message || 'Statut mis à jour.');
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur');
    } finally {
      setBusyId(null);
    }
  }

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <DashboardShell
      title="Rendez-vous Raha Mwana"
      subtitle={
        pendingCount > 0
          ? `${requests.length} rendez-vous au total · ${pendingCount} en attente de traitement`
          : `${requests.length} rendez-vous au total`
      }
    >
      {loading && <p className="text-slate">Chargement...</p>}
      {!loading && error && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4 mb-6">{error}</div>}
      {!loading && !error && requests.length === 0 && (
        <EmptyState message="Aucun rendez-vous Raha Mwana pour le moment." />
      )}

      {!loading && !error && requests.length > 0 && (
        <div className="bg-white rounded-2xl border border-line overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="text-left text-xs text-slate uppercase tracking-wide border-b border-line">
                <th className="px-6 py-3 font-semibold">Référence</th>
                <th className="px-6 py-3 font-semibold">Usager</th>
                <th className="px-6 py-3 font-semibold">Enfant</th>
                <th className="px-6 py-3 font-semibold">Trajet</th>
                <th className="px-6 py-3 font-semibold">Date du rendez-vous</th>
                <th className="px-6 py-3 font-semibold">Statut</th>
                <th className="px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {requests.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="px-6 py-4 font-medium text-charcoal">{r.reference}</td>
                  <td className="px-6 py-4">
                    <div className="text-charcoal">{r.user?.firstName} {r.user?.lastName}</div>
                    <div className="text-xs text-slate">{r.user?.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-slate">{r.childName || '—'}</td>
                  <td className="px-6 py-4 text-slate">
                    <div>{r.pickupAddress || '—'}</div>
                    {r.dropoffAddress ? (
                      <div className="text-xs text-slate/80">→ {r.dropoffAddress}</div>
                    ) : null}
                  </td>
                  <td className="px-6 py-4 text-slate">{formatDate(r.appointmentDate)}</td>
                  <td className="px-6 py-4">
                    <Badge label={STATUS_LABEL[r.status].label} tone={STATUS_LABEL[r.status].tone} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {NEXT_ACTIONS[r.status].map((action) => (
                        <button
                          key={action.next}
                          disabled={busyId === r.id}
                          onClick={() => updateStatus(r.id, action.next, r.reference)}
                          className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-charcoal transition hover:border-ocean hover:text-ocean disabled:opacity-50"
                        >
                          {action.label}
                        </button>
                      ))}
                      {NEXT_ACTIONS[r.status].length === 0 ? (
                        <span className="text-xs text-slate/70">—</span>
                      ) : null}
                    </div>
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
