'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Dashboard } from '@/components/dashboard/dashboard';

export default function DashboardPage() {
  const { setAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Si pas encore authentifié côté client, charger les infos depuis le serveur
    // Le layout a déjà validé la session, donc on est sûr que le cookie est valide
    if (!isAuthenticated) {
      fetch('/api/auth/me')
        .then((res) => {
          if (!res.ok) throw new Error('Not authenticated');
          return res.json();
        })
        .then((data) => {
          if (data.success && data.user) {
            setAuth({
              userId: data.user.id,
              email: data.user.email,
              role: data.user.role,
              householdId: data.user.householdId,
              name: data.user.name,
              avatar: data.user.avatar,
              householdName: data.household?.name,
              householdType: data.household?.type,
            } as any);
          }
        })
        .catch(() => {
          // Session invalid, le layout va redirect automatiquement
        });
    }
  }, [isAuthenticated, setAuth]);

  return <Dashboard />;
}
