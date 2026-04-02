import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';

import { ActionButton } from '../../components/shared/ActionButton';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import { promptForBiometricUnlock } from '../../lib/biometrics';
import { useAppStore } from '../../store/useAppStore';

export function BiometricLockScreen() {
  const { colors } = useAppTheme();
  const capability = useAppStore((state) => state.biometricCapability);
  const setBiometricLocked = useAppStore((state) => state.setBiometricLocked);
  const signOut = useAppStore((state) => state.signOut);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleUnlock = async () => {
    setIsUnlocking(true);
    setErrorMessage(null);

    try {
      const result = await promptForBiometricUnlock(`Unlock FacilityPro with ${capability.label}`);

      if (result.success) {
        setBiometricLocked(false);
      } else if (result.error !== 'user_cancel') {
        setErrorMessage('Biometric authentication failed. You can try again or sign out.');
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  useEffect(() => {
    void handleUnlock();
  }, []);

  return (
    <ScreenShell
      eyebrow="Secure session"
      title="Unlock FacilityPro"
      description="Your previous mobile session is still active. Confirm your identity before entering the app."
      footer={
        <View style={styles.footer}>
          <ActionButton label={`Use ${capability.label}`} loading={isUnlocking} onPress={handleUnlock} />
          <ActionButton label="Sign out instead" variant="ghost" onPress={() => void signOut()} />
        </View>
      }
    >
      <InfoCard>
        <View style={styles.iconRow}>
          <ShieldCheck color={colors.primary} size={28} />
          <Text style={[styles.caption, { color: colors.foreground }]}>
            Biometric lock is enabled for this device.
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
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.base,
    lineHeight: 22,
  },
  errorText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
});
