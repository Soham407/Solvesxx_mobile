import { create } from 'zustand';

import { fetchAdminDashboardSummary } from '../lib/adminBackend';
import type { AppUserProfile } from '../types/app';

interface AdminState {
  hasHydrated: boolean;
  isLoading: boolean;
  activeUsersCount: number;
  loginsToday: number;
  pendingOnboarding: number;
  systemAlerts: number;
  currentProfile: AppUserProfile | null;
  bootstrap: (profile: AppUserProfile | null) => void;
  refresh: (profile: AppUserProfile | null) => void;
}

const DEFAULT_METRICS = {
  activeUsersCount: 0,
  loginsToday: 0,
  pendingOnboarding: 0,
  systemAlerts: 0,
};

export const useAdminStore = create<AdminState>((set, get) => ({
  hasHydrated: false,
  isLoading: false,
  ...DEFAULT_METRICS,
  currentProfile: null,

  bootstrap: (profile) => {
    set({ hasHydrated: false, currentProfile: profile });
    get().refresh(profile);
  },

  refresh: (profile) => {
    const targetProfile = profile ?? get().currentProfile;

    if (!targetProfile) {
      set({ ...DEFAULT_METRICS, isLoading: false, hasHydrated: true, currentProfile: null });
      return;
    }

    set({ isLoading: true, currentProfile: targetProfile });

    void (async () => {
      try {
        const summary = await fetchAdminDashboardSummary(targetProfile);
        set({
          activeUsersCount: summary.activeUsersCount,
          loginsToday: summary.loginsToday,
          pendingOnboarding: summary.pendingOnboarding,
          systemAlerts: summary.systemAlerts,
          isLoading: false,
          hasHydrated: true,
        });
      } catch (error) {
        console.warn('Failed to hydrate admin workspace', error);
        set({ isLoading: false, hasHydrated: true });
      }
    })();
  },
}));
