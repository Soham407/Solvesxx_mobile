import type { ImagePickerAsset } from 'expo-image-picker';
import * as Location from 'expo-location';

import type { AppUserProfile, GeoCalibrationRecord, LocationSummary } from '../types/app';
import type { GuardLocationSnapshot } from '../types/guard';

const STAGING_PIXEL_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9sotkD4AAAAASUVORK5CYII=';

export function isStagingAutomationEnabled() {
  if (!__DEV__) {
    return false;
  }

  return (process.env.EXPO_PUBLIC_STAGING_AUTOMATION ?? 'true') === 'true';
}

export function getStagingAutomationImageUri() {
  return STAGING_PIXEL_DATA_URI;
}

export function getStagingAutomationImageAsset(): ImagePickerAsset {
  return {
    assetId: null,
    base64: null,
    duration: undefined,
    exif: null,
    fileName: 'staging-automation.png',
    fileSize: undefined,
    height: 1,
    mimeType: 'image/png',
    type: 'image',
    uri: STAGING_PIXEL_DATA_URI,
    width: 1,
  };
}

export function buildAssignedLocationSnapshot(
  assignedLocation: LocationSummary | null,
): GuardLocationSnapshot {
  return {
    latitude: assignedLocation?.latitude ?? 19.076,
    longitude: assignedLocation?.longitude ?? 72.8777,
    capturedAt: new Date().toISOString(),
    distanceFromAssignedSite: 0,
    withinGeoFence: true,
  };
}

export function buildAssignedGeoCalibration(
  assignedLocation: LocationSummary | null,
): GeoCalibrationRecord {
  return {
    calibratedAt: new Date().toISOString(),
    latitude: assignedLocation?.latitude ?? 19.076,
    locationId: assignedLocation?.id ?? 'staging-automation-location',
    locationName: assignedLocation?.locationName ?? 'Staging automation location',
    longitude: assignedLocation?.longitude ?? 72.8777,
    radius: assignedLocation?.geoFenceRadius ?? 100,
  };
}

export function isStagingAutomationProfile(profile: AppUserProfile | null) {
  if (!isStagingAutomationEnabled()) {
    return false;
  }

  const sessionUser = profile?.session?.user;
  const email = sessionUser?.email?.toLowerCase() ?? '';

  return email === 'guard@test.com' || email === 'rohit@test.com' || email === 'resident@test.com';
}
