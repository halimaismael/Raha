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
  duration: 'UNE_SEMAINE' | 'UN_MOIS' | 'UN_TRIMESTRE' | 'ANNEE_SCOLAIRE';
  numberOfPeople: number;
  tripsPerDay: number;
  city: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone: string;
  childrenNames: string[];
  documents: string[];
  dossierReviewed: boolean;
  appointmentDate: string;
  createdAt: string;
  user: { firstName: string; lastName: string; phone: string; email: string | null };
}

const STATUS_LABEL: Record<MwanaRequest['status'], { label: string; tone: BadgeTone }> = {
  PENDING: { label: 'En attente', tone: 'warning' },
  CONFIRMED: { label: 'Confirmé', tone: 'success' },
  CANCELLED: { label: 'Annulé', tone: 'danger' },
  COMPLETED: { label: 'Terminé', tone: 'neutral' },
};

const DURATION_LABEL: Record<MwanaRequest['duration'], string> = {
  UNE_SEMAINE: '1 semaine',
  UN_MOIS: '1 mois',
  UN_TRIMESTRE: '1 trimestre',
  ANNEE_SCOLAIRE: 'Année scolaire',
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
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
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
  const [openId, setOpenId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/mwana-requests/admin/all');
      setRequests(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors du chargement');
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

  async function toggleReviewed(id: string, reviewed: boolean) {
    setBusyId(id);
    try {
      await api.patch(`/mwana-requests/${id}/dossier-reviewed`, { reviewed });
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur');
    } finally {
      setBusyId(null);
    }
  }

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const openRequest = requests.find((r) => r.id === openId) || null;

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
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="text-left text-xs text-slate uppercase tracking-wide border-b border-line">
                <th className="px-6 py-3 font-semibold">Référence</th>
                <th className="px-6 py-3 font-semibold">Contact</th>
                <th className="px-6 py-3 font-semibold">Enfant(s)</th>
                <th className="px-6 py-3 font-semibold">Service</th>
                <th className="px-6 py-3 font-semibold">Rendez-vous</th>
                <th className="px-6 py-3 font-semibold">Statut</th>
                <th className="px-6 py-3 font-semibold">Dossier</th>
                <th className="px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {requests.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="px-6 py-4 font-medium text-charcoal">
                    <button className="hover:underline hover:text-ocean text-left" onClick={() => setOpenId(r.id)}>
                      {r.reference}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-charcoal">{r.contactFirstName} {r.contactLastName}</div>
                    <div className="text-xs text-slate">{r.contactPhone}</div>
                    <div className="text-xs text-slate">{r.contactEmail}</div>
                  </td>
                  <td className="px-6 py-4 text-slate">
                    {r.childrenNames?.length ? r.childrenNames.join(', ') : '—'}
                  </td>
                  <td className="px-6 py-4 text-slate">
                    <div>{r.city}</div>
                    <div className="text-xs text-slate/80">{DURATION_LABEL[r.duration]} · {r.numberOfPeople} pers. · {r.tripsPerDay}×/j</div>
                  </td>
                  <td className="px-6 py-4 text-slate">{formatDate(r.appointmentDate)}</td>
                  <td className="px-6 py-4">
                    <Badge label={STATUS_LABEL[r.status].label} tone={STATUS_LABEL[r.status].tone} />
                  </td>
                  <td className="px-6 py-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={r.dossierReviewed}
                        disabled={busyId === r.id}
                        onChange={(e) => toggleReviewed(r.id, e.target.checked)}
                        className="w-4 h-4 rounded border-line accent-ocean"
                      />
                      <span className="text-xs text-slate">{r.dossierReviewed ? 'Vérifié' : 'À vérifier'}</span>
                    </label>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setOpenId(r.id)}
                        className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-charcoal transition hover:border-ocean hover:text-ocean"
                      >
                        Voir le dossier
                      </button>
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openRequest && (
        <DossierModal
          request={openRequest}
          busy={busyId === openRequest.id}
          onClose={() => setOpenId(null)}
          onToggleReviewed={(reviewed) => toggleReviewed(openRequest.id, reviewed)}
          onUpdateStatus={(status) => updateStatus(openRequest.id, status, openRequest.reference)}
        />
      )}
    </DashboardShell>
  );
}

