import * as ImagePicker from 'expo-image-picker';

interface CapturePhotoOptions {
  cameraType: 'front' | 'back';
  allowsEditing?: boolean;
  aspect?: [number, number];
}

export async function capturePhoto(options: CapturePhotoOptions) {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Camera access is required to complete this action.');
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: options.allowsEditing ?? true,
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
