'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [accountType, setAccountType] = useState<'AGENCE' | 'PARTICULIER'>('AGENCE');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Connexion impossible');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-sand">
      {/* Panneau visuel */}
      <div className="hidden lg:flex w-1/2 bg-ocean relative overflow-hidden flex-col justify-between p-14">
        <div className="flex items-center gap-3 relative z-10">
          <span className="w-11 h-11 rounded-xl bg-white/95 shadow-soft flex items-center justify-center p-1.5 flex-shrink-0">
            <Image src="/logo-mark.png" alt="Raha" width={36} height={36} className="w-full h-full object-contain" priority />
          </span>
          <div className="text-sand text-xl font-display font-bold tracking-tight">Raha</div>
        </div>

        <div className="relative z-10">
          <p className="text-ylang font-display italic text-lg mb-3">Votre trajet, notre priorité</p>
          <h1 className="text-sand text-4xl font-display font-bold leading-tight max-w-md">
            Gérez votre agence de transport, de bout en bout.
          </h1>
          <p className="text-sand/70 mt-4 max-w-sm">
            Véhicules, trajets, réservations et paiements — tout depuis un seul tableau de bord,
            pensé pour la Grande Comore.
          </p>
        </div>

        <div className="relative z-10 flex gap-8 text-sand/60 text-sm font-medium">
          <span>Bus</span>
          <span>Taxis</span>
          <span>Camions</span>
        </div>

        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-lagoon/20" />
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-coral/10" />
        <div className="absolute top-1/3 -right-10 w-40 h-40 rounded-full bg-ylang/10" />
      </div>

      {/* Formulaire */}
      <div className="flex-1 flex items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <span className="w-9 h-9 rounded-lg bg-ocean flex items-center justify-center p-1.5 flex-shrink-0">
              <Image src="/logo-mark.png" alt="Raha" width={28} height={28} className="w-full h-full object-contain" priority />
            </span>
            <div>
              <div className="text-base font-display font-bold text-charcoal leading-tight">Raha</div>
              <div className="text-[11px] text-coral italic leading-tight">Votre trajet, notre priorité</div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-charcoal mb-1 font-display">Espace {accountType === 'PARTICULIER' ? 'particulier' : 'agence'}</h2>
          <p className="text-slate mb-5 text-sm">Connectez-vous pour gérer vos véhicules et réservations.</p>

          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              type="button"
              onClick={() => setAccountType('AGENCE')}
              className={`rounded-xl border-2 py-3 text-sm font-semibold transition-colors ${accountType === 'AGENCE' ? 'border-ocean bg-ocean/5 text-ocean' : 'border-line text-slate hover:border-slate/40'}`}
            >
              Agence
            </button>
            <button
              type="button"
              onClick={() => setAccountType('PARTICULIER')}
              className={`rounded-xl border-2 py-3 text-sm font-semibold transition-colors ${accountType === 'PARTICULIER' ? 'border-ocean bg-ocean/5 text-ocean' : 'border-line text-slate hover:border-slate/40'}`}
            >
              Particulier
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 mb-4 animate-fade-in">{error}</div>
          )}

          <label className="text-xs font-semibold text-slate uppercase tracking-wide">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mt-1 mb-4 px-4 py-3 rounded-xl border border-line bg-white text-sm focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-shadow"
            placeholder="admin@votreagence.km"
            required
          />

          <label className="text-xs font-semibold text-slate uppercase tracking-wide">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mt-1 mb-6 px-4 py-3 rounded-xl border border-line bg-white text-sm focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-shadow"
            placeholder="••••••••"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ocean text-white font-semibold py-3 rounded-full hover:bg-oceanDark transition-colors disabled:opacity-60"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          <p className="text-center text-sm text-slate mt-6">
            Votre agence n'est pas encore inscrite ?{' '}
            <a href="/register" className="text-coral font-semibold hover:underline">Créer un compte</a>
          </p>
        </form>
      </div>
    </div>
  );
}
