import { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AlertCircle, House, Shield } from 'lucide-react-native';

import { LoadingScreen } from '../components/shared/LoadingScreen';
import { Spacing } from '../constants/spacing';
import { FontFamily, FontSize } from '../constants/typography';
import { useAppTheme } from '../hooks/useAppTheme';
import { SiteSupervisorActionsScreen } from '../screens/site_supervisor/SiteSupervisorActionsScreen';
import { SiteSupervisorGuardsScreen } from '../screens/site_supervisor/SiteSupervisorGuardsScreen';
import { SiteSupervisorHomeScreen } from '../screens/site_supervisor/SiteSupervisorHomeScreen';
import { useAppStore } from '../store/useAppStore';
import { useSiteSupervisorStore } from '../store/useSiteSupervisorStore';
import type { SiteSupervisorTabParamList } from './types';

const Tab = createBottomTabNavigator<SiteSupervisorTabParamList>();

export function SiteSupervisorNavigator() {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const bootstrap = useSiteSupervisorStore((state) => state.bootstrap);
  const hasHydrated = useSiteSupervisorStore((state) => state.hasHydrated);

  useEffect(() => {
    bootstrap(profile);
  }, [bootstrap, profile]);

  if (!hasHydrated) {
    return <LoadingScreen />;
  }

  return (
    <Tab.Navigator
      initialRouteName="SiteSupervisorHome"
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
          if (route.name === 'SiteSupervisorGuards') {
            return <Shield color={color} size={size} />;
          }

          if (route.name === 'SiteSupervisorActions') {
            return <AlertCircle color={color} size={size} />;
          }

          return <House color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen
        component={SiteSupervisorHomeScreen}
        name="SiteSupervisorHome"
        options={{ title: 'Home', tabBarButtonTestID: 'qa_sitesup_tab_home' }}
      />
      <Tab.Screen
        component={SiteSupervisorGuardsScreen}
        name="SiteSupervisorGuards"
        options={{ title: 'Guards', tabBarButtonTestID: 'qa_sitesup_tab_guards' }}
      />
      <Tab.Screen
        component={SiteSupervisorActionsScreen}
        name="SiteSupervisorActions"
        options={{ title: 'Actions', tabBarButtonTestID: 'qa_sitesup_tab_actions' }}
      />
    </Tab.Navigator>
  );
}
