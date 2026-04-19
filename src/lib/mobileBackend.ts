import { isStagingAutomationEnabled } from './stagingAutomation';
import { supabase } from './supabase';
import type { AppUserProfile } from '../types/app';
import type {
  GuardChecklistItem,
  GuardLocationSnapshot,
  GuardSosType,
  GuardVisitorEntry,
} from '../types/guard';
import type { OversightAlertRecord, OversightGuardRecord, OversightVisitorGateStat } from '../types/oversight';
import type { ResidentPendingVisitor } from '../types/resident';

const VISITOR_MEDIA_BUCKET = 'visitor-photos';
const GUARD_SECURE_MEDIA_BUCKET = 'guard-secure-media';
const ATTENDANCE_SELFIES_BUCKET = 'attendance-selfies';
const CHECKLIST_EVIDENCE_BUCKET = 'checklist-evidence';

function parseDataUri(uri: string) {
  const match = uri.match(/^data:([^;]+);base64,(.+)$/);

  if (!match) {
    return null;
  }

  return {
    base64: match[2],
    contentType: match[1],
  };
}

function decodeBase64(base64: string) {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function createUploadName(prefix: string, uri: string, contentType: string) {
  const safePrefix = prefix.replace(/^\/+|\/+$/g, '');
  const extensionFromType = contentType.split('/')[1]?.toLowerCase();
  const extensionFromUri = uri.split('.').pop()?.toLowerCase();
  const extension = extensionFromType || extensionFromUri || 'jpg';

  return `${safePrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function parseStorageRef(value: string | null) {
  if (!value) {
    return null;
  }

  if (isHttpUrl(value)) {
    return null;
  }

  const normalized = value.replace(/^storage:\/\//, '');
  const slashIndex = normalized.indexOf('/');

  if (slashIndex <= 0) {
    return {
      bucket: VISITOR_MEDIA_BUCKET,
      path: normalized,
    };
  }

  return {
    bucket: normalized.slice(0, slashIndex),
    path: normalized.slice(slashIndex + 1),
  };
}

async function createSignedMediaUrl(value: string | null) {
  if (!value) {
    return null;
  }

  if (isHttpUrl(value)) {
    return value;
  }

  const ref = parseStorageRef(value);

  if (!ref) {
    return null;
  }

  const { data, error } = await supabase.storage.from(ref.bucket).createSignedUrl(ref.path, 60 * 60);

  if (error) {
    return null;
  }

  return data.signedUrl;
}

async function uploadPrivateImage(options: {
  bucket: string;
  prefix: string;
  uri: string | null;
}) {
  if (!options.uri) {
    return null;
  }

  const sourceUri = options.uri;

  const parsedDataUri = parseDataUri(sourceUri);

  if (parsedDataUri) {
    if (isStagingAutomationEnabled()) {
      return null;
    }

    const path = createUploadName(options.prefix, sourceUri, parsedDataUri.contentType);
    const bytes = decodeBase64(parsedDataUri.base64);
    const { error } = await supabase.storage.from(options.bucket).upload(path, bytes, {
      contentType: parsedDataUri.contentType,
      upsert: false,
    });

    if (error) {
      throw error;
    }

    return `${options.bucket}/${path}`;
  }

  const blob = await (async () => {
    if (/^https?:\/\//i.test(sourceUri)) {
      const response = await fetch(sourceUri);
      return response.blob();
    }

    return new Promise<Blob>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.onerror = () => reject(new Error('Photo file could not be read.'));
      request.onload = () => resolve(request.response as Blob);
      request.responseType = 'blob';
      request.open('GET', sourceUri, true);
      request.send();
    });
  })();
  const path = createUploadName(options.prefix, sourceUri, blob.type || 'image/jpeg');

  const { error } = await supabase.storage.from(options.bucket).upload(path, blob, {
    contentType: blob.type || 'image/jpeg',
    upsert: false,
  });

  if (error) {
    throw error;
  }

  return `${options.bucket}/${path}`;
}

function throwIfError(error: Error | null) {
  if (error) {
    throw error;
  }
}

function toIsoDate(value = new Date()) {
  return value.toISOString().split('T')[0];
}

function calculateHourDelta(start: string | null, end: string | null) {
  if (!start || !end) {
    return null;
  }

  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) {
    return null;
  }

  return Number(((endTime - startTime) / (1000 * 60 * 60)).toFixed(2));
}

function normalizeApprovalStatus(options: {
  approvalStatus?: string | null;
  approvedByResident?: boolean | null;
  approvalDeadlineAt?: string | null;
  exitTime?: string | null;
}) {
  if (options.exitTime) {
    return 'checked_out' as const;
  }

  if (options.approvalStatus) {
    if (options.approvalStatus === 'approved' || options.approvalStatus === 'denied') {
      return options.approvalStatus;
    }

    if (options.approvalStatus === 'timed_out' || options.approvalStatus === 'timeout') {
      return 'timed_out';
    }
  }

  if (options.approvedByResident === true) {
    return 'approved' as const;
  }

  if (options.approvedByResident === false) {
    return 'denied' as const;
  }

  if (
    options.approvalDeadlineAt &&
    new Date(options.approvalDeadlineAt).getTime() < Date.now()
  ) {
    return 'timed_out' as const;
  }

  return 'pending' as const;
}

function normalizeAlertType(value: string | null | undefined) {
  if (value === 'panic' || value === 'inactivity' || value === 'geo_fence_breach') {
    return value;
  }

  return 'inactivity';
}

function normalizeAlertStatus(value: string | null | undefined) {
  if (value === 'active' || value === 'acknowledged' || value === 'resolved') {
    return value;
  }

  return 'active';
}

function normalizeGuardStatus(value: string | null | undefined) {
  if (value === 'on_duty' || value === 'off_duty' || value === 'offline' || value === 'breach') {
    return value;
  }

  return 'offline';
}

function normalizeChecklistInputType(value: string | null | undefined) {
  return value === 'numeric' ? 'numeric' : 'yes_no';
}

export function isPreviewProfile(profile: AppUserProfile | null) {
  return profile?.userId.startsWith('dev-preview-') ?? false;
}

export interface ResidentDestination {
  flatId: string;
  flatLabel: string;
  residentId: string | null;
  residentName: string | null;
  residentPhone: string | null;
}

export async function searchResidentDestinations(query: string) {
  const { data, error } = await supabase.rpc('search_resident_destinations', {
    p_search: query.trim(),
  });

  throwIfError(error);

  return ((data ?? []) as Array<Record<string, string | null>>).map((item) => ({
    flatId: item.flat_id ?? '',
    flatLabel: item.flat_label ?? 'Unknown flat',
    residentId: item.resident_id,
    residentName: item.resident_name,
    residentPhone: item.resident_phone,
  })) satisfies ResidentDestination[];
}

export async function recordGuardGpsTracking(input: {
  profile: AppUserProfile | null;
  location: GuardLocationSnapshot;
  batteryLevel?: number | null;
}) {
  const employeeId = input.profile?.employeeId ?? null;

  if (isPreviewProfile(input.profile) || !employeeId) {
    return { synced: false };
  }

  const { error } = await supabase.from('gps_tracking').insert({
    employee_id: employeeId,
    latitude: input.location.latitude,
    longitude: input.location.longitude,
    tracked_at: input.location.capturedAt,
    battery_level: input.batteryLevel ?? null,
    accuracy_meters: null,
    is_mock_location: false,
    speed_kmh: null,
    heading_degrees: null,
  });

  throwIfError(error);
  return { synced: true };
}

export async function recordGuardAttendanceAction(input: {
  action: 'check-in' | 'check-out';
  profile: AppUserProfile | null;
  location: GuardLocationSnapshot;
  photoUri: string;
}) {
  const employeeId = input.profile?.employeeId ?? null;

  if (isPreviewProfile(input.profile) || !employeeId) {
    return { synced: false };
  }

  const selfiePath = await uploadPrivateImage({
    bucket: ATTENDANCE_SELFIES_BUCKET,
    prefix: `guard-attendance/${employeeId}`,
    uri: input.photoUri,
  });

  const logDate = toIsoDate();
  const now = new Date().toISOString();

  const { data: existingRow, error: existingError } = await supabase
    .from('attendance_logs')
    .select(
      'id, check_in_time, check_out_time, check_in_location_id, check_out_location_id, check_in_latitude, check_in_longitude, check_out_latitude, check_out_longitude, check_in_selfie_url',
    )
    .eq('employee_id', employeeId)
    .eq('log_date', logDate)
    .maybeSingle();

  throwIfError(existingError);

  const checkInTime =
    input.action === 'check-in' ? now : typeof existingRow?.check_in_time === 'string' ? existingRow.check_in_time : null;
  const checkOutTime =
    input.action === 'check-out' ? now : typeof existingRow?.check_out_time === 'string' ? existingRow.check_out_time : null;

  const payload = {
    employee_id: employeeId,
    log_date: logDate,
    check_in_time: checkInTime,
    check_out_time: checkOutTime,
    check_in_location_id:
      input.action === 'check-in'
        ? input.profile?.assignedLocation?.id ?? null
        : existingRow?.check_in_location_id ?? null,
    check_out_location_id:
      input.action === 'check-out'
        ? input.profile?.assignedLocation?.id ?? null
        : existingRow?.check_out_location_id ?? null,
    check_in_latitude:
      input.action === 'check-in' ? input.location.latitude : existingRow?.check_in_latitude ?? null,
    check_in_longitude:
      input.action === 'check-in' ? input.location.longitude : existingRow?.check_in_longitude ?? null,
    check_out_latitude:
      input.action === 'check-out' ? input.location.latitude : existingRow?.check_out_latitude ?? null,
    check_out_longitude:
      input.action === 'check-out' ? input.location.longitude : existingRow?.check_out_longitude ?? null,
    check_in_selfie_url:
      input.action === 'check-in' ? selfiePath : existingRow?.check_in_selfie_url ?? selfiePath,
    total_hours: calculateHourDelta(checkInTime, checkOutTime),
    status: 'present',
  };

  if (existingRow?.id) {
    const { error } = await supabase.from('attendance_logs').update(payload).eq('id', existingRow.id);
    throwIfError(error);
  } else {
    const { error } = await supabase.from('attendance_logs').insert(payload);
    throwIfError(error);
  }

  return { synced: true, selfiePath };
}

export async function createGuardVisitorEntry(input: {
  visitorName: string;
  phone: string;
  purpose: string;
  flatId: string;
  vehicleNumber: string;
  photoUri: string | null;
  isFrequentVisitor: boolean;
}) {
  const photoPath = await uploadPrivateImage({
    bucket: VISITOR_MEDIA_BUCKET,
    prefix: `gate-entry/${input.flatId}`,
    uri: input.photoUri,
  });

  const { data, error } = await supabase.rpc('create_mobile_visitor', {
    p_flat_id: input.flatId,
    p_is_frequent_visitor: input.isFrequentVisitor,
    p_phone: input.phone,
    p_photo_url: photoPath,
    p_purpose: input.purpose,
    p_vehicle_number: input.vehicleNumber || null,
    p_visitor_name: input.visitorName,
    p_visitor_type: 'guest',
  });

  throwIfError(error);
  return data as { success?: boolean; visitor_id?: string; error?: string } | null;
}

export async function fetchGuardVisitors(includeCheckedOut = true) {
  const { data, error } = await supabase.rpc('get_guard_visitors', {
    p_include_checked_out: includeCheckedOut,
  });

  throwIfError(error);

  const rows = (data ?? []) as Array<Record<string, string | boolean | null>>;

  return Promise.all(
    rows.map(async (row): Promise<GuardVisitorEntry> => ({
      id: String(row.id),
      backendId: String(row.id),
      name: row.visitor_name ? String(row.visitor_name) : 'Visitor',
      phone: row.phone ? String(row.phone) : '',
      purpose: row.purpose ? String(row.purpose) : 'General visit',
      destination: row.flat_label ? String(row.flat_label) : row.resident_name ? String(row.resident_name) : 'Destination pending',
      flatId: row.flat_id ? String(row.flat_id) : null,
      residentId: row.resident_id ? String(row.resident_id) : null,
      vehicleNumber: row.vehicle_number ? String(row.vehicle_number) : '',
      photoUri: null,
      photoUrl: await createSignedMediaUrl(row.photo_url ? String(row.photo_url) : null),
      recordedAt: row.entry_time ? String(row.entry_time) : new Date().toISOString(),
      status: row.exit_time ? 'checked_out' : 'inside',
      frequentVisitor: Boolean(row.is_frequent_visitor),
      approvalStatus: normalizeApprovalStatus({
        approvalDeadlineAt: row.approval_deadline_at ? String(row.approval_deadline_at) : null,
        approvalStatus: row.approval_status ? String(row.approval_status) : null,
        approvedByResident:
          typeof row.approved_by_resident === 'boolean' ? row.approved_by_resident : null,
        exitTime: row.exit_time ? String(row.exit_time) : null,
      }),
      approvalDeadlineAt: row.approval_deadline_at ? String(row.approval_deadline_at) : null,
      decisionAt: row.decision_at ? String(row.decision_at) : null,
    })),
  );
}

export async function checkoutGuardVisitor(visitorId: string, userId: string) {
  const { data, error } = await supabase.rpc('checkout_visitor', {
    p_user_id: userId,
    p_visitor_id: visitorId,
  });

  throwIfError(error);
  return data as { success?: boolean; error?: string } | null;
}

export async function startGuardPanicAlert(input: {
  alertType: GuardSosType;
  note: string;
  location: GuardLocationSnapshot | null;
  photoUri: string | null;
}) {
  const photoPath = await uploadPrivateImage({
    bucket: GUARD_SECURE_MEDIA_BUCKET,
    prefix: `panic-alerts/${new Date().toISOString().slice(0, 10)}`,
    uri: input.photoUri,
  });

  const { data, error } = await supabase.rpc('start_mobile_panic_alert', {
    p_alert_type: input.alertType,
    p_description: input.note || null,
    p_latitude: input.location?.latitude ?? null,
    p_longitude: input.location?.longitude ?? null,
    p_metadata: input.location
      ? {
          captured_at: input.location.capturedAt,
          distance_from_assigned_site: input.location.distanceFromAssignedSite,
          within_geo_fence: input.location.withinGeoFence,
        }
      : {},
    p_photo_url: photoPath,
  });

  throwIfError(error);
  return data as { success?: boolean; alert_id?: string; error?: string } | null;
}

export async function fetchResidentPendingVisitors() {
  const { data, error } = await supabase.rpc('get_resident_pending_visitors');

  throwIfError(error);

  const rows = (data ?? []) as Array<Record<string, string | boolean | null>>;

  return Promise.all(
    rows.map(async (row): Promise<ResidentPendingVisitor> => ({
      id: String(row.id),
      visitorName: row.visitor_name ? String(row.visitor_name) : 'Visitor',
      phone: row.phone ? String(row.phone) : '',
      purpose: row.purpose ? String(row.purpose) : 'General visit',
      flatId: row.flat_id ? String(row.flat_id) : null,
      flatLabel: row.flat_label ? String(row.flat_label) : 'My flat',
      vehicleNumber: row.vehicle_number ? String(row.vehicle_number) : '',
      photoUrl: await createSignedMediaUrl(row.photo_url ? String(row.photo_url) : null),
      entryTime: row.entry_time ? String(row.entry_time) : new Date().toISOString(),
      approvalStatus: normalizeApprovalStatus({
        approvalDeadlineAt: row.approval_deadline_at ? String(row.approval_deadline_at) : null,
        approvalStatus: row.approval_status ? String(row.approval_status) : null,
      }) as ResidentPendingVisitor['approvalStatus'],
      approvalDeadlineAt: row.approval_deadline_at ? String(row.approval_deadline_at) : null,
      isFrequentVisitor: Boolean(row.is_frequent_visitor),
      rejectionReason: row.rejection_reason ? String(row.rejection_reason) : null,
    })),
  );
}

export async function approveResidentVisitor(visitorId: string, userId: string) {
  const { data, error } = await supabase.rpc('approve_visitor', {
    p_user_id: userId,
    p_visitor_id: visitorId,
  });

  throwIfError(error);
  return data as { success?: boolean; error?: string } | null;
}

export async function denyResidentVisitor(visitorId: string, userId: string, reason: string) {
  const { data, error } = await supabase.rpc('deny_visitor', {
    p_reason: reason,
    p_user_id: userId,
    p_visitor_id: visitorId,
  });

  throwIfError(error);
  return data as { success?: boolean; error?: string } | null;
}

export async function setResidentFrequentVisitor(visitorId: string, isFrequent: boolean) {
  const { data, error } = await supabase.rpc('set_resident_frequent_visitor', {
    p_is_frequent: isFrequent,
    p_visitor_id: visitorId,
  });

  throwIfError(error);
  return data as { success?: boolean; error?: string } | null;
}

export async function fetchOversightLiveGuards() {
  const { data, error } = await supabase.rpc('get_oversight_live_guards');

  throwIfError(error);

  return ((data ?? []) as Array<Record<string, string | number | null>>).map((row) => ({
    id: String(row.id),
    guardName: row.guard_name ? String(row.guard_name) : 'Guard',
    guardCode: row.guard_code ? String(row.guard_code) : 'N/A',
    assignedLocationName: row.assigned_location_name ? String(row.assigned_location_name) : 'Location pending',
    status: normalizeGuardStatus(row.status ? String(row.status) : null),
    lastSeenAt: row.last_seen_at ? String(row.last_seen_at) : new Date().toISOString(),
    checklistCompleted: typeof row.checklist_completed === 'number' ? row.checklist_completed : 0,
    checklistTotal: typeof row.checklist_total === 'number' ? row.checklist_total : 0,
    currentShiftLabel: row.current_shift_label ? String(row.current_shift_label) : 'Current shift',
    latitude: typeof row.latitude === 'number' ? row.latitude : null,
    longitude: typeof row.longitude === 'number' ? row.longitude : null,
    visitorsHandledToday:
      typeof row.visitors_handled_today === 'number' ? row.visitors_handled_today : 0,
  })) satisfies OversightGuardRecord[];
}

export async function fetchOversightAlertFeed() {
  const { data, error } = await supabase.rpc('get_oversight_alert_feed');

  throwIfError(error);

  return ((data ?? []) as Array<Record<string, string | null>>).map((row) => ({
    id: String(row.id),
    guardId: row.guard_id ? String(row.guard_id) : '',
    guardName: row.guard_name ? String(row.guard_name) : 'Guard',
    locationName: row.location_name ? String(row.location_name) : 'Location pending',
    alertType: normalizeAlertType(row.alert_type ? String(row.alert_type) : null),
    status: normalizeAlertStatus(row.status ? String(row.status) : null),
    createdAt: row.created_at ? String(row.created_at) : new Date().toISOString(),
    note: row.note ? String(row.note) : 'No notes attached.',
  })) satisfies OversightAlertRecord[];
}

export async function fetchOversightVisitorStats() {
  const { data, error } = await supabase.rpc('get_oversight_visitor_stats');

  throwIfError(error);

  return ((data ?? []) as Array<Record<string, string | number | null>>).map((row) => ({
    id: String(row.id),
    gateName: row.gate_name ? String(row.gate_name) : 'Gate',
    visitorsToday: typeof row.visitors_today === 'number' ? row.visitors_today : 0,
    visitorsThisWeek: typeof row.visitors_this_week === 'number' ? row.visitors_this_week : 0,
    pendingApprovals: typeof row.pending_approvals === 'number' ? row.pending_approvals : 0,
    deliveryVehicles: typeof row.delivery_vehicles === 'number' ? row.delivery_vehicles : 0,
  })) satisfies OversightVisitorGateStat[];
}

export async function acknowledgeMobilePanicAlert(alertId: string, notes?: string) {
  const { data, error } = await supabase.rpc('acknowledge_mobile_panic_alert', {
    p_alert_id: alertId,
    p_notes: notes ?? null,
  });

  throwIfError(error);
  return data as { success?: boolean; error?: string } | null;
}

export async function resolveMobilePanicAlert(alertId: string, notes?: string) {
  const { data, error } = await supabase.rpc('resolve_mobile_panic_alert', {
    p_alert_id: alertId,
    p_notes: notes ?? null,
  });

  throwIfError(error);
  return data as { success?: boolean; error?: string } | null;
}

export async function fetchGuardChecklistItems() {
  const { data, error } = await supabase.rpc('get_guard_checklist_items');

  throwIfError(error);

  const rows = (data ?? []) as Array<Record<string, string | boolean | number | null>>;

  return Promise.all(
    rows.map(async (row): Promise<GuardChecklistItem> => ({
      id: String(row.master_item_id),
      masterItemId: row.master_item_id ? String(row.master_item_id) : null,
      checklistId: row.checklist_id ? String(row.checklist_id) : null,
      title: row.title ? String(row.title) : 'Checklist item',
      description: row.description ? String(row.description) : '',
      requiredEvidence: Boolean(row.required_evidence),
      inputType: normalizeChecklistInputType(row.input_type ? String(row.input_type) : null),
      numericValue:
        row.input_type === 'numeric' && row.response_value ? String(row.response_value) : '',
      numericUnitLabel: row.numeric_unit_label ? String(row.numeric_unit_label) : null,
      numericMinValue:
        typeof row.numeric_min_value === 'number' ? row.numeric_min_value : null,
      numericMaxValue:
        typeof row.numeric_max_value === 'number' ? row.numeric_max_value : null,
      requiresSupervisorOverride: Boolean(row.requires_supervisor_override),
      responseValue: row.response_value ? String(row.response_value) : null,
      status: row.status === 'completed' ? 'completed' : 'pending',
      completedAt: row.submitted_at ? String(row.submitted_at) : null,
      evidenceUri: await createSignedMediaUrl(row.evidence_url ? String(row.evidence_url) : null),
    })),
  );
}

export async function submitGuardChecklist(items: GuardChecklistItem[]) {
  if (!items.length) {
    throw new Error('Checklist items are required');
  }

  const checklistId = items.find((item) => item.checklistId)?.checklistId;

  if (!checklistId) {
    throw new Error('Checklist ID is missing for the current checklist');
  }

  const responses = await Promise.all(
    items.map(async (item) => ({
      master_item_id: item.masterItemId,
      value:
        item.inputType === 'numeric'
          ? item.numericValue
          : item.responseValue ?? (item.status === 'completed' ? 'yes' : 'no'),
      evidence_url:
        item.evidenceUri && !isHttpUrl(item.evidenceUri)
          ? await uploadPrivateImage({
              bucket: CHECKLIST_EVIDENCE_BUCKET,
              prefix: `checklist-evidence/${checklistId}`,
              uri: item.evidenceUri,
            })
          : item.evidenceUri,
    })),
  );

  const { data, error } = await supabase.rpc('submit_mobile_guard_checklist', {
    p_checklist_id: checklistId,
    p_is_complete: true,
    p_responses: responses,
  });

  throwIfError(error);
  return data as { success?: boolean; error?: string } | null;
}
