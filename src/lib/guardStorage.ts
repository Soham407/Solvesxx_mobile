import AsyncStorage from '@react-native-async-storage/async-storage';

import type { GuardPersistedState } from '../types/guard';

const GUARD_STATE_KEY = 'facilitypro:guard-state';

export async function loadGuardState() {
  const rawValue = await AsyncStorage.getItem(GUARD_STATE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as GuardPersistedState;
  } catch {
    return null;
  }
}

export async function saveGuardState(state: GuardPersistedState) {
  await AsyncStorage.setItem(GUARD_STATE_KEY, JSON.stringify(state));
}
