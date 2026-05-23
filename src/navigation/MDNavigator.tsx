import { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BarChart3, CheckSquare } from 'lucide-react-native';

import { LoadingScreen } from '../components/shared/LoadingScreen';
import { Spacing } from '../constants/spacing';
import { FontFamily, FontSize } from '../constants/typography';
import { useAppTheme } from '../hooks/useAppTheme';
import { MDApprovalsScreen } from '../screens/company_md/MDApprovalsScreen';
import { MDHomeScreen } from '../screens/company_md/MDHomeScreen';
import { useAppStore } from '../store/useAppStore';
import { useMDStore } from '../store/useMDStore';
import type { MDTabParamList } from './types';

const Tab = createBottomTabNavigator<MDTabParamList>();

export function MDNavigator() {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const bootstrap = useMDStore((state) => state.bootstrap);
  const hasHydrated = useMDStore((state) => state.hasHydrated);

  useEffect(() => {
    void bootstrap(profile);
  }, [bootstrap, profile]);

  if (!hasHydrated) {
    return <LoadingScreen />;
  }

  return (
    <Tab.Navigator
      initialRouteName="MDHome"
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
          route.name === 'MDApprovals' ? (
            <CheckSquare color={color} size={size} />
          ) : (
            <BarChart3 color={color} size={size} />
          ),
      })}
    >
      <Tab.Screen
        component={MDHomeScreen}
        name="MDHome"
        options={{ title: 'Overview', tabBarButtonTestID: 'qa_md_tab_home' }}
      />
      <Tab.Screen
        component={MDApprovalsScreen}
        name="MDApprovals"
        options={{ title: 'Approvals', tabBarButtonTestID: 'qa_md_tab_approvals' }}
      />
    </Tab.Navigator>
  );
}
