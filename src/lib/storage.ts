import AsyncStorage from '@react-native-async-storage/async-storage';

import type { GeoCalibrationRecord, LocalOnboardingState } from '../types/app';

const BIOMETRIC_ENABLED_KEY = 'facilitypro:biometric-enabled';
const BIOMETRIC_PROMPTED_KEY = 'facilitypro:biometric-prompted';
const GEO_CALIBRATION_KEY = 'facilitypro:geo-calibration';
const LAST_ACTIVITY_KEY = 'facilitypro:last-activity-at';

const DEFAULT_ONBOARDING_STATE: LocalOnboardingState = {
  biometricEnabled: false,
  biometricPrompted: false,
  geoCalibration: null,
};

async function getProtectedItem(key: string) {
  return AsyncStorage.getItem(key);
}

async function setProtectedItem(key: string, value: string) {
  await AsyncStorage.setItem(key, value);
}

function parseBoolean(value: string | null, fallback = false) {
  if (value === null) {
    return fallback;
  }

  return value === 'true';
}

export async function loadLocalOnboardingState(): Promise<LocalOnboardingState> {
  const [biometricEnabled, biometricPrompted, geoCalibration] = await Promise.all([
    getProtectedItem(BIOMETRIC_ENABLED_KEY),
    getProtectedItem(BIOMETRIC_PROMPTED_KEY),
    AsyncStorage.getItem(GEO_CALIBRATION_KEY),
  ]);

  let parsedGeoCalibration: GeoCalibrationRecord | null = null;

  if (geoCalibration) {
    try {
      parsedGeoCalibration = JSON.parse(geoCalibration) as GeoCalibrationRecord;
    } catch {
      parsedGeoCalibration = null;
    }
  }

  return {
    biometricEnabled: parseBoolean(biometricEnabled, DEFAULT_ONBOARDING_STATE.biometricEnabled),
    biometricPrompted: parseBoolean(biometricPrompted, DEFAULT_ONBOARDING_STATE.biometricPrompted),
    geoCalibration: parsedGeoCalibration,
  };
}

export async function saveBiometricPreference(options: {
  enabled: boolean;
  prompted: boolean;
}) {
  await Promise.all([
    setProtectedItem(BIOMETRIC_ENABLED_KEY, String(options.enabled)),
    setProtectedItem(BIOMETRIC_PROMPTED_KEY, String(options.prompted)),
  ]);
}

export async function saveGeoCalibration(record: GeoCalibrationRecord | null) {
  if (!record) {
    await AsyncStorage.removeItem(GEO_CALIBRATION_KEY);
    return;
  }

  await AsyncStorage.setItem(GEO_CALIBRATION_KEY, JSON.stringify(record));
}

export async function loadLastActivityAt() {
  const rawValue = await AsyncStorage.getItem(LAST_ACTIVITY_KEY);

  if (!rawValue) {
    return null;
  }

  const parsedValue = Number(rawValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

export async function saveLastActivityAt(timestamp: number) {
  await AsyncStorage.setItem(LAST_ACTIVITY_KEY, String(timestamp));
}

export async function clearLastActivityAt() {
  await AsyncStorage.removeItem(LAST_ACTIVITY_KEY);
}
