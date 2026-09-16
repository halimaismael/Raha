'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { IconDashboard, IconVan, IconUser, IconRoute, IconTicket, IconLogout } from './Icons';

const NAV = [
  { href: '/dashboard', label: 'Tableau de bord', Icon: IconDashboard },
  { href: '/vehicles', label: 'Véhicules', Icon: IconVan },
  { href: '/drivers', label: 'Chauffeurs', Icon: IconUser },
  { href: '/trips', label: 'Trajets programmés', Icon: IconRoute },
  { href: '/bookings', label: 'Réservations', Icon: IconTicket },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { agency, admin, logout } = useAuth();

  const initials = (admin?.name || agency?.name || '?')
    .split(' ')
    .map((p: string) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside className="w-64 bg-ocean text-sand flex flex-col min-h-screen sticky top-0">
      <div className="px-6 py-7 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/95 shadow-soft flex items-center justify-center p-1.5">
            <Image src="/logo-mark.png" alt="Raha" width={32} height={32} className="w-full h-full object-contain" priority />
          </span>
          <div>
            <div className="text-lg font-display font-bold leading-tight">Raha</div>
            <div className="text-[11px] text-ylang/90 italic leading-tight mt-0.5">Votre trajet, notre priorité</div>
          </div>
        </div>
        <div className="text-xs text-sand/50 mt-3 uppercase tracking-wide font-medium">Espace agence</div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                active ? 'bg-white/10 text-white' : 'text-sand/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-coral transition-opacity ${
                  active ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'text-coral' : 'text-sand/60 group-hover:text-sand'}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-5 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-sand flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{agency?.name}</div>
            <div className="text-xs text-sand/50 truncate">{admin?.name} · {admin?.role}</div>
          </div>
        </div>
        <span className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/10 text-sand/80 mb-3">
          {agency?.type === 'PARTICULIER' ? 'Particulier' : 'Agence'}
        </span>
        <button onClick={logout} className="flex items-center gap-1.5 text-xs text-coral font-semibold hover:underline">
          <IconLogout className="w-3.5 h-3.5" />
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
