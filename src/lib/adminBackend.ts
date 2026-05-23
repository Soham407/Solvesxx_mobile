import { supabase } from './supabase';
import type { AppUserProfile } from '../types/app';

interface AdminDashboardSummaryRpcRow {
  active_users_count: number | null;
  logins_today: number | null;
  pending_onboarding: number | null;
  system_alerts: number | null;
}

interface AdminUserRpcRow {
  id: string;
  full_name?: string | null;
  fullName?: string | null;
  email?: string | null;
  role?: string | null;
  role_name?: string | null;
  last_login?: string | null;
  last_login_at?: string | null;
  lastLogin?: string | null;
  is_active?: boolean | null;
  isActive?: boolean | null;
}

export interface AdminDashboardSummaryRecord {
  activeUsersCount: number;
  loginsToday: number;
  pendingOnboarding: number;
  systemAlerts: number;
}

export interface AdminUserRecord {
  id: string;
  fullName: string;
  email: string;
  role: string;
  lastLogin: string | null;
  isActive: boolean;
}

function readCompanyId(profile: AppUserProfile) {
  const candidate =
    typeof profile.preferences.company_id === 'string'
      ? profile.preferences.company_id
      : typeof profile.preferences.companyId === 'string'
        ? profile.preferences.companyId
        : null;

  return candidate?.trim() ? candidate.trim() : null;
}

function toAdminUserRecord(row: AdminUserRpcRow): AdminUserRecord {
  return {
    id: row.id,
    fullName: row.full_name ?? row.fullName ?? 'Unknown user',
    email: row.email ?? 'No email',
    role: row.role ?? row.role_name ?? 'unknown',
    lastLogin: row.last_login_at ?? row.last_login ?? row.lastLogin ?? null,
    isActive: Boolean(row.is_active ?? row.isActive ?? false),
  };
}

export async function fetchAdminDashboardSummary(
  profile: AppUserProfile,
): Promise<AdminDashboardSummaryRecord> {
  const { data, error } = await supabase.rpc('get_admin_dashboard_summary', {
    p_user_id: profile.userId,
    p_company_id: readCompanyId(profile),
  });

  if (error) {
    throw error;
  }

  const record = Array.isArray(data)
    ? ((data[0] ?? null) as AdminDashboardSummaryRpcRow | null)
    : ((data ?? null) as AdminDashboardSummaryRpcRow | null);

  return {
    activeUsersCount: record?.active_users_count ?? 0,
    loginsToday: record?.logins_today ?? 0,
    pendingOnboarding: record?.pending_onboarding ?? 0,
    systemAlerts: record?.system_alerts ?? 0,
  };
}

export async function fetchAdminUserList(profile: AppUserProfile): Promise<AdminUserRecord[]> {
  const { data, error } = await supabase.rpc('get_admin_user_list', {
    p_user_id: profile.userId,
    p_company_id: readCompanyId(profile),
  });

  if (error) {
    throw error;
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return (data as AdminUserRpcRow[]).map(toAdminUserRecord);
}

export async function deactivateAdminUser(params: {
  adminProfile: AppUserProfile;
  targetUserId: string;
}) {
  const { error } = await supabase.rpc('deactivate_admin_user', {
    p_target_user_id: params.targetUserId,
    p_admin_id: params.adminProfile.userId,
  });

  if (error) {
    throw error;
  }
}
