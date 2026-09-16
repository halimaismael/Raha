'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function IndexPage() {
  const router = useRouter();
  const { admin, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(admin ? '/dashboard' : '/login');
  }, [loading, admin]);

  return null;
}
