'use client';
import Sidebar from './Sidebar';
import { useRequireAuth } from '../context/AuthContext';

export default function DashboardShell({ children, title, subtitle, action }: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  const { admin, loading } = useRequireAuth();

  if (loading || !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate">
        <div className="flex items-center gap-2.5">
          <span className="w-4 h-4 rounded-full border-2 border-line border-t-ocean animate-spin" />
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-h-screen">
        <header className="flex items-center justify-between px-10 py-8 border-b border-line bg-white/90 backdrop-blur sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-display font-bold text-charcoal">{title}</h1>
            {subtitle && <p className="text-slate text-sm mt-1">{subtitle}</p>}
          </div>
          {action}
        </header>
        <div className="p-10 animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
