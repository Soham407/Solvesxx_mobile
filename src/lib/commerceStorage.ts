import AsyncStorage from '@react-native-async-storage/async-storage';

import type { BuyerPersistedState, SupplierPersistedState } from '../types/commerce';

const BUYER_STATE_KEY = 'facilitypro:buyer-state';
const SUPPLIER_STATE_KEY = 'facilitypro:supplier-state';

async function loadJsonValue<T>(key: string) {
  const rawValue = await AsyncStorage.getItem(key);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return null;
  }
}

async function saveJsonValue<T>(key: string, value: T) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function loadBuyerState() {
  return loadJsonValue<BuyerPersistedState>(BUYER_STATE_KEY);
}

export async function saveBuyerState(state: BuyerPersistedState) {
  await saveJsonValue(BUYER_STATE_KEY, state);
}

export async function loadSupplierState() {
  return loadJsonValue<SupplierPersistedState>(SUPPLIER_STATE_KEY);
}

export async function saveSupplierState(state: SupplierPersistedState) {
  await saveJsonValue(SUPPLIER_STATE_KEY, state);
}
