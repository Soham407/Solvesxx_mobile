import AsyncStorage from '@react-native-async-storage/async-storage';

import type { GuardPersistedState } from '../types/guard';

const LEGACY_GUARD_STATE_KEY = 'facilitypro:guard-state';
const GUARD_STATE_KEY = 'facilitypro:guard-state:v2';

export async function loadGuardState() {
  let rawValue: string | null = null;

  try {
    rawValue = await AsyncStorage.getItem(GUARD_STATE_KEY);
  } catch {
    await AsyncStorage.removeItem(GUARD_STATE_KEY);
    return null;
  }

  if (!rawValue) {
    try {
      await AsyncStorage.removeItem(LEGACY_GUARD_STATE_KEY);
    } catch {
      // Ignore cleanup failures for legacy oversized rows.
    }
    return null;
  }

  try {
    return JSON.parse(rawValue) as GuardPersistedState;
  } catch {
    await AsyncStorage.removeItem(GUARD_STATE_KEY);
    return null;
  }
}

export async function saveGuardState(state: GuardPersistedState) {
  await AsyncStorage.setItem(GUARD_STATE_KEY, JSON.stringify(state));
}

export async function clearGuardState() {
  await Promise.all([
    AsyncStorage.removeItem(GUARD_STATE_KEY),
    AsyncStorage.removeItem(LEGACY_GUARD_STATE_KEY),
  ]);
}
