import { create } from 'zustand';
import type { UserRole } from '@/core/types';

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Auth Store
   
   Added householdType to support Domicile / Hospitality split.
   ═══════════════════════════════════════════════════════ */

interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
  householdId: string | null;
  name: string;
  avatar: string | null;
}

interface AuthState {
  user: AuthUser | null;
  userName: string | null;
  userEmail: string | null;
  userAvatar: string | null;
  householdName: string | null;
  householdType: 'home' | 'hospitality';
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (data: AuthUser & { householdName?: string; householdType?: string }) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setHouseholdType: (type: 'home' | 'hospitality') => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  userName: null,
  userEmail: null,
  userAvatar: null,
  householdName: null,
  householdType: 'home',
  isAuthenticated: false,
  isLoading: true,
  setAuth: (data) =>
    set({
      user: {
        userId: data.userId,
        email: data.email,
        householdId: data.householdId,
        role: data.role,
        name: data.name,
        avatar: data.avatar,
      },
      userName: data.name || null,
      userEmail: data.email || null,
      userAvatar: data.avatar || null,
      householdName: data.householdName || null,
      householdType: (data.householdType === 'hospitality' ? 'hospitality' : 'home') as 'home' | 'hospitality',
      isAuthenticated: true,
      isLoading: false,
    }),
  clearAuth: () =>
    set({
      user: null,
      userName: null,
      userEmail: null,
      userAvatar: null,
      householdName: null,
      householdType: 'home',
      isAuthenticated: false,
      isLoading: false,
    }),
  setLoading: (isLoading) => set({ isLoading }),
  setHouseholdType: (householdType) => set({ householdType }),
}));
