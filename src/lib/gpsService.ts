import { getCurrentLocationFix, calculateDistanceMeters } from './location';
import { recordGuardGpsTracking } from './mobileBackend';
import type { AppUserProfile } from '../types/app';
import type { GuardLocationSnapshot } from '../types/guard';

interface GpsServiceState {
  pollingInterval: NodeJS.Timeout | null;
  geofenceMonitorInterval: NodeJS.Timeout | null;
  lastExitWarningTime: number | null;
  isOutsideGeofence: boolean;
}

const state: GpsServiceState = {
  pollingInterval: null,
  geofenceMonitorInterval: null,
  lastExitWarningTime: null,
  isOutsideGeofence: false,
};

/**
 * Start periodic GPS tracking (every 5 minutes during guard shift)
 * Captures location and uploads to backend
 */
export async function startPeriodicGpsTracking(
  profile: AppUserProfile | null,
  intervalSeconds: number = 300, // 5 minutes default
  onLocationUpdate?: (location: GuardLocationSnapshot) => void,
) {
  if (!profile?.assignedLocation) {
    console.warn('[GPS] No assigned location. Periodic tracking disabled.');
    return;
  }

  // Clear any existing interval
  stopPeriodicGpsTracking();

  // Capture immediately on start
  try {
    await captureAndUploadLocation(profile);
  } catch (error) {
    console.warn('[GPS] Initial capture failed:', error);
  }

  // Set up interval
  state.pollingInterval = setInterval(async () => {
    try {
      const location = await captureAndUploadLocation(profile);
      onLocationUpdate?.(location);
    } catch (error) {
      console.warn('[GPS] Periodic capture failed:', error);
      // Don't crash on error, continue polling
    }
  }, intervalSeconds * 1000);

  console.log(`[GPS] Started periodic tracking every ${intervalSeconds}s`);
}

/**
 * Stop periodic GPS tracking
 */
export function stopPeriodicGpsTracking() {
  if (state.pollingInterval) {
    clearInterval(state.pollingInterval);
    state.pollingInterval = null;
    console.log('[GPS] Stopped periodic tracking');
  }
}

/**
 * Start monitoring for geofence exits
 * Auto punch-out if outside for 2 minutes
 */
export function startGeofenceExitMonitoring(
  profile: AppUserProfile | null,
  onGeofenceExit?: (reason: string) => void,
  onWarning?: (message: string) => void,
) {
  if (!profile?.assignedLocation) {
    console.warn('[Geofence] No assigned location. Exit monitoring disabled.');
    return;
  }

  // Clear any existing interval
  stopGeofenceExitMonitoring();

  const assignedLocation = profile.assignedLocation;
  const GEOFENCE_RADIUS = assignedLocation.geoFenceRadius ?? 50; // Default 50m
  const GRACE_PERIOD_MS = 30000; // 30 seconds
  const AUTO_PUNCHOUT_MS = 120000; // 2 minutes

  // TODO (future): Add "Request Break" feature — guard taps to temporarily pause geofence
  // monitoring for a supervisor-approved duration (e.g. shop run, prayers, errand).
  // Flow: guard submits reason + estimated duration → supervisor notified → monitoring
  // pauses for that window → auto-resumes after. Without this, any absence > 2 min
  // triggers an unintended auto punch-out.

  let exitDetectedAt: number | null = null;

  state.geofenceMonitorInterval = setInterval(async () => {
    try {
      const fix = await getCurrentLocationFix();

      if (!assignedLocation.latitude || !assignedLocation.longitude) {
        throw new Error('Assigned location coordinates are missing');
      }

      const distance = calculateDistanceMeters(
        fix.coords.latitude,
        fix.coords.longitude,
        assignedLocation.latitude,
        assignedLocation.longitude,
      );

      const isOutside = distance > GEOFENCE_RADIUS;
      const now = Date.now();

      if (isOutside) {
        if (!exitDetectedAt) {
          // First detection of exit
          exitDetectedAt = now;
          state.isOutsideGeofence = true;
          console.warn(`[Geofence] Guard outside fence. Distance: ${distance}m`);
          onWarning?.(`You are ${distance}m from gate. Grace period: 30 seconds.`);
        } else if (now - exitDetectedAt > AUTO_PUNCHOUT_MS) {
          // 2 minutes passed - trigger auto punch-out
          console.warn('[Geofence] Auto punch-out triggered - outside for 2 minutes');
          onGeofenceExit?.(`Left geofence. Distance: ${distance}m`);
          stopGeofenceExitMonitoring();
        } else if (
          now - exitDetectedAt > GRACE_PERIOD_MS &&
          (!state.lastExitWarningTime || now - state.lastExitWarningTime > 30000)
        ) {
          // Show warning after grace period
          const timeLeft = Math.ceil((AUTO_PUNCHOUT_MS - (now - exitDetectedAt)) / 1000);
          onWarning?.(
            `Still outside fence. Auto punch-out in ${timeLeft}s. Move back to gate immediately.`,
          );
          state.lastExitWarningTime = now;
        }
      } else {
        // Back inside fence - reset exit timer
        if (exitDetectedAt) {
          console.log('[Geofence] Guard back within fence');
          exitDetectedAt = null;
          state.lastExitWarningTime = null;
          state.isOutsideGeofence = false;
          onWarning?.('You are back within the safe zone.');
        }
      }
    } catch (error) {
      console.warn('[Geofence] Monitor check failed:', error);
    }
  }, 30000); // Check every 30 seconds

  console.log('[Geofence] Started exit monitoring');
}

