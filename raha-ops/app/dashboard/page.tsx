'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardShell from '../../components/DashboardShell';
import { api } from '../../lib/api';
import { IconUser, IconBuilding, IconCar, IconRoute } from '../../components/Icons';

interface Stats {
  users: { total: number };
  agencies: { approved: number; pending: number };
  independentDrivers: { approved: number; pending: number };
  mwanaRequests: { pending: number; total: number };
}

function StatCard({ label, value, sub, tone, Icon, href }: {
  label: string; value: number; sub?: string; tone: string; Icon: any; href: string;
}) {
  return (
    <Link href={href} className="bg-white rounded-2xl border border-line p-6 shadow-card hover:shadow-soft transition-shadow block">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tone}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-3xl font-display font-bold text-charcoal tabular-nums">{value}</div>
      <div className="text-sm text-slate mt-1">{label}</div>
      {sub && <div className="text-xs text-coral font-semibold mt-2">{sub}</div>}
    </Link>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/super-admin/stats')
      .then(({ data }) => setStats(data))
      .catch((err) => setError(err?.response?.data?.message || 'Erreur lors du chargement'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell
      title="Tableau de bord"
      subtitle="Vue d'ensemble de la plateforme Raha"
    >
      {loading && <p className="text-slate">Chargement...</p>}
      {!loading && error && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4">{error}</div>}

      {!loading && stats && (
        <div className="grid grid-cols-4 gap-5">
          <StatCard
            label="Usagers inscrits"
            value={stats.users.total}
            tone="bg-ocean/10 text-ocean"
            Icon={IconUser}
            href="/users"
          />
          <StatCard
            label="Chauffeurs indépendants validés"
            value={stats.independentDrivers.approved}
            sub={stats.independentDrivers.pending > 0 ? `${stats.independentDrivers.pending} en attente de validation` : undefined}
            tone="bg-lagoon/15 text-lagoon"
            Icon={IconCar}
            href="/independent-drivers"
          />
          <StatCard
            label="Agences validées"
            value={stats.agencies.approved}
            sub={stats.agencies.pending > 0 ? `${stats.agencies.pending} en attente de validation` : undefined}
            tone="bg-ylang/20 text-[#8a6a04]"
            Icon={IconBuilding}
            href="/agencies"
          />
          <StatCard
            label="Rendez-vous Raha Mwana"
            value={stats.mwanaRequests.total}
            sub={stats.mwanaRequests.pending > 0 ? `${stats.mwanaRequests.pending} à traiter` : undefined}
            tone="bg-coral/10 text-coral"
            Icon={IconRoute}
            href="/appointments"
          />
        </div>
      )}
    </DashboardShell>
  );
}
