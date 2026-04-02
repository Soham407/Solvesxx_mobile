import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BiometricSetupScreen } from '../screens/onboarding/BiometricSetupScreen';
import { GeoFenceCalibrationScreen } from '../screens/onboarding/GeoFenceCalibrationScreen';
import { ProfilePhotoScreen } from '../screens/onboarding/ProfilePhotoScreen';
import type { OnboardingStackParamList } from './types';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

const INITIAL_ROUTE_MAP = {
  biometric: 'BiometricSetup',
  'profile-photo': 'ProfilePhoto',
  'geo-fence': 'GeoFenceCalibration',
} as const;

interface OnboardingNavigatorProps {
  initialStep: keyof typeof INITIAL_ROUTE_MAP;
}

export function OnboardingNavigator({ initialStep }: OnboardingNavigatorProps) {
  return (
    <Stack.Navigator
      initialRouteName={INITIAL_ROUTE_MAP[initialStep]}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen component={BiometricSetupScreen} name="BiometricSetup" />
      <Stack.Screen component={ProfilePhotoScreen} name="ProfilePhoto" />
      <Stack.Screen component={GeoFenceCalibrationScreen} name="GeoFenceCalibration" />
    </Stack.Navigator>
  );
}
