import { create } from 'zustand';

import {
  fetchPendingGRNs,
  fetchStockAlerts,
  fetchStorekeeperSummary,
  type GRNRecord,
  type StockAlertItem,
} from '../lib/storekeeperBackend';
import type { AppUserProfile } from '../types/app';

interface StorekeeperState {
  hasHydrated: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  totalItems: number;
  lowStockCount: number;
  pendingGRNCount: number;
  stockAlerts: StockAlertItem[];
  pendingGRNs: GRNRecord[];
  bootstrap: (profile: AppUserProfile | null) => void;
  refresh: (profile: AppUserProfile | null) => void;
}

const EMPTY_STATE = {
  totalItems: 0,
  lowStockCount: 0,
  pendingGRNCount: 0,
  stockAlerts: [] as StockAlertItem[],
  pendingGRNs: [] as GRNRecord[],
};

async function loadStorekeeperData(profile: AppUserProfile | null) {
  if (!profile) {
    return {
      ...EMPTY_STATE,
      errorMessage: null,
    };
  }

  const [summary, stockAlerts, pendingGRNs] = await Promise.all([
    fetchStorekeeperSummary(profile),
    fetchStockAlerts(profile),
    fetchPendingGRNs(profile),
  ]);

  return {
    totalItems: summary.totalItems,
    lowStockCount: summary.lowStockCount,
    pendingGRNCount: summary.pendingGRNCount,
    stockAlerts,
    pendingGRNs,
    errorMessage: null,
  };
}

export const useStorekeeperStore = create<StorekeeperState>((set) => ({
  hasHydrated: false,
  isLoading: false,
  errorMessage: null,
  ...EMPTY_STATE,

  bootstrap: (profile) => {
    set({
      hasHydrated: false,
      isLoading: true,
      errorMessage: null,
    });

    void (async () => {
      try {
        const payload = await loadStorekeeperData(profile);

        set({
          ...payload,
          hasHydrated: true,
          isLoading: false,
        });
      } catch (error) {
        set({
          ...EMPTY_STATE,
          hasHydrated: true,
          isLoading: false,
          errorMessage: error instanceof Error ? error.message : 'Could not load inventory data.',
        });
      }
    })();
  },

  refresh: (profile) => {
    set({
      isLoading: true,
      errorMessage: null,
    });

    void (async () => {
      try {
        const payload = await loadStorekeeperData(profile);

        set({
          ...payload,
          hasHydrated: true,
          isLoading: false,
        });
      } catch (error) {
        set((state) => ({
          ...state,
          isLoading: false,
          errorMessage: error instanceof Error ? error.message : 'Could not refresh inventory data.',
        }));
      }
    })();
  },
}));
