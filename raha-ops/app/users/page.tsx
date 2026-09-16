'use client';
import { useEffect, useState } from 'react';
import DashboardShell from '../../components/DashboardShell';
import EmptyState from '../../components/EmptyState';
import { api } from '../../lib/api';

interface UserRow {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  createdAt: string;
  _count: { bookings: number; mwanaRequests: number };
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/super-admin/users')
      .then(({ data }) => setUsers(data))
      .catch((err) => setError(err?.response?.data?.message || 'Erreur lors du chargement'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell
      title="Usagers"
      subtitle={`${users.length} compte${users.length > 1 ? 's' : ''} usager${users.length > 1 ? 's' : ''} inscrit${users.length > 1 ? 's' : ''} sur l'application mobile`}
    >
      {loading && <p className="text-slate">Chargement...</p>}
      {!loading && error && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4 mb-6">{error}</div>}
      {!loading && !error && users.length === 0 && (
        <EmptyState message="Aucun usager inscrit pour le moment." />
      )}

      {!loading && !error && users.length > 0 && (
        <div className="bg-white rounded-2xl border border-line overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate uppercase tracking-wide border-b border-line">
                <th className="px-6 py-3 font-semibold">Nom</th>
                <th className="px-6 py-3 font-semibold">Téléphone</th>
                <th className="px-6 py-3 font-semibold">Email</th>
                <th className="px-6 py-3 font-semibold">Réservations</th>
                <th className="px-6 py-3 font-semibold">Raha Mwana</th>
                <th className="px-6 py-3 font-semibold">Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-0">
                  <td className="px-6 py-4 font-semibold text-charcoal">{u.firstName} {u.lastName}</td>
                  <td className="px-6 py-4 text-slate">{u.phone}</td>
                  <td className="px-6 py-4 text-slate">{u.email || '—'}</td>
                  <td className="px-6 py-4 text-slate tabular-nums">{u._count.bookings}</td>
                  <td className="px-6 py-4 text-slate tabular-nums">{u._count.mwanaRequests}</td>
                  <td className="px-6 py-4 text-slate">{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
