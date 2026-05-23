import { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, Users } from 'lucide-react-native';

import { LoadingScreen } from '../components/shared/LoadingScreen';
import { Spacing } from '../constants/spacing';
import { FontFamily, FontSize } from '../constants/typography';
import { useAppTheme } from '../hooks/useAppTheme';
import { AdminActionsScreen } from '../screens/admin/AdminActionsScreen';
import { AdminHomeScreen } from '../screens/admin/AdminHomeScreen';
import { useAppStore } from '../store/useAppStore';
import { useAdminStore } from '../store/useAdminStore';
import type { AdminTabParamList } from './types';

const Tab = createBottomTabNavigator<AdminTabParamList>();

export function AdminNavigator() {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const bootstrap = useAdminStore((state) => state.bootstrap);
  const hasHydrated = useAdminStore((state) => state.hasHydrated);

  useEffect(() => {
    bootstrap(profile);
  }, [bootstrap, profile]);

  if (!hasHydrated) {
    return <LoadingScreen />;
  }

  return (
    <Tab.Navigator
      initialRouteName="AdminHome"
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
        tabBarIcon: ({ color, size }) =>
          route.name === 'AdminActions' ? (
            <Users color={color} size={size} />
          ) : (
            <LayoutDashboard color={color} size={size} />
          ),
      })}
    >
      <Tab.Screen
        component={AdminHomeScreen}
        name="AdminHome"
        options={{ title: 'Dashboard', tabBarButtonTestID: 'qa_admin_tab_home' }}
      />
      <Tab.Screen
        component={AdminActionsScreen}
        name="AdminActions"
        options={{ title: 'Users', tabBarButtonTestID: 'qa_admin_tab_actions' }}
      />
    </Tab.Navigator>
  );
}