function DossierModal({
  request, busy, onClose, onToggleReviewed, onUpdateStatus,
}: {
  request: MwanaRequest;
  busy: boolean;
  onClose: () => void;
  onToggleReviewed: (reviewed: boolean) => void;
  onUpdateStatus: (status: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl border border-line shadow-card w-full max-w-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 py-5 border-b border-line sticky top-0 bg-white">
          <div>
            <div className="text-xs text-slate uppercase tracking-wide font-semibold">Dossier Raha Mwana</div>
            <div className="text-lg font-display font-bold text-charcoal">{request.reference}</div>
          </div>
          <div className="flex items-center gap-3">
            <Badge label={STATUS_LABEL[request.status].label} tone={STATUS_LABEL[request.status].tone} />
            <button onClick={onClose} className="text-slate hover:text-charcoal text-xl leading-none">×</button>
          </div>
        </div>

        <div className="px-6 py-5 flex flex-col gap-6">
          <section>
            <h3 className="text-xs font-semibold text-slate uppercase tracking-wide mb-2">Contact</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <DetailRow label="Nom" value={`${request.contactFirstName} ${request.contactLastName}`} />
              <DetailRow label="Téléphone" value={request.contactPhone} />
              <DetailRow label="Email" value={request.contactEmail} />
              <DetailRow label="Compte usager" value={`${request.user?.firstName ?? ''} ${request.user?.lastName ?? ''}`.trim() || '—'} />
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-slate uppercase tracking-wide mb-2">Enfant(s)</h3>
            {request.childrenNames?.length ? (
              <ul className="list-disc list-inside text-sm text-charcoal space-y-1">
                {request.childrenNames.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            ) : (
              <p className="text-sm text-slate">Aucun nom renseigné.</p>
            )}
          </section>

          <section>
            <h3 className="text-xs font-semibold text-slate uppercase tracking-wide mb-2">Service demandé</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <DetailRow label="Ville" value={request.city} />
              <DetailRow label="Durée souhaitée" value={DURATION_LABEL[request.duration]} />
              <DetailRow label="Personnes" value={String(request.numberOfPeople)} />
              <DetailRow label="Trajets / jour" value={String(request.tripsPerDay)} />
              <DetailRow label="Rendez-vous" value={formatDate(request.appointmentDate)} />
              <DetailRow label="Créé le" value={formatDate(request.createdAt)} />
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-slate uppercase tracking-wide mb-2">
              Justificatifs ({request.documents?.length ?? 0})
            </h3>
            {request.documents?.length ? (
              <div className="grid grid-cols-3 gap-3">
                {request.documents.map((doc, i) => (
                  <a key={i} href={doc} target="_blank" rel="noreferrer" className="block">
                    <img
                      src={doc}
                      alt={`Justificatif ${i + 1}`}
                      className="w-full h-28 object-cover rounded-lg border border-line hover:opacity-80 transition"
                    />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-coral">Aucun justificatif joint.</p>
            )}
          </section>

          <section className="flex items-center justify-between rounded-xl border border-line px-4 py-3 bg-sand/40">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={request.dossierReviewed}
                disabled={busy}
                onChange={(e) => onToggleReviewed(e.target.checked)}
                className="w-4 h-4 rounded border-line accent-ocean"
              />
              <span className="text-sm font-medium text-charcoal">
                Dossier physique vérifié en agence (originaux contrôlés)
              </span>
            </label>
          </section>

          {NEXT_ACTIONS[request.status].length > 0 && (
            <section className="flex flex-wrap gap-2 pt-1 border-t border-line pt-4">
              {NEXT_ACTIONS[request.status].map((action) => (
                <button
                  key={action.next}
                  disabled={busy}
                  onClick={() => onUpdateStatus(action.next)}
                  className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-charcoal transition hover:border-ocean hover:text-ocean disabled:opacity-50"
                >
                  {action.label}
                </button>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate">{label}</div>
      <div className="text-charcoal font-medium">{value || '—'}</div>
    </div>
  );
}
