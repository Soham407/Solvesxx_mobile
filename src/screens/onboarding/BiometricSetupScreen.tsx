import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Fingerprint } from 'lucide-react-native';

import { ActionButton } from '../../components/shared/ActionButton';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import { promptForBiometricUnlock } from '../../lib/biometrics';
import { useAppStore } from '../../store/useAppStore';

export function BiometricSetupScreen() {
  const { colors } = useAppTheme();
  const biometricCapability = useAppStore((state) => state.biometricCapability);
  const completeBiometricPrompt = useAppStore((state) => state.completeBiometricPrompt);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEnable = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await promptForBiometricUnlock(
        `Enable ${biometricCapability.label} for FacilityPro`,
      );

      if (result.success) {
        await completeBiometricPrompt(true);
        return;
      }

      if (result.error !== 'user_cancel') {
        setErrorMessage('Biometric setup was not completed. You can try again or skip for now.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);

    try {
      await completeBiometricPrompt(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAvailable = biometricCapability.available;

  return (
    <ScreenShell
      eyebrow="Onboarding"
      title={isAvailable ? 'Enable biometric unlock' : 'Biometric check complete'}
      description={
        isAvailable
          ? `Use ${biometricCapability.label} to re-enter the app without a fresh OTP every time.`
          : 'This device does not have an enrolled biometric method, so we will continue with OTP-only access for now.'
      }
      footer={
        <View style={styles.footer}>
          {isAvailable ? (
            <ActionButton
              label={`Enable ${biometricCapability.label}`}
              loading={isSubmitting}
              onPress={handleEnable}
            />
          ) : (
            <ActionButton
              label="Continue"
              loading={isSubmitting}
              onPress={handleSkip}
            />
          )}
          {isAvailable ? (
            <ActionButton
              label="Skip for now"
              variant="ghost"
              disabled={isSubmitting}
              onPress={handleSkip}
            />
          ) : null}
        </View>
      }
    >
      <InfoCard>
        <View style={styles.iconRow}>
          <Fingerprint color={colors.primary} size={28} />
          <Text style={[styles.caption, { color: colors.foreground }]}>
            Subsequent sessions can be locked locally even while your Supabase session stays active.
          </Text>
        </View>
        {errorMessage ? <Text style={[styles.errorText, { color: colors.destructive }]}>{errorMessage}</Text> : null}
      </InfoCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: 12,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  caption: {
    flex: 1,
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    lineHeight: 22,
  },
  errorText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
});
