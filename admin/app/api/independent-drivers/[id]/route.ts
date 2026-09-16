import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const OPS_KEY = process.env.RAHA_OPS_KEY;

// PATCH → valide le dossier (attribue l'identifiant professionnel).
export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!OPS_KEY) {
    return NextResponse.json(
      { message: "RAHA_OPS_KEY n'est pas configurée sur le serveur admin." },
      { status: 500 }
    );
  }
  const res = await fetch(`${API_URL}/independent-drivers/${params.id}/validate`, {
    method: 'PATCH',
    headers: { 'x-raha-ops-key': OPS_KEY },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

// DELETE → refuse la candidature (uniquement si elle est encore en attente).
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!OPS_KEY) {
    return NextResponse.json(
      { message: "RAHA_OPS_KEY n'est pas configurée sur le serveur admin." },
      { status: 500 }
    );
  }
  const res = await fetch(`${API_URL}/independent-drivers/${params.id}/reject`, {
    method: 'DELETE',
    headers: { 'x-raha-ops-key': OPS_KEY },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
