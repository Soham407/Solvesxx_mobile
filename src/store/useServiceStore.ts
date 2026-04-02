import { create } from 'zustand';

import { loadServiceState, saveServiceState } from '../lib/serviceStorage';
import type { AppUserProfile } from '../types/app';
import type {
  ServiceAttendanceEntry,
  ServiceMaterialRequest,
  ServicePersistedState,
  ServicePPEItem,
  ServiceProofStage,
  ServiceRole,
  ServiceTaskRecord,
} from '../types/service';

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isServiceRole(role: AppUserProfile['role']): role is ServiceRole {
  return (
    role === 'ac_technician' ||
    role === 'pest_control_technician' ||
    role === 'delivery_boy' ||
    role === 'service_boy'
  );
}

function getServiceRole(profile: AppUserProfile | null): ServiceRole {
  const role = profile?.role ?? null;
  return isServiceRole(role) ? role : 'service_boy';
}

function createPPEChecklist(role: ServiceRole): ServicePPEItem[] {
  if (role !== 'pest_control_technician') {
    return [];
  }

  return [
    { id: 'mask', label: 'Mask', required: true, checked: false },
    { id: 'gloves', label: 'Gloves', required: true, checked: false },
    { id: 'eye-protection', label: 'Eye protection', required: true, checked: false },
    { id: 'apron', label: 'Apron', required: true, checked: false },
  ];
}

