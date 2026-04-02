import * as Notifications from 'expo-notifications';
import { create } from 'zustand';

import { loadNotificationState, saveNotificationState } from '../lib/notificationStorage';
import {
  buildNotificationRecord,
  createPreviewNotification,
  persistRemoteDeviceToken,
  registerForDeviceNotifications,
  schedulePreviewNotification,
} from '../lib/notifications';
import type { AppUserProfile } from '../types/app';
import type {
  NotificationPermissionStatus,
  NotificationPersistedState,
  NotificationPlatform,
  NotificationRecord,
  NotificationRoute,
} from '../types/notifications';

function createDefaultState(profile: AppUserProfile | null): NotificationPersistedState {
  return {
    ownerUserId: profile?.userId ?? null,
    ownerRole: profile?.role ?? null,
    deviceToken: null,
    devicePlatform: 'unknown',
    permissionStatus: 'undetermined',
    lastRegisteredAt: null,
    lastOpenedAt: null,
    inbox: [],
  };
}

function normalizeHydratedState(
  snapshot: NotificationPersistedState | null,
  profile: AppUserProfile | null,
): NotificationPersistedState {
  const fallback = createDefaultState(profile);

  if (
    !snapshot ||
    snapshot.ownerUserId !== profile?.userId ||
    snapshot.ownerRole !== (profile?.role ?? null)
  ) {
    return fallback;
  }

  return {
    ...fallback,
    ...snapshot,
    ownerUserId: profile?.userId ?? snapshot.ownerUserId,
    ownerRole: profile?.role ?? snapshot.ownerRole,
  };
}

function buildPersistedState(state: NotificationStore): NotificationPersistedState {
  return {
    ownerUserId: state.ownerUserId,
    ownerRole: state.ownerRole,
    deviceToken: state.deviceToken,
    devicePlatform: state.devicePlatform,
    permissionStatus: state.permissionStatus,
    lastRegisteredAt: state.lastRegisteredAt,
    lastOpenedAt: state.lastOpenedAt,
    inbox: state.inbox,
  };
}

async function persistNotificationStore(get: () => NotificationStore) {
  await saveNotificationState(buildPersistedState(get()));
}

interface NotificationStore extends NotificationPersistedState {
  hasHydrated: boolean;
  bootstrap: (profile: AppUserProfile | null) => Promise<void>;
  registerDevice: (profile: AppUserProfile | null) => Promise<void>;
  queuePreviewRoute: (route: NotificationRoute, profile: AppUserProfile | null) => Promise<void>;
  ingestDeliveredNotification: (notification: Notifications.Notification) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  ...createDefaultState(null),
  hasHydrated: false,

  bootstrap: async (profile) => {
    const storedState = await loadNotificationState();
    const hydratedState = normalizeHydratedState(storedState, profile);

    set({
      ...hydratedState,
      hasHydrated: true,
    });

    await saveNotificationState(hydratedState);
  },

  registerDevice: async (profile) => {
    const registration = await registerForDeviceNotifications();

    set({
      permissionStatus: registration.permissionStatus as NotificationPermissionStatus,
      deviceToken: registration.token,
      devicePlatform: registration.platform as NotificationPlatform,
      lastRegisteredAt: new Date().toISOString(),
    });

    await persistNotificationStore(get);

    if (profile && registration.token) {
      await persistRemoteDeviceToken(profile, registration.token, registration.platform);
    }
  },

  queuePreviewRoute: async (route, profile) => {
    const record = createPreviewNotification(route, profile);
    const pushAllowed = get().permissionStatus === 'granted';
    const previewRecord =
      !pushAllowed && record.deliveryModes.includes('push')
        ? {
            ...record,
            deliveryState: 'inbox_only' as const,
            fallbackState:
              record.deliveryModes.includes('sms') && record.fallbackState === 'armed'
                ? ('queued' as const)
                : record.fallbackState,
          }
        : record;

    set((state) => ({
      inbox: [previewRecord, ...state.inbox],
    }));

    await persistNotificationStore(get);

    if (previewRecord.deliveryModes.includes('push') && pushAllowed) {
      try {
        await schedulePreviewNotification(previewRecord);
      } catch {
        set((state) => ({
          inbox: state.inbox.map((entry) =>
            entry.id === previewRecord.id
              ? {
                  ...entry,
                  deliveryState: 'inbox_only',
                  fallbackState: entry.fallbackState === 'armed' ? 'queued' : entry.fallbackState,
                }
              : entry,
          ),
        }));

        await persistNotificationStore(get);
      }
    }
  },

  ingestDeliveredNotification: async (notification) => {
    const route =
      typeof notification.request.content.data?.route === 'string'
        ? (notification.request.content.data.route as NotificationRoute)
        : null;
    const recordId =
      typeof notification.request.content.data?.recordId === 'string'
        ? notification.request.content.data.recordId
        : null;

    if (recordId) {
      set((state) => ({
        inbox: state.inbox.map((entry) =>
          entry.id === recordId
            ? {
                ...entry,
                deliveryState: 'delivered',
                fallbackState: entry.fallbackState === 'armed' ? 'not_needed' : entry.fallbackState,
              }
            : entry,
        ),
      }));

      await persistNotificationStore(get);
      return;
    }

    if (!route) {
      return;
    }

    const record = buildNotificationRecord({
      route,
      title: notification.request.content.title ?? undefined,
      body: notification.request.content.body ?? undefined,
      metadata:
        typeof notification.request.content.data === 'object' &&
        notification.request.content.data !== null
          ? (notification.request.content.data as Record<string, string | number | boolean | null>)
          : {},
    });

    set((state) => ({
      inbox: [record, ...state.inbox],
    }));

    await persistNotificationStore(get);
  },

  markRead: async (id) => {
    set((state) => ({
      lastOpenedAt: new Date().toISOString(),
      inbox: state.inbox.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              readAt: entry.readAt ?? new Date().toISOString(),
              fallbackState: entry.fallbackState === 'armed' ? 'not_needed' : entry.fallbackState,
            }
          : entry,
      ),
    }));

    await persistNotificationStore(get);
  },

  markAllRead: async () => {
    const now = new Date().toISOString();

    set((state) => ({
      lastOpenedAt: now,
      inbox: state.inbox.map((entry) => ({
        ...entry,
        readAt: entry.readAt ?? now,
        fallbackState: entry.fallbackState === 'armed' ? 'not_needed' : entry.fallbackState,
      })),
    }));

    await persistNotificationStore(get);
  },
}));
