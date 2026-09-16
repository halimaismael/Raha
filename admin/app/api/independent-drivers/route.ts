import { NextResponse } from 'next/server';

// Route serveur (jamais exposée au navigateur) qui relaie la liste des
// chauffeurs indépendants en attente vers le backend, en ajoutant la clé
// secrète RAHA_OPS_KEY côté serveur. Le mot de passe/la clé ne transite
// jamais dans le code envoyé au navigateur de l'admin.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const OPS_KEY = process.env.RAHA_OPS_KEY;

export async function GET() {
  if (!OPS_KEY) {
    return NextResponse.json(
      { message: "RAHA_OPS_KEY n'est pas configurée sur le serveur admin." },
      { status: 500 }
    );
  }
  const res = await fetch(`${API_URL}/independent-drivers/pending`, {
    headers: { 'x-raha-ops-key': OPS_KEY },
    cache: 'no-store',
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