/**
 * Stop geofence exit monitoring
 */
export function stopGeofenceExitMonitoring() {
  if (state.geofenceMonitorInterval) {
    clearInterval(state.geofenceMonitorInterval);
    state.geofenceMonitorInterval = null;
    console.log('[Geofence] Stopped exit monitoring');
  }

  state.lastExitWarningTime = null;
  state.isOutsideGeofence = false;
}

/**
 * Check if guard is currently outside geofence
 */
export function isCurrentlyOutsideGeofence(): boolean {
  return state.isOutsideGeofence;
}

/**
 * Capture current location and upload to backend
 * Returns the location snapshot
 */
async function captureAndUploadLocation(
  profile: AppUserProfile | null,
): Promise<GuardLocationSnapshot> {
  if (!profile?.assignedLocation) {
    throw new Error('No assigned location');
  }

  const fix = await getCurrentLocationFix();
  const assignedLocation = profile.assignedLocation;

  let distanceFromAssignedSite: number | null = null;
  let withinGeoFence = true;

  if (assignedLocation?.latitude != null && assignedLocation.longitude != null) {
    distanceFromAssignedSite = calculateDistanceMeters(
      fix.coords.latitude,
      fix.coords.longitude,
      assignedLocation.latitude,
      assignedLocation.longitude,
    );
    withinGeoFence = distanceFromAssignedSite <= assignedLocation.geoFenceRadius;
  }

  const snapshot: GuardLocationSnapshot = {
    latitude: fix.coords.latitude,
    longitude: fix.coords.longitude,
    capturedAt: new Date().toISOString(),
    distanceFromAssignedSite,
    withinGeoFence,
  };

  // Upload to backend
  await recordGuardGpsTracking({
    profile,
    location: snapshot,
    batteryLevel: null,
  });

  return snapshot;
}

/**
 * Manual location check - returns location without queuing
 * Used for check-in validation
 */
export async function captureLocationForCheckIn(
  profile: AppUserProfile | null,
): Promise<GuardLocationSnapshot> {
  return captureAndUploadLocation(profile);
}

/**
 * Get current GPS service state (for debugging)
 */
export function getGpsServiceState() {
  return {
    pollingActive: state.pollingInterval !== null,
    monitoringActive: state.geofenceMonitorInterval !== null,
    isOutsideGeofence: state.isOutsideGeofence,
  };
}
