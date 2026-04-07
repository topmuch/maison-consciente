import { create } from 'zustand';

export type AppView =
  | 'dashboard'
  | 'zones'
  | 'zone-detail'
  | 'scan'
  | 'interactions'
  | 'messages'
  | 'recipes'
  | 'settings'
  | 'members'
  | 'admin'
  | 'display'
  | 'hospitality-dashboard'
  | 'local-guide'
  | 'guest-checkin'
  | 'pricing'
  | 'billing'
  | 'hospitality-settings';

interface AppState {
  currentView: AppView;
  selectedZoneId: string | null;
  sidebarOpen: boolean;
  setView: (view: AppView, zoneId?: string) => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'dashboard',
  selectedZoneId: null,
  sidebarOpen: false,
  setView: (view, zoneId) =>
    set({ currentView: view, selectedZoneId: zoneId || null }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));
