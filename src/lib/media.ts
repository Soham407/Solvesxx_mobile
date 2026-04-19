import * as ImagePicker from 'expo-image-picker';
import { getStagingAutomationImageAsset, isStagingAutomationEnabled } from './stagingAutomation';

interface CapturePhotoOptions {
  cameraType: 'front' | 'back';
  allowsEditing?: boolean;
  aspect?: [number, number];
}

export async function capturePhoto(options: CapturePhotoOptions) {
  if (isStagingAutomationEnabled()) {
    return getStagingAutomationImageAsset();
  }

  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Camera access is required to complete this action.');
  }

  const result = await ImagePicker.launchCameraAsync({
    // Keep capture flows inside the app instead of handing control to the
    // platform crop UI, which has proved unreliable on some devices/builds.
    allowsEditing: options.allowsEditing ?? false,
    aspect: options.aspect ?? [1, 1],
    cameraType:
      options.cameraType === 'front'
        ? ImagePicker.CameraType.front
        : ImagePicker.CameraType.back,
    quality: 0.75,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  return result.assets[0];
}
