import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import { useAppBootstrap } from '../hooks/useAppBootstrap';
import { useAppTheme } from '../hooks/useAppTheme';
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import { BiometricLockScreen } from '../screens/auth/BiometricLockScreen';
import { LoadingScreen } from '../components/shared/LoadingScreen';
import { useAppStore } from '../store/useAppStore';
import type { BiometricCapability } from '../lib/biometrics';
import type { AppColorScheme, AppUserProfile, LocalOnboardingState, OnboardingStep } from '../types/app';
import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { RoleNavigator } from './RoleNavigator';

function requiresGeoCalibration(profile: AppUserProfile | null) {
  return (
    profile?.role !== 'buyer' &&
    profile?.role !== 'supplier' &&
    profile?.role !== 'vendor'
  );
}

function getPendingOnboardingStep(options: {
  profile: AppUserProfile | null;
  onboarding: LocalOnboardingState;
  biometricCapability: BiometricCapability;
}): OnboardingStep {
  const { profile, onboarding, biometricCapability } = options;

  if (biometricCapability.available && !onboarding.biometricPrompted) {
    return 'biometric';
  }

  if (profile?.role === 'security_guard' && !profile.employeePhotoUrl) {
    return 'profile-photo';
  }

  if (!profile) {
    return null;
  }

  if (
    requiresGeoCalibration(profile) &&
    (!onboarding.geoCalibration ||
      (profile.assignedLocation &&
        onboarding.geoCalibration.locationId !== profile.assignedLocation.id))
  ) {
    return 'geo-fence';
  }

  return null;
}

interface AppNavigatorProps {
  colorScheme: AppColorScheme;
}

export function AppNavigator({ colorScheme }: AppNavigatorProps) {
  const { navigationTheme, isDark } = useAppTheme(colorScheme);
  const isBootstrapping = useAppStore((state) => state.isBootstrapping);
  const session = useAppStore((state) => state.session);
  const profile = useAppStore((state) => state.profile);
  const onboarding = useAppStore((state) => state.onboarding);
  const biometricCapability = useAppStore((state) => state.biometricCapability);
  const isBiometricLocked = useAppStore((state) => state.isBiometricLocked);
  const recordActivity = useAppStore((state) => state.recordActivity);

  useAppBootstrap();
  useSessionTimeout();

  const pendingStep = getPendingOnboardingStep({
    profile,
    onboarding,
    biometricCapability,
  });

  if (isBootstrapping || (session && !profile)) {
    return <LoadingScreen />;
  }

  if (session && isBiometricLocked) {
    return <BiometricLockScreen />;
  }

  return (
    <View style={styles.root} onTouchStart={() => void recordActivity()}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer theme={navigationTheme}>
        {!session ? (
          <AuthNavigator />
        ) : pendingStep ? (
          <OnboardingNavigator key={pendingStep} initialStep={pendingStep} />
        ) : (
          <RoleNavigator role={profile?.role ?? null} />
        )}
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
