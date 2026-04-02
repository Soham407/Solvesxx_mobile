import AsyncStorage from '@react-native-async-storage/async-storage';

import type { NotificationPersistedState } from '../types/notifications';

const NOTIFICATION_STATE_KEY = 'facilitypro:notification-state';

export async function loadNotificationState() {
  const rawValue = await AsyncStorage.getItem(NOTIFICATION_STATE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as NotificationPersistedState;
  } catch {
    return null;
  }
}

export async function saveNotificationState(state: NotificationPersistedState) {
  await AsyncStorage.setItem(NOTIFICATION_STATE_KEY, JSON.stringify(state));
}
