import { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Building2, Globe } from 'lucide-react-native';

import { LoadingScreen } from '../components/shared/LoadingScreen';
import { Spacing } from '../constants/spacing';
import { FontFamily, FontSize } from '../constants/typography';
import { useAppTheme } from '../hooks/useAppTheme';
import { SuperAdminCompaniesScreen } from '../screens/super_admin/SuperAdminCompaniesScreen';
import { SuperAdminHomeScreen } from '../screens/super_admin/SuperAdminHomeScreen';
import { useAppStore } from '../store/useAppStore';
import { useSuperAdminStore } from '../store/useSuperAdminStore';
import type { SuperAdminTabParamList } from './types';

const Tab = createBottomTabNavigator<SuperAdminTabParamList>();

export function SuperAdminNavigator() {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const bootstrap = useSuperAdminStore((state) => state.bootstrap);
  const hasHydrated = useSuperAdminStore((state) => state.hasHydrated);

  useEffect(() => {
    void bootstrap(profile);
  }, [bootstrap, profile]);

  if (!hasHydrated) {
    return <LoadingScreen />;
  }

  return (
    <Tab.Navigator
      initialRouteName="SuperAdminHome"
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
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'SuperAdminCompanies') {
            return <Building2 color={color} size={size} />;
          }

          return <Globe color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen
        component={SuperAdminHomeScreen}
        name="SuperAdminHome"
        options={{ title: 'Overview', tabBarButtonTestID: 'qa_superadmin_tab_home' }}
      />
      <Tab.Screen
        component={SuperAdminCompaniesScreen}
        name="SuperAdminCompanies"
        options={{ title: 'Companies', tabBarButtonTestID: 'qa_superadmin_tab_companies' }}
      />
    </Tab.Navigator>
  );
}