function createDefaultTasks(profile: AppUserProfile | null, role: ServiceRole): ServiceTaskRecord[] {
  const locationName = profile?.assignedLocation?.locationName ?? 'Preview Tower';
  const now = Date.now();

  if (role === 'ac_technician') {
    return [
      {
        id: 'service-task-ac-1',
        role,
        taskType: 'ac_service',
        referenceCode: 'WO-AC-304',
        title: 'AC not cooling - Wing B, Flat 304',
        description: 'Inspect indoor unit airflow, coolant line pressure, and thermostat response.',
        locationName,
        unitLabel: 'Cassette AC',
        priority: 'high',
        status: 'assigned',
        assignedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
        scheduledFor: new Date(now + 30 * 60 * 1000).toISOString(),
        startedAt: null,
        completedAt: null,
        beforePhotoUri: null,
        afterPhotoUri: null,
        deliveryProofUri: null,
        requiresBeforeAfterPhotos: true,
        requiresDeliveryProof: false,
        requiresResidentNotification: false,
        residentNotificationSentAt: null,
        notes: 'Resident reported weak airflow since the morning shift.',
      },
      {
        id: 'service-task-ac-2',
        role,
        taskType: 'ac_service',
        referenceCode: 'WO-AC-287',
        title: 'Clubhouse AHU filter cleaning',
        description: 'Replace clogged filter media and record before/after evidence for AMC history.',
        locationName,
        unitLabel: 'AHU',
        priority: 'medium',
        status: 'in_progress',
        assignedAt: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
        scheduledFor: new Date(now - 60 * 60 * 1000).toISOString(),
        startedAt: new Date(now - 75 * 60 * 1000).toISOString(),
        completedAt: null,
        beforePhotoUri: 'preview://ac-before-filter',
        afterPhotoUri: null,
        deliveryProofUri: null,
        requiresBeforeAfterPhotos: true,
        requiresDeliveryProof: false,
        requiresResidentNotification: false,
        residentNotificationSentAt: null,
        notes: 'Technician has already opened the unit and logged the dirty filter state.',
      },
    ];
  }

  if (role === 'pest_control_technician') {
    return [
      {
        id: 'service-task-pest-1',
        role,
        taskType: 'pest_control',
        referenceCode: 'WO-PC-141',
        title: 'Kitchen shaft treatment - Tower A',
        description: 'Spray anti-cockroach treatment in shaft access zones and document service proof.',
        locationName,
        unitLabel: 'Tower A shafts',
        priority: 'high',
        status: 'assigned',
        assignedAt: new Date(now - 90 * 60 * 1000).toISOString(),
        scheduledFor: new Date(now + 45 * 60 * 1000).toISOString(),
        startedAt: null,
        completedAt: null,
        beforePhotoUri: null,
        afterPhotoUri: null,
        deliveryProofUri: null,
        requiresBeforeAfterPhotos: true,
        requiresDeliveryProof: false,
        requiresResidentNotification: true,
        residentNotificationSentAt: null,
        notes: 'Resident advisories should go out before the spray cycle begins.',
      },
      {
        id: 'service-task-pest-2',
        role,
        taskType: 'pest_control',
        referenceCode: 'WO-PC-137',
        title: 'Basement rodent bait inspection',
        description: 'Inspect bait stations, refresh traps, and log visible signs of infestation.',
        locationName,
        unitLabel: 'Basement parking',
        priority: 'medium',
        status: 'awaiting_material',
        assignedAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
        scheduledFor: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
        startedAt: new Date(now - 90 * 60 * 1000).toISOString(),
        completedAt: null,
        beforePhotoUri: 'preview://pest-before-basement',
        afterPhotoUri: null,
        deliveryProofUri: null,
        requiresBeforeAfterPhotos: true,
        requiresDeliveryProof: false,
        requiresResidentNotification: false,
        residentNotificationSentAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
        notes: 'Waiting for approved bait refill before closing the task.',
      },
    ];
  }

  if (role === 'delivery_boy') {
    return [
      {
        id: 'service-task-delivery-1',
        role,
        taskType: 'delivery',
        referenceCode: 'DLV-5901',
        title: 'Housekeeping consumables delivery',
        description: 'Move cartons to the service gate and confirm handoff with proof photo.',
        locationName,
        unitLabel: 'Service gate',
        priority: 'high',
        status: 'assigned',
        assignedAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
        scheduledFor: new Date(now + 20 * 60 * 1000).toISOString(),
        startedAt: null,
        completedAt: null,
        beforePhotoUri: null,
        afterPhotoUri: null,
        deliveryProofUri: null,
        requiresBeforeAfterPhotos: false,
        requiresDeliveryProof: true,
        requiresResidentNotification: false,
        residentNotificationSentAt: null,
        notes: 'CleanCare Supplies cartons for central housekeeping stores.',
      },
      {
        id: 'service-task-delivery-2',
        role,
        taskType: 'delivery',
        referenceCode: 'DLV-5898',
        title: 'Festival staffing documents handoff',
        description: 'Escort signed staffing PO pack to the admin office and update live delivery status.',
        locationName,
        unitLabel: 'Admin office',
        priority: 'medium',
        status: 'in_transit',
        assignedAt: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
        scheduledFor: new Date(now - 45 * 60 * 1000).toISOString(),
        startedAt: new Date(now - 60 * 60 * 1000).toISOString(),
        completedAt: null,
        beforePhotoUri: null,
        afterPhotoUri: null,
        deliveryProofUri: null,
        requiresBeforeAfterPhotos: false,
        requiresDeliveryProof: true,
        requiresResidentNotification: false,
        residentNotificationSentAt: null,
        notes: 'Buyer expects a delivery proof photo once the sealed file reaches the office.',
      },
    ];
  }

  return [
    {
      id: 'service-task-general-1',
      role,
      taskType: 'general_service',
      referenceCode: 'WO-SRV-208',
      title: 'Clubhouse chair alignment and cleaning',
      description: 'Reset the event layout, wipe chairs, and confirm closure with site notes.',
      locationName,
      unitLabel: 'Clubhouse',
      priority: 'medium',
      status: 'assigned',
      assignedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      scheduledFor: new Date(now + 60 * 60 * 1000).toISOString(),
      startedAt: null,
      completedAt: null,
      beforePhotoUri: null,
      afterPhotoUri: null,
      deliveryProofUri: null,
      requiresBeforeAfterPhotos: false,
      requiresDeliveryProof: false,
      requiresResidentNotification: false,
      residentNotificationSentAt: null,
      notes: 'Prepare the area before the evening committee visit.',
    },
    {
      id: 'service-task-general-2',
      role,
      taskType: 'general_service',
      referenceCode: 'WO-SRV-201',
      title: 'Utility room mop-up follow-through',
      description: 'Finish the drainage cleanup and confirm the room is ready for the next inspection.',
      locationName,
      unitLabel: 'Utility room',
      priority: 'low',
      status: 'in_progress',
      assignedAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
      scheduledFor: new Date(now - 60 * 60 * 1000).toISOString(),
      startedAt: new Date(now - 50 * 60 * 1000).toISOString(),
      completedAt: null,
      beforePhotoUri: null,
      afterPhotoUri: null,
      deliveryProofUri: null,
      requiresBeforeAfterPhotos: false,
      requiresDeliveryProof: false,
      requiresResidentNotification: false,
      residentNotificationSentAt: null,
      notes: 'Supervisor requested a same-shift closure update.',
    },
  ];
}

