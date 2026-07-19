import type { AppRole } from '../types/app';

export const MOBILE_PRD_ROLES = new Set<AppRole>([
  'security_guard',
  'resident',
  'security_supervisor',
  'society_manager',
  'employee',
  'buyer',
  'supplier',
  'vendor',
  'delivery_agent',
  'delivery_boy',
  'field_technician',
  'service_boy',
  'ac_technician',
  'pest_control_technician',
]);

export function isPrdMobileRole(role: AppRole | null | undefined): role is AppRole {
  return role != null && MOBILE_PRD_ROLES.has(role);
}
