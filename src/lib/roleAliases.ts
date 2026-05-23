import type { AppRole } from '../types/app';

export function isDeliveryRole(role: AppRole | null | undefined): role is 'delivery_agent' | 'delivery_boy' {
  return role === 'delivery_agent' || role === 'delivery_boy';
}

export function isFieldTechnicianRole(
  role: AppRole | null | undefined,
): role is 'field_technician' | 'service_boy' {
  return role === 'field_technician' || role === 'service_boy';
}

export function isServiceRole(
  role: AppRole | null | undefined,
): role is 'ac_technician' | 'pest_control_technician' | 'delivery_agent' | 'delivery_boy' | 'field_technician' | 'service_boy' {
  return (
    role === 'ac_technician' ||
    role === 'pest_control_technician' ||
    isDeliveryRole(role) ||
    isFieldTechnicianRole(role)
  );
}

export function normalizeAppRole(role: string | null | undefined): AppRole | null | 'unknown' {
  if (!role) {
    return null;
  }

  if (role === 'delivery_boy') {
    return 'delivery_agent';
  }

  if (role === 'service_boy') {
    return 'field_technician';
  }

  const supportedRoles = new Set<AppRole>([
    'admin',
    'company_md',
    'company_hod',
    'account',
    'delivery_agent',
    'delivery_boy',
    'buyer',
    'supplier',
    'vendor',
    'security_guard',
    'security_supervisor',
    'society_manager',
    'field_technician',
    'service_boy',
    'resident',
    'storekeeper',
    'site_supervisor',
    'super_admin',
    'ac_technician',
    'pest_control_technician',
    'employee',
  ]);

  return supportedRoles.has(role as AppRole) ? (role as AppRole) : 'unknown';
}