function createDefaultMaterialRequests(role: ServiceRole): ServiceMaterialRequest[] {
  const now = Date.now();

  if (role === 'ac_technician') {
    return [
      {
        id: 'material-ac-1',
        taskId: 'service-task-ac-2',
        label: 'Return air filter',
        quantity: 1,
        unit: 'pc',
        requestType: 'part',
        status: 'approved',
        requestedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
        approvedAt: new Date(now - 90 * 60 * 1000).toISOString(),
        note: 'Approved from AMC stock for the clubhouse AHU.',
      },
    ];
  }

  if (role === 'pest_control_technician') {
    return [
      {
        id: 'material-pest-1',
        taskId: 'service-task-pest-2',
        label: 'Rodent bait sachets',
        quantity: 4,
        unit: 'packs',
        requestType: 'chemical',
        status: 'pending_approval',
        requestedAt: new Date(now - 40 * 60 * 1000).toISOString(),
        approvedAt: null,
        note: 'Refill required to close basement rodent inspection.',
      },
    ];
  }

  if (role === 'service_boy') {
    return [
      {
        id: 'material-service-1',
        taskId: 'service-task-general-2',
        label: 'Absorbent floor pads',
        quantity: 2,
        unit: 'packs',
        requestType: 'supply',
        status: 'approved',
        requestedAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
        approvedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
        note: 'Issued from janitorial shelf stock.',
      },
    ];
  }

  return [];
}

function createDefaultState(profile: AppUserProfile | null): ServicePersistedState {
  const role = getServiceRole(profile);

  return {
    ownerUserId: profile?.userId ?? null,
    role,
    dutyStatus: 'off_duty',
    lastKnownLocation: null,
    lastSyncAt: null,
    attendanceLog: [],
    tasks: createDefaultTasks(profile, role),
    materialRequests: createDefaultMaterialRequests(role),
    ppeChecklist: createPPEChecklist(role),
  };
}

function normalizeHydratedState(
  snapshot: ServicePersistedState | null,
  profile: AppUserProfile | null,
): ServicePersistedState {
  const fallback = createDefaultState(profile);

  if (
    !snapshot ||
    snapshot.ownerUserId !== profile?.userId ||
    snapshot.role !== getServiceRole(profile)
  ) {
    return fallback;
  }

  return {
    ...fallback,
    ...snapshot,
    ownerUserId: profile?.userId ?? snapshot.ownerUserId,
    role: getServiceRole(profile),
    tasks: snapshot.tasks.length ? snapshot.tasks : fallback.tasks,
    materialRequests: snapshot.materialRequests.length
      ? snapshot.materialRequests
      : fallback.materialRequests,
    ppeChecklist: snapshot.ppeChecklist.length ? snapshot.ppeChecklist : fallback.ppeChecklist,
  };
}

function areRequiredPPEItemsComplete(items: ServicePPEItem[]) {
  return items.every((item) => !item.required || item.checked);
}

