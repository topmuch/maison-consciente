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
  | 'appearance'
  | 'members'
  | 'admin'
  | 'display'
  | 'hospitality'
  | 'guest-checkin'
  | 'pricing'
  | 'billing'
  | 'local-guide'
  | 'hospitality-settings'
  | 'hospitality-analytics';

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
