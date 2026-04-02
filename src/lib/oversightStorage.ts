import AsyncStorage from '@react-native-async-storage/async-storage';

import type { OversightPersistedState } from '../types/oversight';

const OVERSIGHT_STATE_KEY = 'facilitypro:oversight-state';

export async function loadOversightState() {
  const rawValue = await AsyncStorage.getItem(OVERSIGHT_STATE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as OversightPersistedState;
  } catch {
    return null;
  }
}

export async function saveOversightState(state: OversightPersistedState) {
  await AsyncStorage.setItem(OVERSIGHT_STATE_KEY, JSON.stringify(state));
}