function sortTasksByAssignedAt(tasks: ServiceTaskRecord[]) {
  return [...tasks].sort(
    (left, right) => new Date(right.assignedAt).getTime() - new Date(left.assignedAt).getTime(),
  );
}

interface ServiceStore extends ServicePersistedState {
  hasHydrated: boolean;
  bootstrap: (profile: AppUserProfile | null) => Promise<void>;
  refreshWorkspace: () => Promise<void>;
  rememberLocation: (location: ServicePersistedState['lastKnownLocation']) => Promise<void>;
  checkInWithSelfie: (options: {
    location: ServicePersistedState['lastKnownLocation'];
    photoUri: string | null;
  }) => Promise<void>;
  checkOutWithSelfie: (options: {
    location: ServicePersistedState['lastKnownLocation'];
    photoUri: string | null;
  }) => Promise<void>;
  togglePPEItem: (id: string) => Promise<void>;
  submitMaterialRequest: (input: {
    taskId: string;
    label: string;
    quantity: number;
    unit: string;
    note: string;
  }) => Promise<{ submitted: boolean }>;
  markMaterialIssued: (id: string) => Promise<void>;
  attachTaskProof: (taskId: string, stage: ServiceProofStage, uri: string) => Promise<void>;
  startTask: (taskId: string) => Promise<{ started: boolean; reason?: string }>;
  advanceDeliveryTask: (taskId: string) => Promise<{ advanced: boolean; reason?: string }>;
  completeTask: (taskId: string) => Promise<{ completed: boolean; reason?: string }>;
}

function buildPersistedState(state: ServiceStore): ServicePersistedState {
  return {
    ownerUserId: state.ownerUserId,
    role: state.role,
    dutyStatus: state.dutyStatus,
    lastKnownLocation: state.lastKnownLocation,
    lastSyncAt: state.lastSyncAt,
    attendanceLog: state.attendanceLog,
    tasks: state.tasks,
    materialRequests: state.materialRequests,
    ppeChecklist: state.ppeChecklist,
  };
}

async function persistServiceStore(get: () => ServiceStore) {
  await saveServiceState(buildPersistedState(get()));
}

