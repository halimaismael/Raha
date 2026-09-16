import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';

export const metadata: Metadata = {
  title: 'Raha — Espace Agence',
  description:
    'Votre trajet, notre priorité. Plateforme de gestion des agences de transport en Grande Comore : véhicules, chauffeurs, trajets et réservations.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
