import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera as CameraIcon, Upload as UploadIcon, X as XIcon } from 'lucide-react-native';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';

interface PhotoCaptureProps {
  disabled?: boolean;
  onPhotoCapture: (photoUri: string) => Promise<void>;
  onPhotoRemove?: () => void;
  capturedPhotoUri?: string | null;
  colors: any;
  label?: string;
  description?: string;
}

export function PhotoCapture({
  disabled = false,
  onPhotoCapture,
  onPhotoRemove,
  capturedPhotoUri,
  colors,
  label = 'Capture Photo',
  description,
}: PhotoCaptureProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCapture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera Permission Required', 'Please allow camera access to capture photos.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        await onPhotoCapture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('[PhotoCapture] Error:', error);
      Alert.alert('Camera Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (capturedPhotoUri) {
    return (
      <View style={[styles.container, { borderColor: colors.info }]}>
        <View style={styles.previewWrapper}>
          <View style={[styles.previewPlaceholder, { backgroundColor: colors.secondary }]}>
            <UploadIcon color={colors.info} size={24} />
          </View>
          <View style={styles.previewContent}>
            <Text style={[styles.previewLabel, { color: colors.foreground }]}>Photo captured</Text>
            <Text style={[styles.previewSubtext, { color: colors.mutedForeground }]}>Ready to upload</Text>
          </View>
        </View>

        {onPhotoRemove && (
          <Pressable
            onPress={onPhotoRemove}
            style={[styles.removeButton, { backgroundColor: colors.secondary }]}
            accessibilityRole="button"
            accessibilityLabel="Remove photo"
          >
            <XIcon color={colors.foreground} size={18} />
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <Pressable
      onPress={handleCapture}
      disabled={disabled || isLoading}
      style={[
        styles.container,
        {
          borderColor: colors.info,
          backgroundColor: colors.secondary,
          opacity: disabled || isLoading ? 0.6 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.info} />
      ) : (
        <CameraIcon color={colors.info} size={24} />
      )}

      <View style={styles.labelWrapper}>
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
        {description && <Text style={[styles.description, { color: colors.mutedForeground }]}>{description}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: Spacing.md,
    marginVertical: Spacing.md,
  },
  previewWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  previewPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContent: {
    flex: 1,
    justifyContent: 'center',
  },
  previewLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.sansMedium,
    marginBottom: Spacing.xs,
  },
  previewSubtext: {
    fontSize: FontSize.xs,
  },
  removeButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelWrapper: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  label: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.sansMedium,
  },
  description: {
    fontSize: FontSize.xs,
  },
});
