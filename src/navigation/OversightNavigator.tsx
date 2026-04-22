import { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Bell, ClipboardList, House, Megaphone, ShieldAlert } from 'lucide-react-native';

import { LoadingScreen } from '../components/shared/LoadingScreen';
import { Spacing } from '../constants/spacing';
import { FontFamily, FontSize } from '../constants/typography';
import { useAppTheme } from '../hooks/useAppTheme';
import { OversightAlertsScreen } from '../screens/oversight/OversightAlertsScreen';
import { OversightHomeScreen } from '../screens/oversight/OversightHomeScreen';
import { OversightOperationsScreen } from '../screens/oversight/OversightOperationsScreen';
import { OversightTicketsScreen } from '../screens/oversight/OversightTicketsScreen';
import { PostAnnouncementScreen } from '../screens/societyManager/PostAnnouncementScreen';
import { useAppStore } from '../store/useAppStore';
import { useOversightStore } from '../store/useOversightStore';
import type { OversightTabParamList } from './types';

const Tab = createBottomTabNavigator<OversightTabParamList>();

export function OversightNavigator() {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const bootstrap = useOversightStore((state) => state.bootstrap);
  const hasHydrated = useOversightStore((state) => state.hasHydrated);

  useEffect(() => {
    void bootstrap(profile);
  }, [bootstrap, profile]);

  if (!hasHydrated) {
    return <LoadingScreen />;
  }

  return (
    <Tab.Navigator
      initialRouteName="OversightHome"
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
          if (route.name === 'OversightAlerts') {
            return <Bell color={color} size={size} />;
          }

          if (route.name === 'OversightOperations') {
            return <ClipboardList color={color} size={size} />;
          }

          if (route.name === 'OversightTickets') {
            return <ShieldAlert color={color} size={size} />;
          }

          if (route.name === 'OversightAnnouncements') {
            return <Megaphone color={color} size={size} />;
          }

          return <House color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen
        component={OversightHomeScreen}
        name="OversightHome"
        options={{ title: 'Home', tabBarButtonTestID: 'qa_oversight_tab_home' }}
      />
      <Tab.Screen
        component={OversightAlertsScreen}
        name="OversightAlerts"
        options={{ title: 'Alerts', tabBarButtonTestID: 'qa_oversight_tab_alerts' }}
      />
      <Tab.Screen
        component={OversightOperationsScreen}
        name="OversightOperations"
        options={{ title: 'Ops', tabBarButtonTestID: 'qa_oversight_tab_operations' }}
      />
      <Tab.Screen
        component={OversightTicketsScreen}
        name="OversightTickets"
        options={{ title: 'Tickets', tabBarButtonTestID: 'qa_oversight_tab_tickets' }}
      />
      {profile?.role === 'society_manager' ? (
        <Tab.Screen
          component={PostAnnouncementScreen}
          name="OversightAnnouncements"
          options={{ title: 'Post Notice', tabBarButtonTestID: 'qa_oversight_tab_announcements' }}
        />
      ) : null}
    </Tab.Navigator>
  );
}
