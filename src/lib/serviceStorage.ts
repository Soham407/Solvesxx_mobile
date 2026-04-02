import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ServicePersistedState } from '../types/service';

const SERVICE_STATE_KEY = 'facilitypro:service-state';

export async function loadServiceState() {
  const rawValue = await AsyncStorage.getItem(SERVICE_STATE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as ServicePersistedState;
  } catch {
    return null;
  }
}

export async function saveServiceState(state: ServicePersistedState) {
  await AsyncStorage.setItem(SERVICE_STATE_KEY, JSON.stringify(state));
}
