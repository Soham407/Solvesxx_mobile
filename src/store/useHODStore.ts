import { create } from 'zustand';

import {
  approveLeaveRequest,
  fetchHODLeaveRequests,
  fetchHODSummary,
  fetchHODTeamMembers,
  rejectLeaveRequest,
  type HODLeaveRequest,
  type HODTeamMember,
} from '../lib/hodBackend';
import type { AppUserProfile } from '../types/app';

interface HODState {
  hasHydrated: boolean;
  isLoading: boolean;
  pendingLeaveCount: number;
  attendanceRate: number;
  teamSize: number;
  leaveRequests: HODLeaveRequest[];
  teamMembers: HODTeamMember[];
  activeProfile: AppUserProfile | null;
  bootstrap: (profile: AppUserProfile | null) => Promise<void>;
  refresh: (profile: AppUserProfile | null) => Promise<void>;
  approveLeave: (leaveId: string) => Promise<void>;
  rejectLeave: (leaveId: string) => Promise<void>;
}

const defaultState = {
  pendingLeaveCount: 0,
  attendanceRate: 0,
  teamSize: 0,
  leaveRequests: [] as HODLeaveRequest[],
  teamMembers: [] as HODTeamMember[],
};

async function fetchDashboardData(profile: AppUserProfile) {
  const [summary, leaveRequests, teamMembers] = await Promise.all([
    fetchHODSummary(profile),
    fetchHODLeaveRequests(profile),
    fetchHODTeamMembers(profile),
  ]);

  return {
    pendingLeaveCount: summary.pendingLeaveCount,
    attendanceRate: summary.attendanceRate,
    teamSize: summary.teamSize,
    leaveRequests,
    teamMembers,
  };
}

export const useHODStore = create<HODState>((set, get) => ({
  hasHydrated: false,
  isLoading: false,
  activeProfile: null,
  ...defaultState,

  bootstrap: async (profile) => {
    set({
      hasHydrated: false,
      isLoading: true,
      activeProfile: profile,
      ...defaultState,
    });

    if (!profile) {
      set({
        hasHydrated: true,
        isLoading: false,
      });
      return;
    }

    try {
      const dashboardData = await fetchDashboardData(profile);
      set({
        ...dashboardData,
        hasHydrated: true,
        isLoading: false,
      });
    } catch {
      set({
        hasHydrated: true,
        isLoading: false,
        ...defaultState,
      });
    }
  },

  refresh: async (profile) => {
    const targetProfile = profile ?? get().activeProfile;

    set({
      activeProfile: targetProfile,
      isLoading: true,
    });

    if (!targetProfile) {
      set({
        hasHydrated: true,
        isLoading: false,
        ...defaultState,
      });
      return;
    }

    try {
      const dashboardData = await fetchDashboardData(targetProfile);
      set({
        ...dashboardData,
        hasHydrated: true,
        isLoading: false,
      });
    } catch {
      set({
        hasHydrated: true,
        isLoading: false,
      });
    }
  },

  approveLeave: async (leaveId) => {
    const profile = get().activeProfile;

    if (!profile) {
      return;
    }

    await approveLeaveRequest(profile, leaveId);
    await get().refresh(profile);
  },

  rejectLeave: async (leaveId) => {
    const profile = get().activeProfile;

    if (!profile) {
      return;
    }

    await rejectLeaveRequest(profile, leaveId);
    await get().refresh(profile);
  },
}));
