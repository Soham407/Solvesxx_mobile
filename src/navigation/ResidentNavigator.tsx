import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Bell, DoorOpen, House, Megaphone, Users } from 'lucide-react-native';

import { Spacing } from '../constants/spacing';
import { FontFamily, FontSize } from '../constants/typography';
import { useAppTheme } from '../hooks/useAppTheme';
import { ResidentRealtimeProvider } from '../providers/ResidentRealtimeProvider';
import { ResidentApprovalsScreen } from '../screens/resident/ResidentApprovalsScreen';
import { ResidentCommunityScreen } from '../screens/resident/ResidentCommunityScreen';
import { ResidentHomeScreen } from '../screens/resident/ResidentHomeScreen';
import { ResidentNotificationsScreen } from '../screens/resident/ResidentNotificationsScreen';
import { ResidentVisitorsScreen } from '../screens/resident/ResidentVisitorsScreen';
import type { ResidentTabParamList } from './types';

const Tab = createBottomTabNavigator<ResidentTabParamList>();

export function ResidentNavigator() {
  const { colors } = useAppTheme();

  return (
    <>
      <ResidentRealtimeProvider />
      <Tab.Navigator
        initialRouteName="ResidentHome"
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
            if (route.name === 'ResidentApprovals') {
              return <DoorOpen color={color} size={size} />;
            }

            if (route.name === 'ResidentVisitors') {
              return <Users color={color} size={size} />;
            }

            if (route.name === 'ResidentCommunity') {
              return <Megaphone color={color} size={size} />;
            }

            if (route.name === 'ResidentNotifications') {
              return <Bell color={color} size={size} />;
            }

            return <House color={color} size={size} />;
          },
        })}
      >
        <Tab.Screen
          component={ResidentHomeScreen}
          name="ResidentHome"
          options={{ title: 'Home', tabBarButtonTestID: 'qa_resident_tab_home' }}
        />
        <Tab.Screen
          component={ResidentApprovalsScreen}
          name="ResidentApprovals"
          options={{ title: 'Approvals', tabBarButtonTestID: 'qa_resident_tab_approvals' }}
        />
        <Tab.Screen
          component={ResidentVisitorsScreen}
          name="ResidentVisitors"
          options={{ title: 'Visitors', tabBarButtonTestID: 'qa_resident_tab_visitors' }}
        />
        <Tab.Screen
          component={ResidentCommunityScreen}
          name="ResidentCommunity"
          options={{ title: 'Community', tabBarButtonTestID: 'qa_resident_tab_community' }}
        />
        <Tab.Screen
          component={ResidentNotificationsScreen}
          name="ResidentNotifications"
          options={{ title: 'Alerts', tabBarButtonTestID: 'qa_resident_tab_alerts' }}
        />
      </Tab.Navigator>
    </>
  );
}
