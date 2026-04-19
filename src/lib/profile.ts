import type { AppRole, AppUserProfile, GeoCalibrationRecord, LocationSummary } from '../types/app';
import { supabase } from './supabase';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asRole(value: string | null | undefined): AppRole | null {
  if (!value) {
    return null;
  }

  return value as AppRole;
}

function normalizeRoleRelation(relation: unknown): AppRole | null {
  if (Array.isArray(relation)) {
    const firstRole = relation[0] as { role_name?: string } | undefined;
    return asRole(firstRole?.role_name);
  }

  if (isObject(relation)) {
    return asRole(typeof relation.role_name === 'string' ? relation.role_name : null);
  }

  return null;
}

function normalizePreferences(value: unknown) {
  return isObject(value) ? value : {};
}

type EmployeeRow = {
  employee_code: string;
  first_name: string;
  id: string;
  last_name: string;
  photo_url: string | null;
  phone: string | null;
};

function buildPhoneCandidates(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, '');
  const candidates = new Set<string>();

  if (trimmed) {
    candidates.add(trimmed);
  }

  if (digits) {
    candidates.add(digits);
  }

  if (digits.length >= 10) {
    const lastTen = digits.slice(-10);
    candidates.add(lastTen);
    candidates.add(`+91${lastTen}`);
  }

  return [...candidates];
}

async function findEmployeeByPhone(phone: string | null | undefined): Promise<EmployeeRow | null> {
  for (const candidate of buildPhoneCandidates(phone)) {
    const { data, error } = await supabase
      .from('employees')
      .select('id, employee_code, first_name, last_name, photo_url, phone')
      .eq('phone', candidate)
      .limit(1);

    if (error) {
      continue;
    }

    if (data?.[0]) {
      return data[0] as EmployeeRow;
    }
  }

  return null;
}

async function findEmployeeByEmail(email: string | null | undefined): Promise<EmployeeRow | null> {
  if (!email?.trim()) {
    return null;
  }

  const { data, error } = await supabase
    .from('employees')
    .select('id, employee_code, first_name, last_name, photo_url, phone')
    .ilike('email', email.trim())
    .limit(1);

  if (error) {
    return null;
  }

  return (data?.[0] as EmployeeRow | undefined) ?? null;
}

async function findEmployeeByName(fullName: string | null | undefined): Promise<EmployeeRow | null> {
  if (!fullName?.trim()) {
    return null;
  }

  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length < 2) {
    return null;
  }

  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');

  const { data, error } = await supabase
    .from('employees')
    .select('id, employee_code, first_name, last_name, photo_url, phone')
    .ilike('first_name', firstName)
    .ilike('last_name', lastName)
    .limit(1);

  if (error) {
    return null;
  }

  return (data?.[0] as EmployeeRow | undefined) ?? null;
}

async function findEmployeeFallback(options: {
  email?: string | null;
  fullName?: string | null;
  phone?: string | null;
}) {
  return (
    (await findEmployeeByPhone(options.phone)) ??
    (await findEmployeeByEmail(options.email)) ??
    (await findEmployeeByName(options.fullName)) ??
    null
  );
}

function mapLocation(row: {
  address: string | null;
  geo_fence_radius: number | null;
  id: string;
  latitude: number | null;
  location_name: string;
  location_type: string | null;
  longitude: number | null;
}): LocationSummary {
  return {
    id: row.id,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    locationName: row.location_name,
    locationType: row.location_type,
    geoFenceRadius: row.geo_fence_radius ?? 50,
  };
}

export async function fetchCompanyLocations(): Promise<LocationSummary[]> {
  const { data, error } = await supabase
    .from('company_locations')
    .select('id, address, latitude, longitude, location_name, location_type, geo_fence_radius')
    .eq('is_active', true)
    .order('location_name');

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapLocation);
}

