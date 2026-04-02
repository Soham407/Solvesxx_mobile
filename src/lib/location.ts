import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface GeoPermissionState {
  foregroundGranted: boolean;
  foregroundStatus: Location.PermissionStatus;
  backgroundGranted: boolean;
  backgroundStatus: Location.PermissionStatus;
  canAskAgain: boolean;
}

const EARTH_RADIUS_METERS = 6371000;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export async function requestGeoFencePermissions(): Promise<GeoPermissionState> {
  const foreground = await Location.requestForegroundPermissionsAsync();

  if (foreground.status !== 'granted') {
    return {
      foregroundGranted: false,
      foregroundStatus: foreground.status,
      backgroundGranted: false,
      backgroundStatus: foreground.status,
      canAskAgain: foreground.canAskAgain,
    };
  }

  let backgroundStatus: Location.PermissionStatus = foreground.status;
  let backgroundGranted = foreground.status === 'granted';

  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    const background = await Location.requestBackgroundPermissionsAsync();
    backgroundStatus = background.status;
    backgroundGranted = background.status === 'granted';
  }

  return {
    foregroundGranted: true,
    foregroundStatus: foreground.status,
    backgroundGranted,
    backgroundStatus,
    canAskAgain: foreground.canAskAgain,
  };
}

export async function getCurrentLocationFix() {
  return Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
    mayShowUserSettingsDialog: true,
  });
}

export function calculateDistanceMeters(
  originLatitude: number,
  originLongitude: number,
  destinationLatitude: number,
  destinationLongitude: number,
) {
  const latitudeDelta = toRadians(destinationLatitude - originLatitude);
  const longitudeDelta = toRadians(destinationLongitude - originLongitude);

  const originLatitudeInRadians = toRadians(originLatitude);
  const destinationLatitudeInRadians = toRadians(destinationLatitude);

  const haversine =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(originLatitudeInRadians) *
      Math.cos(destinationLatitudeInRadians) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return Math.round(EARTH_RADIUS_METERS * arc);
}
