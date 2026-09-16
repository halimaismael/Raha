'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { IconBuilding, IconCar, IconCheckCircle } from '../../components/Icons';

const CITIES = ['Moroni', 'Mitsamiouli', 'Foumbouni', 'Mbéni', 'Ouzioini', 'Mitsoudjé', 'Dembéni'];

export default function RegisterPage() {
  const router = useRouter();
  const [type, setType] = useState<'AGENCE' | 'PARTICULIER'>('AGENCE');
  const [form, setForm] = useState({
    agencyName: '', city: CITIES[0], phone: '', email: '', address: '',
    adminName: '', adminEmail: '', password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/agencies/register', { ...form, type });
      setSuccess(data.message || 'Demande envoyée avec succès.');
    } catch (err: any) {
      setError(err?.response?.data?.message || "Inscription impossible, réessayez.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand p-8">
        <div className="max-w-md text-center bg-white rounded-2xl border border-line p-10 shadow-soft animate-scale-in">
          <div className="w-14 h-14 rounded-full bg-lagoon/15 text-lagoon flex items-center justify-center mx-auto mb-5">
            <IconCheckCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-charcoal mb-2 font-display">Demande envoyée</h2>
          <p className="text-slate text-sm mb-6">{success}</p>
          <a href="/login" className="text-coral font-semibold text-sm hover:underline">Retour à la connexion →</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-sand">
      <div className="flex-1 flex items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <div className="flex items-center gap-2.5 mb-8">
            <span className="w-9 h-9 rounded-lg bg-ocean flex items-center justify-center p-1.5 flex-shrink-0">
              <Image src="/logo-mark.png" alt="Raha" width={28} height={28} className="w-full h-full object-contain" priority />
            </span>
            <div>
              <div className="text-base font-display font-bold text-charcoal leading-tight">Raha</div>
              <div className="text-[11px] text-coral italic leading-tight">Votre trajet, notre priorité</div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-charcoal mb-1 font-display">Rejoindre Raha</h2>
          <p className="text-slate mb-6 text-sm">
            Mettez vos véhicules à disposition des usagers partout en Grande Comore.
          </p>

          {/* Choix du type de compte */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setType('AGENCE')}
              className={`rounded-xl border-2 p-4 text-left transition-colors ${type === 'AGENCE' ? 'border-ocean bg-ocean/5' : 'border-line bg-white hover:border-slate/40'}`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 ${type === 'AGENCE' ? 'bg-ocean text-white' : 'bg-sandDeep text-slate'}`}>
                <IconBuilding className="w-[18px] h-[18px]" />
              </div>
              <div className="font-bold text-sm text-charcoal">Agence</div>
              <div className="text-xs text-slate mt-1">Société avec une flotte de bus, taxis ou camions</div>
            </button>
            <button
              type="button"
              onClick={() => setType('PARTICULIER')}
              className={`rounded-xl border-2 p-4 text-left transition-colors ${type === 'PARTICULIER' ? 'border-ocean bg-ocean/5' : 'border-line bg-white hover:border-slate/40'}`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 ${type === 'PARTICULIER' ? 'bg-ocean text-white' : 'bg-sandDeep text-slate'}`}>
                <IconCar className="w-[18px] h-[18px]" />
              </div>
              <div className="font-bold text-sm text-charcoal">Particulier</div>
              <div className="text-xs text-slate mt-1">Je mets ma propre voiture à disposition</div>
            </button>
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 mb-4 animate-fade-in">{error}</div>}

          <label className="text-xs font-semibold text-slate uppercase tracking-wide">
            {type === 'AGENCE' ? "Nom de l'agence" : 'Votre nom / nom commercial'}
          </label>
          <input
            required value={form.agencyName} onChange={(e) => setForm({ ...form, agencyName: e.target.value })}
            className="w-full mt-1 mb-4 px-4 py-3 rounded-xl border border-line bg-white text-sm focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-shadow"
            placeholder={type === 'AGENCE' ? 'Transport Karthala Express' : 'Ali Mohamed'}
          />

          <label className="text-xs font-semibold text-slate uppercase tracking-wide">Ville</label>
          <select
            value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="w-full mt-1 mb-4 px-4 py-3 rounded-xl border border-line bg-white text-sm focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-shadow"
          >
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <label className="text-xs font-semibold text-slate uppercase tracking-wide">Téléphone</label>
          <input
            required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full mt-1 mb-4 px-4 py-3 rounded-xl border border-line bg-white text-sm focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-shadow"
            placeholder="+269 3XX XX XX"
          />

          <label className="text-xs font-semibold text-slate uppercase tracking-wide">Votre nom complet (responsable du compte)</label>
          <input
            required value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })}
            className="w-full mt-1 mb-4 px-4 py-3 rounded-xl border border-line bg-white text-sm focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-shadow"
          />

          <label className="text-xs font-semibold text-slate uppercase tracking-wide">Email de connexion</label>
          <input
            required type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
            className="w-full mt-1 mb-4 px-4 py-3 rounded-xl border border-line bg-white text-sm focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-shadow"
          />

          <label className="text-xs font-semibold text-slate uppercase tracking-wide">Mot de passe</label>
          <input
            required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full mt-1 mb-6 px-4 py-3 rounded-xl border border-line bg-white text-sm focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-shadow"
          />

          <button type="submit" disabled={loading} className="w-full bg-ocean text-white font-semibold py-3 rounded-full hover:bg-oceanDark transition-colors disabled:opacity-60">
            {loading ? 'Envoi...' : 'Envoyer ma demande'}
          </button>

          <p className="text-center text-sm text-slate mt-6">
            Déjà inscrit ? <a href="/login" className="text-coral font-semibold hover:underline">Se connecter</a>
          </p>
        </form>
      </div>
    </div>
  );
}