export async function fetchCurrentAppProfile(): Promise<AppUserProfile | null> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: userRow } = await supabase
    .from('users')
    .select('id, employee_id, email, full_name, is_active, phone, preferences, roles!inner(role_name)')
    .eq('id', user.id)
    .maybeSingle();

  let employeeRow: EmployeeRow | null = null;

  if (userRow?.employee_id) {
    const { data } = await supabase
      .from('employees')
      .select('id, employee_code, first_name, last_name, photo_url, phone')
      .eq('id', userRow.employee_id)
      .maybeSingle();

    employeeRow = data;
  } else {
    employeeRow = await findEmployeeFallback({
      phone: userRow?.phone ?? user.phone ?? null,
      email: typeof userRow?.email === 'string' ? userRow.email : user.email ?? null,
      fullName: userRow?.full_name ?? user.user_metadata?.full_name ?? null,
    });
  }

  let guardRow:
    | {
        assigned_location_id: string | null;
        guard_code: string;
        id: string;
      }
    | null = null;

  if (employeeRow?.id) {
    const { data } = await supabase
      .from('security_guards')
      .select('id, guard_code, assigned_location_id')
      .eq('employee_id', employeeRow.id)
      .maybeSingle();

    guardRow = data;
  }

  let assignedLocation: LocationSummary | null = null;

  if (guardRow?.assigned_location_id) {
    const { data } = await supabase
      .from('company_locations')
      .select('id, address, latitude, longitude, location_name, location_type, geo_fence_radius')
      .eq('id', guardRow.assigned_location_id)
      .maybeSingle();

    if (data) {
      assignedLocation = mapLocation(data);
    }
  }

  const derivedFullName =
    userRow?.full_name ??
    [employeeRow?.first_name, employeeRow?.last_name].filter(Boolean).join(' ').trim() ??
    null;

  const role = normalizeRoleRelation(userRow?.roles) ?? (guardRow ? 'security_guard' : 'employee');

  return {
    userId: user.id,
    session: null,
    role,
    fullName: derivedFullName || null,
    phone: userRow?.phone ?? employeeRow?.phone ?? user.phone ?? null,
    isActive: userRow?.is_active !== false,
    preferences: normalizePreferences(userRow?.preferences),
    employeeId: employeeRow?.id ?? userRow?.employee_id ?? null,
    employeeCode: employeeRow?.employee_code ?? null,
    employeePhotoUrl: employeeRow?.photo_url ?? null,
    guardId: guardRow?.id ?? null,
    guardCode: guardRow?.guard_code ?? null,
    assignedLocation,
  };
}

async function fileUriToBlob(uri: string) {
  if (/^https?:\/\//i.test(uri)) {
    const response = await fetch(uri);
    return response.blob();
  }

  return new Promise<Blob>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.onerror = () => reject(new Error('Profile photo file could not be read.'));
    request.onload = () => resolve(request.response as Blob);
    request.responseType = 'blob';
    request.open('GET', uri, true);
    request.send();
  });
}

function inferFileExtension(uri: string, mimeType?: string) {
  const fromMime = mimeType?.split('/')[1]?.toLowerCase();

  if (fromMime) {
    return fromMime === 'jpeg' ? 'jpg' : fromMime;
  }

  const fromUri = uri.split('.').pop()?.toLowerCase();
  return fromUri || 'jpg';
}

export async function updateEmployeeProfilePhoto(employeeId: string, photoPath: string) {
  const { error } = await supabase
    .from('employees')
    .update({
      photo_url: photoPath,
    })
    .eq('id', employeeId);

  if (error) {
    throw error;
  }
}

export async function uploadProfilePhoto(
  employeeId: string,
  uri: string,
  mimeType?: string,
) {
  const fileExtension = inferFileExtension(uri, mimeType);
  const filePath = `profiles/${employeeId}-${Date.now()}.${fileExtension}`;
  const fileBody = await fileUriToBlob(uri);

  const { error: uploadError } = await supabase.storage
    .from('attendance-selfies')
    .upload(filePath, fileBody, {
      contentType: mimeType ?? `image/${fileExtension}`,
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  await updateEmployeeProfilePhoto(employeeId, filePath);
  return filePath;
}

export async function saveGeoCalibrationToProfile(
  userId: string,
  calibration: GeoCalibrationRecord,
) {
  try {
    const { data: currentUser, error: readError } = await supabase
      .from('users')
      .select('preferences')
      .eq('id', userId)
      .maybeSingle();

    if (readError) {
      throw readError;
    }

    const nextPreferences = {
      ...normalizePreferences(currentUser?.preferences),
      mobileGeoCalibration: calibration,
    };

    const { error: updateError } = await supabase
      .from('users')
      .update({
        preferences: nextPreferences,
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    return true;
  } catch {
    return false;
  }
}
