import { create } from 'zustand';

export interface ResidentPresenceMember {
  residentId: string | null;
  surface: 'mobile' | 'web' | 'unknown';
  userId: string;
  fullName: string;
  joinedAt: string;
}

interface ResidentPresenceState {
  flatId: string | null;
  hasLiveSync: boolean;
  members: ResidentPresenceMember[];
  setPresenceSnapshot: (input: {
    flatId: string | null;
    hasLiveSync: boolean;
    members: ResidentPresenceMember[];
  }) => void;
  reset: () => void;
}

const initialState = {
  flatId: null,
  hasLiveSync: false,
  members: [] as ResidentPresenceMember[],
};

export const useResidentPresenceStore = create<ResidentPresenceState>((set) => ({
  ...initialState,

  setPresenceSnapshot: (input) => {
    set({
      flatId: input.flatId,
      hasLiveSync: input.hasLiveSync,
      members: input.members,
    });
  },

  reset: () => {
    set(initialState);
  },
}));
