import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ActionButton } from '../../components/shared/ActionButton';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import { uploadProfilePhoto } from '../../lib/profile';
import type { OnboardingStackParamList } from '../../navigation/types';
import {
  getStagingAutomationImageAsset,
  isStagingAutomationEnabled,
  isStagingAutomationProfile,
} from '../../lib/stagingAutomation';
import { useAppStore } from '../../store/useAppStore';

export function ProfilePhotoScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const profile = useAppStore((state) => state.profile);
  const refreshProfile = useAppStore((state) => state.refreshProfile);
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasAttemptedAutoCapture, setHasAttemptedAutoCapture] = useState(false);

  const handleCapture = async () => {
    setErrorMessage(null);

    if (isStagingAutomationEnabled() && isStagingAutomationProfile(profile)) {
      setAsset(getStagingAutomationImageAsset());
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      setErrorMessage('Camera access is required for guard profile setup.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      aspect: [1, 1],
      cameraType: ImagePicker.CameraType.front,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAsset(result.assets[0]);
    }
  };

  useEffect(() => {
    if (!hasAttemptedAutoCapture) {
      setHasAttemptedAutoCapture(true);
      void handleCapture();
    }
  }, [hasAttemptedAutoCapture]);

  const handleSave = async () => {
    if (!profile?.employeeId || !asset) {
      setErrorMessage('Please capture a profile photo before continuing.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await uploadProfilePhoto(profile.employeeId, asset.uri, asset.mimeType ?? undefined);
      await refreshProfile();
      navigation.replace('GeoFenceCalibration');
    } catch (error) {
      const nextMessage =
        error instanceof Error ? error.message : 'We could not upload the profile photo.';
      setErrorMessage(nextMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenShell
      eyebrow="Guard setup"
      title="Capture profile photo"
      description="Security guards need a profile photo on file so selfie attendance and guard-side verification have a baseline to compare against."
      footer={
        <View style={styles.footer}>
          <ActionButton
            label={asset ? 'Save and continue' : 'Capture photo first'}
            testID="qa_onboarding_profile_save"
            loading={isSaving}
            disabled={!asset}
            onPress={handleSave}
          />
          <ActionButton
            label="Retake photo"
            testID="qa_onboarding_profile_retake"
            variant="ghost"
            disabled={isSaving}
            onPress={() => void handleCapture()}
          />
        </View>
      }
    >
      <InfoCard>
        {asset ? (
          <Image source={{ uri: asset.uri }} style={styles.preview} />
        ) : (
          <View
            style={[styles.placeholder, { backgroundColor: colors.secondary }]}
            testID="qa_onboarding_profile_placeholder"
          >
            <Text style={[styles.placeholderText, { color: colors.mutedForeground }]}>
              Camera preview will appear here.
            </Text>
          </View>
        )}
        <Text style={[styles.caption, { color: colors.mutedForeground }]}>
          We open the front camera automatically on this screen so onboarding stays fast at the gate.
          Review the captured photo here and use Retake if needed.
        </Text>
        {errorMessage ? <Text style={[styles.errorText, { color: colors.destructive }]}>{errorMessage}</Text> : null}
      </InfoCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: 12,
  },
  preview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BorderRadius['2xl'],
  },
  placeholder: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BorderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  placeholderText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.base,
    textAlign: 'center',
  },
  caption: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  errorText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
});
