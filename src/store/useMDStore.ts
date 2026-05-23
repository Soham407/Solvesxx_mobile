import { create } from 'zustand';

import {
  approveMDItem,
  getMDApprovalQueue,
  getMDExecutiveSummary,
  rejectMDItem,
  type MDApprovalItem,
} from '../lib/mdBackend';
import type { AppUserProfile } from '../types/app';

interface MDState {
  hasHydrated: boolean;
  activeProfile: AppUserProfile | null;
  monthlyRevenue: number;
  headcount: number;
  activeIncidents: number;
  pendingApprovalCount: number;
  approvalItems: MDApprovalItem[];
  bootstrap: (profile: AppUserProfile | null) => Promise<void>;
  refresh: (profile: AppUserProfile | null) => Promise<void>;
  approveItem: (itemId: string) => Promise<void>;
  rejectItem: (itemId: string) => Promise<void>;
}

const FALLBACK_APPROVAL_ITEMS: MDApprovalItem[] = [
  {
    id: 'md-po-preview',
    type: 'purchase_order',
    description: 'PO for perimeter camera refresh at central facility',
    requestedBy: 'Priya Nair',
    department: 'Security Operations',
    amount: 175000,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'md-budget-preview',
    type: 'budget_exception',
    description: 'Budget exception for emergency fire-pump repairs',
    requestedBy: 'Rohit Mehta',
    department: 'Engineering',
    amount: 245000,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'md-policy-preview',
    type: 'policy_exception',
    description: 'Policy exception request for temporary overtime coverage',
    requestedBy: 'Anita Sharma',
    department: 'Housekeeping',
    amount: 112000,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
];

const FALLBACK_SUMMARY = {
  monthlyRevenue: 12400000,
  headcount: 312,
  activeIncidents: 3,
  pendingApprovalCount: FALLBACK_APPROVAL_ITEMS.length,
};

export const useMDStore = create<MDState>((set, get) => ({
  hasHydrated: false,
  activeProfile: null,
  monthlyRevenue: 0,
  headcount: 0,
  activeIncidents: 0,
  pendingApprovalCount: 0,
  approvalItems: [],

  bootstrap: async (profile) => {
    set({
      activeProfile: profile,
      hasHydrated: false,
    });

    try {
      if (!profile) {
        set({
          ...FALLBACK_SUMMARY,
          approvalItems: FALLBACK_APPROVAL_ITEMS,
          hasHydrated: true,
        });
        return;
      }

      const [summary, approvalItems] = await Promise.all([
        getMDExecutiveSummary(profile),
        getMDApprovalQueue(profile),
      ]);

      set({
        monthlyRevenue: summary.monthlyRevenue,
        headcount: summary.headcount,
        activeIncidents: summary.activeIncidents,
        pendingApprovalCount: summary.pendingApprovalCount,
        approvalItems,
        hasHydrated: true,
      });
    } catch (_error) {
      set({
        ...FALLBACK_SUMMARY,
        approvalItems: FALLBACK_APPROVAL_ITEMS,
        hasHydrated: true,
      });
    }
  },

  refresh: async (profile) => {
    const nextProfile = profile ?? get().activeProfile;

    set({
      activeProfile: nextProfile,
    });

    if (!nextProfile) {
      set({
        ...FALLBACK_SUMMARY,
        approvalItems: FALLBACK_APPROVAL_ITEMS,
      });
      return;
    }

    try {
      const [summary, approvalItems] = await Promise.all([
        getMDExecutiveSummary(nextProfile),
        getMDApprovalQueue(nextProfile),
      ]);

      set({
        monthlyRevenue: summary.monthlyRevenue,
        headcount: summary.headcount,
        activeIncidents: summary.activeIncidents,
        pendingApprovalCount: summary.pendingApprovalCount,
        approvalItems,
      });
    } catch (_error) {
      set({
        ...FALLBACK_SUMMARY,
        approvalItems: FALLBACK_APPROVAL_ITEMS,
      });
    }
  },

  approveItem: async (itemId) => {
    const state = get();
    const profile = state.activeProfile;

    if (!profile) {
      set((currentState) => {
        const remaining = currentState.approvalItems.filter((item) => item.id !== itemId);
        return {
          approvalItems: remaining,
          pendingApprovalCount: Math.max(0, remaining.length),
        };
      });
      return;
    }

    await approveMDItem({
      itemId,
      approverId: profile.userId,
    });

    await get().refresh(profile);
  },

  rejectItem: async (itemId) => {
    const state = get();
    const profile = state.activeProfile;

    if (!profile) {
      set((currentState) => {
        const remaining = currentState.approvalItems.filter((item) => item.id !== itemId);
        return {
          approvalItems: remaining,
          pendingApprovalCount: Math.max(0, remaining.length),
        };
      });
      return;
    }

    await rejectMDItem({
      itemId,
      approverId: profile.userId,
    });

    await get().refresh(profile);
  },
}));
