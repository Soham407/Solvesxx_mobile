import { supabase } from './supabase';
import type { AppUserProfile } from '../types/app';

export interface GuardRosterEntry {
  id: string;
  guardName: string;
  shiftStart: string;
  lastGpsPing: string | null;
  status: 'active' | 'overdue-checkin' | 'offline';
}

export interface SiteIncident {
  id: string;
  type: string;
  location: string;
  severity: 'low' | 'medium' | 'high';
  openedAt: string;
  acknowledged: boolean;
}

interface SiteSupervisorSummary {
  guardsOnDuty: number;
  openIncidents: number;
}

function normalizeGuardStatus(value: string | null): GuardRosterEntry['status'] {
  if (value === 'active' || value === 'overdue-checkin' || value === 'offline') {
    return value;
  }

  if (value === 'overdue_checkin' || value === 'overdue') {
    return 'overdue-checkin';
  }

  return 'offline';
}

function normalizeSeverity(value: string | null): SiteIncident['severity'] {
  if (value === 'low' || value === 'medium' || value === 'high') {
    return value;
  }

  return 'low';
}

function normalizeSummaryRow(data: unknown): SiteSupervisorSummary {
  const raw = Array.isArray(data) ? data[0] : data;

  if (!raw || typeof raw !== 'object') {
    return {
      guardsOnDuty: 0,
      openIncidents: 0,
    };
  }

  const row = raw as Record<string, unknown>;

  return {
    guardsOnDuty: typeof row.guards_on_duty === 'number' ? row.guards_on_duty : 0,
    openIncidents: typeof row.open_incidents === 'number' ? row.open_incidents : 0,
  };
}

export async function fetchSiteSupervisorSummary(_profile: AppUserProfile | null) {
  const { data, error } = await supabase.rpc('get_site_supervisor_summary');

  if (error) {
    throw error;
  }

  return normalizeSummaryRow(data);
}

export async function fetchGuardRoster(_profile: AppUserProfile | null) {
  const { data, error } = await supabase.rpc('get_guard_roster');

  if (error) {
    throw error;
  }

  const rows = Array.isArray(data) ? data : [];

  return rows.map((row, index) => {
    const raw = row as Record<string, unknown>;

    return {
      id: typeof raw.id === 'string' ? raw.id : `guard-${index}`,
      guardName: typeof raw.guard_name === 'string' ? raw.guard_name : 'Guard',
      shiftStart: typeof raw.shift_start === 'string' ? raw.shift_start : new Date().toISOString(),
      lastGpsPing: typeof raw.last_gps_ping === 'string' ? raw.last_gps_ping : null,
      status: normalizeGuardStatus(typeof raw.status === 'string' ? raw.status : null),
    } satisfies GuardRosterEntry;
  });
}

export async function fetchSiteIncidents(_profile: AppUserProfile | null) {
  const { data, error } = await supabase.rpc('get_site_incidents');

  if (error) {
    throw error;
  }

  const rows = Array.isArray(data) ? data : [];

  return rows.map((row, index) => {
    const raw = row as Record<string, unknown>;

    return {
      id: typeof raw.id === 'string' ? raw.id : `incident-${index}`,
      type: typeof raw.type === 'string' ? raw.type : 'General',
      location: typeof raw.location === 'string' ? raw.location : 'Unknown location',
      severity: normalizeSeverity(typeof raw.severity === 'string' ? raw.severity : null),
      openedAt: typeof raw.opened_at === 'string' ? raw.opened_at : new Date().toISOString(),
      acknowledged: Boolean(raw.acknowledged),
    } satisfies SiteIncident;
  });
}

export async function acknowledgeSiteIncident(
  incidentId: string,
  profile: AppUserProfile | null,
) {
  if (!profile?.userId) {
    throw new Error('Supervisor profile is unavailable.');
  }

  const { error } = await supabase.rpc('acknowledge_site_incident', {
    p_incident_id: incidentId,
    p_supervisor_id: profile.userId,
  });

  if (error) {
    throw error;
  }
}
