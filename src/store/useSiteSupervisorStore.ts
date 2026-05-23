import { create } from 'zustand';

import {
  acknowledgeSiteIncident,
  fetchGuardRoster,
  fetchSiteIncidents,
  fetchSiteSupervisorSummary,
} from '../lib/siteSupervisorBackend';
import type { GuardRosterEntry, SiteIncident } from '../lib/siteSupervisorBackend';
import type { AppUserProfile } from '../types/app';

interface SiteSupervisorState {
  hasHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  activeProfile: AppUserProfile | null;
  guardsOnDuty: number;
  openIncidents: number;
  guards: GuardRosterEntry[];
  incidents: SiteIncident[];
  bootstrap: (profile: AppUserProfile | null) => void;
  refresh: (profile: AppUserProfile | null) => void;
  acknowledgeIncident: (incidentId: string) => Promise<void>;
}

function deriveOpenIncidentCount(incidents: SiteIncident[]) {
  return incidents.filter((incident) => !incident.acknowledged).length;
}

async function loadSiteSupervisorData(
  profile: AppUserProfile | null,
  set: (updater: (state: SiteSupervisorState) => Partial<SiteSupervisorState>) => void,
) {
  try {
    const [summary, guards, incidents] = await Promise.all([
      fetchSiteSupervisorSummary(profile),
      fetchGuardRoster(profile),
      fetchSiteIncidents(profile),
    ]);

    set(() => ({
      guardsOnDuty: summary.guardsOnDuty,
      openIncidents: summary.openIncidents || deriveOpenIncidentCount(incidents),
      guards,
      incidents,
      isLoading: false,
      hasHydrated: true,
      error: null,
    }));
  } catch (error) {
    set((state) => ({
      guardsOnDuty: 0,
      openIncidents: deriveOpenIncidentCount(state.incidents),
      guards: [],
      incidents: state.incidents,
      isLoading: false,
      hasHydrated: true,
      error: error instanceof Error ? error.message : 'Failed to load site supervisor data.',
    }));
  }
}

export const useSiteSupervisorStore = create<SiteSupervisorState>((set, get) => ({
  hasHydrated: false,
  isLoading: false,
  error: null,
  activeProfile: null,
  guardsOnDuty: 0,
  openIncidents: 0,
  guards: [],
  incidents: [],

  bootstrap: (profile) => {
    set(() => ({
      activeProfile: profile,
      isLoading: true,
      error: null,
    }));

    void loadSiteSupervisorData(profile, set);
  },

  refresh: (profile) => {
    set(() => ({
      activeProfile: profile,
      isLoading: true,
      error: null,
    }));

    void loadSiteSupervisorData(profile, set);
  },

  acknowledgeIncident: async (incidentId) => {
    const profile = get().activeProfile;

    set((state) => ({
      incidents: state.incidents.map((incident) =>
        incident.id === incidentId
          ? {
              ...incident,
              acknowledged: true,
            }
          : incident,
      ),
      openIncidents: Math.max(
        0,
        state.openIncidents - (state.incidents.some((incident) => incident.id === incidentId && !incident.acknowledged) ? 1 : 0),
      ),
      error: null,
    }));

    try {
      await acknowledgeSiteIncident(incidentId, profile);
      get().refresh(profile);
    } catch (error) {
      set(() => ({
        error: error instanceof Error ? error.message : 'Failed to acknowledge incident.',
      }));
      get().refresh(profile);
      throw error;
    }
  },
}));
