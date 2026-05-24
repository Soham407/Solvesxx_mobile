import { create } from 'zustand';

import { fetchAccountFinanceSummary } from '../lib/accountBackend';
import type { AppUserProfile } from '../types/app';

interface AccountState {
  hasHydrated: boolean;
  isSummaryLoading: boolean;
  errorMessage: string | null;
  todayCollections: number;
  outstandingReceivables: number;
  pendingBillsCount: number;
  overduePmtCount: number;
  bootstrap: (profile: AppUserProfile | null) => void;
  refresh: (profile: AppUserProfile | null) => void;
}

const DEFAULT_SUMMARY = {
  todayCollections: 0,
  outstandingReceivables: 0,
  pendingBillsCount: 0,
  overduePmtCount: 0,
};

export const useAccountStore = create<AccountState>((set) => ({
  hasHydrated: false,
  isSummaryLoading: false,
  errorMessage: null,
  ...DEFAULT_SUMMARY,

  bootstrap: (profile) => {
    set({ hasHydrated: false, errorMessage: null });
    useAccountStore.getState().refresh(profile);
  },

  refresh: (profile) => {
    set({ isSummaryLoading: true, errorMessage: null });

    if (!profile) {
      set({ ...DEFAULT_SUMMARY, isSummaryLoading: false, hasHydrated: true });
      return;
    }

    void (async () => {
      try {
        const summary = await fetchAccountFinanceSummary(profile);
        set({
          todayCollections: summary.todayCollections,
          outstandingReceivables: summary.outstandingReceivables,
          pendingBillsCount: summary.pendingBillsCount,
          overduePmtCount: summary.overduePmtCount,
          errorMessage: null,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load account data. Showing empty finance view.';
        console.warn('[Account Store] Failed to refresh account dashboard:', message);
        set({ ...DEFAULT_SUMMARY, errorMessage: message });
      } finally {
        set({ isSummaryLoading: false, hasHydrated: true });
      }
    })();
  },
}));
