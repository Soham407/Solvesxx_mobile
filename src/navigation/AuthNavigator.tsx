import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { EmailLoginScreen } from '../screens/auth/EmailLoginScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';
import { getDevPreviewCredentials } from '../lib/auth';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  const showStagingEmailLogin = Boolean(getDevPreviewCredentials());

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen component={LoginScreen} name="Login" />
      {showStagingEmailLogin ? <Stack.Screen component={EmailLoginScreen} name="EmailLogin" /> : null}
      <Stack.Screen component={OtpScreen} name="OTP" />
    </Stack.Navigator>
  );
}
