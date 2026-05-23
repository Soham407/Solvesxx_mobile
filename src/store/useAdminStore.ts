import { create } from 'zustand';

import {
  deactivateAdminUser,
  fetchAdminDashboardSummary,
  fetchAdminUserList,
  type AdminUserRecord,
} from '../lib/adminBackend';
import type { AppUserProfile } from '../types/app';

interface AdminState {
  hasHydrated: boolean;
  isLoading: boolean;
  activeUsersCount: number;
  loginsToday: number;
  pendingOnboarding: number;
  systemAlerts: number;
  users: AdminUserRecord[];
  searchQuery: string;
  currentProfile: AppUserProfile | null;
  bootstrap: (profile: AppUserProfile | null) => void;
  refresh: (profile: AppUserProfile | null) => void;
  setSearchQuery: (q: string) => void;
  deactivateUser: (userId: string) => Promise<void>;
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
  users: [],
  searchQuery: '',
  currentProfile: null,

  bootstrap: (profile) => {
    set({
      hasHydrated: false,
      currentProfile: profile,
    });

    get().refresh(profile);
  },

  refresh: (profile) => {
    const targetProfile = profile ?? get().currentProfile;

    if (!targetProfile) {
      set({
        ...DEFAULT_METRICS,
        users: [],
        isLoading: false,
        hasHydrated: true,
        currentProfile: null,
      });
      return;
    }

    set({
      isLoading: true,
      currentProfile: targetProfile,
    });

    void (async () => {
      try {
        const [summary, users] = await Promise.all([
          fetchAdminDashboardSummary(targetProfile),
          fetchAdminUserList(targetProfile),
        ]);

        set({
          activeUsersCount: summary.activeUsersCount,
          loginsToday: summary.loginsToday,
          pendingOnboarding: summary.pendingOnboarding,
          systemAlerts: summary.systemAlerts,
          users,
          isLoading: false,
          hasHydrated: true,
        });
      } catch (error) {
        console.warn('Failed to hydrate admin workspace', error);
        set({
          isLoading: false,
          hasHydrated: true,
        });
      }
    })();
  },

  setSearchQuery: (q) => {
    set({ searchQuery: q });
  },

  deactivateUser: async (userId) => {
    const currentProfile = get().currentProfile;

    if (!currentProfile) {
      return;
    }

    await deactivateAdminUser({
      adminProfile: currentProfile,
      targetUserId: userId,
    });

    const wasActive = get().users.find((user) => user.id === userId)?.isActive ?? false;

    set((state) => ({
      users: state.users.map((user) =>
        user.id === userId
          ? {
              ...user,
              isActive: false,
            }
          : user,
      ),
      activeUsersCount: wasActive ? Math.max(0, state.activeUsersCount - 1) : state.activeUsersCount,
    }));

    get().refresh(currentProfile);
  },
}));