export const useServiceStore = create<ServiceStore>((set, get) => ({
  ...createDefaultState(null),
  hasHydrated: false,

  bootstrap: async (profile) => {
    const storedState = await loadServiceState();
    const hydratedState = normalizeHydratedState(storedState, profile);

    set({
      ...hydratedState,
      hasHydrated: true,
    });

    await saveServiceState(hydratedState);
  },

  refreshWorkspace: async () => {
    const nextPendingRequestId = get().materialRequests.find(
      (request) => request.status === 'pending_approval',
    )?.id;

    set((state) => ({
      lastSyncAt: new Date().toISOString(),
      materialRequests: state.materialRequests.map((request) =>
        request.id === nextPendingRequestId
          ? {
              ...request,
              status: 'approved',
              approvedAt: new Date().toISOString(),
            }
          : request,
      ),
      tasks: state.tasks.map((task) =>
        task.status === 'awaiting_material' &&
        state.materialRequests.some((request) => request.id === nextPendingRequestId && request.taskId === task.id)
          ? {
              ...task,
              status: 'in_progress',
            }
          : task,
      ),
    }));

    await persistServiceStore(get);
  },

  rememberLocation: async (location) => {
    set({
      lastKnownLocation: location,
    });

    await persistServiceStore(get);
  },

  checkInWithSelfie: async (options) => {
    const entry: ServiceAttendanceEntry = {
      id: createId('service-attendance'),
      action: 'check_in',
      recordedAt: new Date().toISOString(),
      photoUri: options.photoUri,
      location: options.location,
    };

    set((state) => ({
      dutyStatus: 'on_duty',
      lastKnownLocation: options.location ?? state.lastKnownLocation,
      lastSyncAt: entry.recordedAt,
      attendanceLog: [entry, ...state.attendanceLog],
    }));

    await persistServiceStore(get);
  },

  checkOutWithSelfie: async (options) => {
    const entry: ServiceAttendanceEntry = {
      id: createId('service-attendance'),
      action: 'check_out',
      recordedAt: new Date().toISOString(),
      photoUri: options.photoUri,
      location: options.location,
    };

    set((state) => ({
      dutyStatus: 'off_duty',
      lastKnownLocation: options.location ?? state.lastKnownLocation,
      lastSyncAt: entry.recordedAt,
      attendanceLog: [entry, ...state.attendanceLog],
    }));

    await persistServiceStore(get);
  },

  togglePPEItem: async (id) => {
    set((state) => ({
      ppeChecklist: state.ppeChecklist.map((item) =>
        item.id === id
          ? {
              ...item,
              checked: !item.checked,
            }
          : item,
      ),
    }));

    await persistServiceStore(get);
  },

  submitMaterialRequest: async (input) => {
    const task = get().tasks.find((entry) => entry.id === input.taskId);

    if (!task || task.status === 'completed' || task.status === 'delivered') {
      return {
        submitted: false,
      };
    }

    const quantity = Math.max(1, Math.round(input.quantity || 1));
    const requestType =
      get().role === 'ac_technician'
        ? 'part'
        : get().role === 'pest_control_technician'
          ? 'chemical'
          : 'supply';

    set((state) => ({
      lastSyncAt: new Date().toISOString(),
      materialRequests: [
        {
          id: createId('service-material'),
          taskId: input.taskId,
          label: input.label.trim(),
          quantity,
          unit: input.unit.trim() || 'units',
          requestType,
          status: 'pending_approval',
          requestedAt: new Date().toISOString(),
          approvedAt: null,
          note: input.note.trim() || null,
        },
        ...state.materialRequests,
      ],
      tasks: state.tasks.map((entry) =>
        entry.id === input.taskId &&
        entry.taskType !== 'delivery' &&
        entry.status !== 'completed' &&
        entry.status !== 'delivered'
          ? {
              ...entry,
              status: 'awaiting_material',
            }
          : entry,
      ),
    }));

    await persistServiceStore(get);
    return {
      submitted: true,
    };
  },

  markMaterialIssued: async (id) => {
    const request = get().materialRequests.find((entry) => entry.id === id);

    if (!request || request.status !== 'approved') {
      return;
    }

    set((state) => ({
      lastSyncAt: new Date().toISOString(),
      materialRequests: state.materialRequests.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              status: 'issued',
            }
          : entry,
      ),
      tasks: state.tasks.map((task) =>
        request && task.id === request.taskId && task.status === 'awaiting_material'
          ? {
              ...task,
              status: 'in_progress',
            }
          : task,
      ),
    }));

    await persistServiceStore(get);
  },

  attachTaskProof: async (taskId, stage, uri) => {
    if (get().dutyStatus !== 'on_duty') {
      return;
    }

    set((state) => ({
      lastSyncAt: new Date().toISOString(),
      tasks: state.tasks.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        if (stage === 'before') {
          return {
            ...task,
            beforePhotoUri: uri,
          };
        }

        if (stage === 'after') {
          return {
            ...task,
            afterPhotoUri: uri,
          };
        }

        return {
          ...task,
          deliveryProofUri: uri,
        };
      }),
    }));

    await persistServiceStore(get);
  },

  startTask: async (taskId) => {
    const task = get().tasks.find((entry) => entry.id === taskId);

    if (!task || task.status !== 'assigned') {
      return {
        started: false,
        reason: 'This task is not ready to start from the mobile queue.',
      };
    }

    if (get().dutyStatus !== 'on_duty') {
      return {
        started: false,
        reason: 'Complete selfie attendance before starting field work.',
      };
    }

    if (
      get().role === 'pest_control_technician' &&
      !areRequiredPPEItemsComplete(get().ppeChecklist)
    ) {
      return {
        started: false,
        reason: 'Complete the full PPE checklist before starting pest-control work.',
      };
    }

    const startedAt = new Date().toISOString();

    set((state) => ({
      lastSyncAt: startedAt,
      tasks: state.tasks.map((entry) =>
        entry.id === taskId
          ? {
              ...entry,
              status: entry.taskType === 'delivery' ? 'picked_up' : 'in_progress',
              startedAt,
              residentNotificationSentAt:
                entry.requiresResidentNotification && !entry.residentNotificationSentAt
                  ? startedAt
                  : entry.residentNotificationSentAt,
            }
          : entry,
      ),
    }));

    await persistServiceStore(get);
    return {
      started: true,
    };
  },

  advanceDeliveryTask: async (taskId) => {
    const task = get().tasks.find((entry) => entry.id === taskId);

    if (!task || task.taskType !== 'delivery') {
      return {
        advanced: false,
        reason: 'Delivery status can only be advanced on assigned delivery tasks.',
      };
    }

    if (get().dutyStatus !== 'on_duty') {
      return {
        advanced: false,
        reason: 'Complete selfie attendance before updating delivery status.',
      };
    }

    if (task.status === 'picked_up') {
      set((state) => ({
        lastSyncAt: new Date().toISOString(),
        tasks: state.tasks.map((entry) =>
          entry.id === taskId
            ? {
                ...entry,
                status: 'in_transit',
              }
            : entry,
        ),
      }));

      await persistServiceStore(get);
      return {
        advanced: true,
      };
    }

    if (task.status === 'in_transit') {
      if (task.requiresDeliveryProof && !task.deliveryProofUri) {
        return {
          advanced: false,
          reason: 'Capture delivery proof before marking this order as delivered.',
        };
      }

      const completedAt = new Date().toISOString();

      set((state) => ({
        lastSyncAt: completedAt,
        tasks: state.tasks.map((entry) =>
          entry.id === taskId
            ? {
                ...entry,
                status: 'delivered',
                completedAt,
              }
            : entry,
        ),
      }));

      await persistServiceStore(get);
      return {
        advanced: true,
      };
    }

    return {
      advanced: false,
      reason: 'This delivery is not currently waiting for a status update.',
    };
  },

  completeTask: async (taskId) => {
    const task = get().tasks.find((entry) => entry.id === taskId);

    if (!task || task.taskType === 'delivery') {
      return {
        completed: false,
        reason: 'Use the delivery flow to close delivery jobs.',
      };
    }

    if (get().dutyStatus !== 'on_duty') {
      return {
        completed: false,
        reason: 'Complete selfie attendance before closing service work.',
      };
    }

    if (task.status !== 'in_progress') {
      return {
        completed: false,
        reason:
          task.status === 'awaiting_material'
            ? 'This job is waiting on material approval or issue before it can be completed.'
            : 'Start the job before trying to complete it.',
      };
    }

    if (
      task.requiresBeforeAfterPhotos &&
      (!task.beforePhotoUri || !task.afterPhotoUri)
    ) {
      return {
        completed: false,
        reason: 'Capture both before and after proof photos before closing the job.',
      };
    }

    if (
      task.taskType === 'pest_control' &&
      !areRequiredPPEItemsComplete(get().ppeChecklist)
    ) {
      return {
        completed: false,
        reason: 'PPE must stay complete for the full pest-control workflow.',
      };
    }

    const completedAt = new Date().toISOString();

    set((state) => ({
      lastSyncAt: completedAt,
      tasks: state.tasks.map((entry) =>
        entry.id === taskId
          ? {
              ...entry,
              status: 'completed',
              completedAt,
            }
          : entry,
      ),
    }));

    await persistServiceStore(get);
    return {
      completed: true,
    };
  },
}));

export function getOrderedServiceTasks(tasks: ServiceTaskRecord[]) {
  return sortTasksByAssignedAt(tasks);
}
