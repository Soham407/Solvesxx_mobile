import { supabase } from './supabase';
import type { AppUserProfile } from '../types/app';

export interface HODLeaveRequest {
  id: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface HODTeamMember {
  id: string;
  name: string;
  designation: string;
  attendanceStatus: 'present' | 'absent' | 'late' | 'unknown';
}

export interface HODSummary {
  pendingLeaveCount: number;
  attendanceRate: number;
  teamSize: number;
}

function getRPCContext(profile: AppUserProfile) {
  return {
    companyId: profile.societyId ?? profile.assignedLocation?.id ?? profile.userId,
    userId: profile.userId,
  };
}

function normalizeLeaveStatus(status: string | null): HODLeaveRequest['status'] {
  if (status === 'approved' || status === 'rejected') {
    return status;
  }

  return 'pending';
}

function normalizeAttendanceStatus(status: string | null): HODTeamMember['attendanceStatus'] {
  if (status === 'present' || status === 'absent' || status === 'late') {
    return status;
  }

  return 'unknown';
}

export async function fetchHODSummary(profile: AppUserProfile): Promise<HODSummary> {
  const context = getRPCContext(profile);
  const { data, error } = await supabase.rpc('get_hod_summary', {
    p_user_id: context.userId,
    p_company_id: context.companyId,
  });

  if (error) {
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;
  const safeRow = (row ?? {}) as Record<string, number | null>;

  return {
    pendingLeaveCount:
      typeof safeRow.pending_leave_count === 'number' ? safeRow.pending_leave_count : 0,
    attendanceRate: typeof safeRow.attendance_rate === 'number' ? safeRow.attendance_rate : 0,
    teamSize: typeof safeRow.team_size === 'number' ? safeRow.team_size : 0,
  };
}

export async function fetchHODLeaveRequests(profile: AppUserProfile): Promise<HODLeaveRequest[]> {
  const context = getRPCContext(profile);
  const { data, error } = await supabase.rpc('get_hod_leave_requests', {
    p_user_id: context.userId,
    p_company_id: context.companyId,
  });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Array<Record<string, string | null>>;

  return rows.map((row) => ({
    id: row.id ? String(row.id) : `${row.employee_name ?? 'leave'}-${row.start_date ?? Date.now()}`,
    employeeName: row.employee_name ? String(row.employee_name) : 'Employee',
    leaveType: row.leave_type ? String(row.leave_type) : 'Leave',
    startDate: row.start_date ? String(row.start_date) : '',
    endDate: row.end_date ? String(row.end_date) : '',
    reason: row.reason ? String(row.reason) : 'No reason provided',
    status: normalizeLeaveStatus(row.status ? String(row.status) : null),
  }));
}

export async function fetchHODTeamMembers(profile: AppUserProfile): Promise<HODTeamMember[]> {
  const context = getRPCContext(profile);
  const { data, error } = await supabase.rpc('get_hod_team_members', {
    p_user_id: context.userId,
    p_company_id: context.companyId,
  });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Array<Record<string, string | null>>;

  return rows.map((row) => ({
    id: row.id ? String(row.id) : `${row.name ?? 'member'}-${row.designation ?? 'team'}`,
    name: row.name ? String(row.name) : 'Team member',
    designation: row.designation ? String(row.designation) : 'Associate',
    attendanceStatus: normalizeAttendanceStatus(
      row.attendance_status ? String(row.attendance_status) : null,
    ),
  }));
}

export async function approveLeaveRequest(profile: AppUserProfile, leaveId: string): Promise<void> {
  const { userId } = getRPCContext(profile);
  const { error } = await supabase.rpc('approve_leave_request', {
    p_leave_id: leaveId,
    p_approver_id: userId,
  });

  if (error) {
    throw error;
  }
}

export async function rejectLeaveRequest(profile: AppUserProfile, leaveId: string): Promise<void> {
  const { userId } = getRPCContext(profile);
  const { error } = await supabase.rpc('reject_leave_request', {
    p_leave_id: leaveId,
    p_approver_id: userId,
  });

  if (error) {
    throw error;
  }
}
