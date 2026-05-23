import { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AlertTriangle, House, Package } from 'lucide-react-native';

import { LoadingScreen } from '../components/shared/LoadingScreen';
import { Spacing } from '../constants/spacing';
import { FontFamily, FontSize } from '../constants/typography';
import { useAppTheme } from '../hooks/useAppTheme';
import { StorekeeperAlertsScreen } from '../screens/storekeeper/StorekeeperAlertsScreen';
import { StorekeeperGRNScreen } from '../screens/storekeeper/StorekeeperGRNScreen';
import { StorekeeperHomeScreen } from '../screens/storekeeper/StorekeeperHomeScreen';
import { useAppStore } from '../store/useAppStore';
import { useStorekeeperStore } from '../store/useStorekeeperStore';
import type { StorekeeperTabParamList } from './types';

const Tab = createBottomTabNavigator<StorekeeperTabParamList>();

export function StorekeeperNavigator() {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const bootstrap = useStorekeeperStore((state) => state.bootstrap);
  const hasHydrated = useStorekeeperStore((state) => state.hasHydrated);

  useEffect(() => {
    bootstrap(profile);
  }, [bootstrap, profile]);

  if (!hasHydrated) {
    return <LoadingScreen />;
  }

  return (
    <Tab.Navigator
      initialRouteName="StorekeeperHome"
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
          if (route.name === 'StorekeeperAlerts') {
            return <AlertTriangle color={color} size={size} />;
          }

          if (route.name === 'StorekeeperGRN') {
            return <Package color={color} size={size} />;
          }

          return <House color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen
        component={StorekeeperHomeScreen}
        name="StorekeeperHome"
        options={{ title: 'Home', tabBarButtonTestID: 'qa_storekeeper_tab_home' }}
      />
      <Tab.Screen
        component={StorekeeperAlertsScreen}
        name="StorekeeperAlerts"
        options={{ title: 'Alerts', tabBarButtonTestID: 'qa_storekeeper_tab_alerts' }}
      />
      <Tab.Screen
        component={StorekeeperGRNScreen}
        name="StorekeeperGRN"
        options={{ title: 'GRN', tabBarButtonTestID: 'qa_storekeeper_tab_grn' }}
      />
    </Tab.Navigator>
  );
}
