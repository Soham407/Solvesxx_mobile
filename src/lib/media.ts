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
    base64: true,
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

  const asset = result.assets[0];

  if (asset.base64 && asset.mimeType) {
    return {
      ...asset,
      uri: `data:${asset.mimeType};base64,${asset.base64}`,
    };
  }

  return asset;
}
