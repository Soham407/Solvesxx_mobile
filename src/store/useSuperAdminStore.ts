import { create } from 'zustand';

import {
  fetchAllCompaniesHealth,
  fetchSuperAdminPlatformSummary,
  type CompanyHealthRecord,
} from '../lib/superAdminBackend';
import type { AppUserProfile } from '../types/app';

interface SuperAdminState {
  hasHydrated: boolean;
  totalCompanies: number;
  totalActiveUsers: number;
  activeIncidents: number;
  criticalAlertCount: number;
  companies: CompanyHealthRecord[];
  bootstrap: (profile: AppUserProfile | null) => Promise<void>;
  refresh: (profile: AppUserProfile | null) => Promise<void>;
}

const INITIAL_STATE = {
  totalCompanies: 0,
  totalActiveUsers: 0,
  activeIncidents: 0,
  criticalAlertCount: 0,
  companies: [] as CompanyHealthRecord[],
};

export const useSuperAdminStore = create<SuperAdminState>((set, get) => ({
  ...INITIAL_STATE,
  hasHydrated: false,

  bootstrap: async (profile) => {
    if (profile?.role !== 'super_admin') {
      set({ ...INITIAL_STATE, hasHydrated: true });
      return;
    }

    await get().refresh(profile);
    set({ hasHydrated: true });
  },

  refresh: async (profile) => {
    if (profile?.role !== 'super_admin') {
      set(INITIAL_STATE);
      return;
    }

    try {
      const [summary, companies] = await Promise.all([
        fetchSuperAdminPlatformSummary(),
        fetchAllCompaniesHealth(),
      ]);

      set({
        totalCompanies: summary.totalCompanies,
        totalActiveUsers: summary.totalActiveUsers,
        activeIncidents: summary.activeIncidents,
        criticalAlertCount: summary.criticalAlertCount,
        companies,
      });
    } catch {
      set(INITIAL_STATE);
    }
  },
}));
