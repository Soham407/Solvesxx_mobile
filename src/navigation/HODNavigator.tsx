import { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CheckSquare, House, Users } from 'lucide-react-native';

import { LoadingScreen } from '../components/shared/LoadingScreen';
import { Spacing } from '../constants/spacing';
import { FontFamily, FontSize } from '../constants/typography';
import { useAppTheme } from '../hooks/useAppTheme';
import { HODApprovalsScreen } from '../screens/company_hod/HODApprovalsScreen';
import { HODHomeScreen } from '../screens/company_hod/HODHomeScreen';
import { HODTeamScreen } from '../screens/company_hod/HODTeamScreen';
import { useAppStore } from '../store/useAppStore';
import { useHODStore } from '../store/useHODStore';
import type { HODTabParamList } from './types';

const Tab = createBottomTabNavigator<HODTabParamList>();

export function HODNavigator() {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const bootstrap = useHODStore((state) => state.bootstrap);
  const hasHydrated = useHODStore((state) => state.hasHydrated);

  useEffect(() => {
    void bootstrap(profile);
  }, [bootstrap, profile]);

  if (!hasHydrated) {
    return <LoadingScreen />;
  }

  return (
    <Tab.Navigator
      initialRouteName="HODHome"
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
          if (route.name === 'HODApprovals') {
            return <CheckSquare color={color} size={size} />;
          }

          if (route.name === 'HODTeam') {
            return <Users color={color} size={size} />;
          }

          return <House color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen
        component={HODHomeScreen}
        name="HODHome"
        options={{ title: 'Home', tabBarButtonTestID: 'qa_hod_tab_home' }}
      />
      <Tab.Screen
        component={HODApprovalsScreen}
        name="HODApprovals"
        options={{ title: 'Approvals', tabBarButtonTestID: 'qa_hod_tab_approvals' }}
      />
      <Tab.Screen
        component={HODTeamScreen}
        name="HODTeam"
        options={{ title: 'Team', tabBarButtonTestID: 'qa_hod_tab_team' }}
      />
    </Tab.Navigator>
  );
}
