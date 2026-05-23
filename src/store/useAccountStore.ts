import { create } from 'zustand';

import {
  fetchAccountFinanceSummary,
  fetchPaymentStatusList,
  fetchRecentBills,
  type BillRecord,
  type PaymentStatusRecord,
} from '../lib/accountBackend';
import type { AppUserProfile } from '../types/app';

interface AccountState {
  hasHydrated: boolean;
  isSummaryLoading: boolean;
  isBillsLoading: boolean;
  isPaymentsLoading: boolean;
  errorMessage: string | null;
  todayCollections: number;
  outstandingReceivables: number;
  pendingBillsCount: number;
  overduePmtCount: number;
  recentBills: BillRecord[];
  paymentItems: PaymentStatusRecord[];
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
  isBillsLoading: false,
  isPaymentsLoading: false,
  errorMessage: null,
  ...DEFAULT_SUMMARY,
  recentBills: [],
  paymentItems: [],

  bootstrap: (profile) => {
    set({
      hasHydrated: false,
      errorMessage: null,
    });

    useAccountStore.getState().refresh(profile);
  },

  refresh: (profile) => {
    set({
      isSummaryLoading: true,
      isBillsLoading: true,
      isPaymentsLoading: true,
      errorMessage: null,
    });

    if (!profile) {
      set({
        ...DEFAULT_SUMMARY,
        recentBills: [],
        paymentItems: [],
        isSummaryLoading: false,
        isBillsLoading: false,
        isPaymentsLoading: false,
        hasHydrated: true,
      });

      return;
    }

    void (async () => {
      try {
        const [summary, recentBills, paymentItems] = await Promise.all([
          fetchAccountFinanceSummary(profile),
          fetchRecentBills(profile),
          fetchPaymentStatusList(profile),
        ]);

        set({
          todayCollections: summary.todayCollections,
          outstandingReceivables: summary.outstandingReceivables,
          pendingBillsCount: summary.pendingBillsCount,
          overduePmtCount: summary.overduePmtCount,
          recentBills,
          paymentItems,
          errorMessage: null,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load account data. Showing empty finance view.';

        console.warn('[Account Store] Failed to refresh account dashboard:', message);

        set({
          ...DEFAULT_SUMMARY,
          recentBills: [],
          paymentItems: [],
          errorMessage: message,
        });
      } finally {
        set({
          isSummaryLoading: false,
          isBillsLoading: false,
          isPaymentsLoading: false,
          hasHydrated: true,
        });
      }
    })();
  },
}));
