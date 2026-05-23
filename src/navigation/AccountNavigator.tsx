import { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { House } from 'lucide-react-native';

import { LoadingScreen } from '../components/shared/LoadingScreen';
import { Spacing } from '../constants/spacing';
import { FontFamily, FontSize } from '../constants/typography';
import { useAppTheme } from '../hooks/useAppTheme';
import { AccountHomeScreen } from '../screens/account/AccountHomeScreen';
import { useAppStore } from '../store/useAppStore';
import { useAccountStore } from '../store/useAccountStore';
import type { AccountTabParamList } from './types';

const Tab = createBottomTabNavigator<AccountTabParamList>();

export function AccountNavigator() {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const bootstrap = useAccountStore((state) => state.bootstrap);
  const hasHydrated = useAccountStore((state) => state.hasHydrated);

  useEffect(() => {
    bootstrap(profile);
  }, [bootstrap, profile]);

  if (!hasHydrated) {
    return <LoadingScreen />;
  }

  return (
    <Tab.Navigator
      initialRouteName="AccountHome"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 78,
          paddingBottom: Spacing.base,
          paddingTop: Spacing.sm,
        },
        tabBarLabelStyle: {
          fontFamily: FontFamily.sansSemiBold,
          fontSize: FontSize.xs,
        },
        tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
      })}
    >
      <Tab.Screen
        component={AccountHomeScreen}
        name="AccountHome"
        options={{ title: 'Summary', tabBarButtonTestID: 'qa_account_tab_home' }}
      />
    </Tab.Navigator>
  );
}
