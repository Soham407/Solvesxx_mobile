import { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FileText, House, ShoppingCart, Star } from 'lucide-react-native';

import { LoadingScreen } from '../components/shared/LoadingScreen';
import { Spacing } from '../constants/spacing';
import { FontFamily, FontSize } from '../constants/typography';
import { useAppTheme } from '../hooks/useAppTheme';
import { BuyerFeedbackScreen } from '../screens/buyer/BuyerFeedbackScreen';
import { BuyerHomeScreen } from '../screens/buyer/BuyerHomeScreen';
import { BuyerInvoicesScreen } from '../screens/buyer/BuyerInvoicesScreen';
import { BuyerRequestsScreen } from '../screens/buyer/BuyerRequestsScreen';
import { useAppStore } from '../store/useAppStore';
import { useBuyerStore } from '../store/useBuyerStore';
import type { BuyerTabParamList } from './types';

const Tab = createBottomTabNavigator<BuyerTabParamList>();

export function BuyerNavigator() {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const bootstrap = useBuyerStore((state) => state.bootstrap);
  const hasHydrated = useBuyerStore((state) => state.hasHydrated);

  useEffect(() => {
    void bootstrap(profile);
  }, [bootstrap, profile]);

  if (!hasHydrated) {
    return <LoadingScreen />;
  }

  return (
    <Tab.Navigator
      initialRouteName="BuyerHome"
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
          if (route.name === 'BuyerRequests') {
            return <ShoppingCart color={color} size={size} />;
          }

          if (route.name === 'BuyerInvoices') {
            return <FileText color={color} size={size} />;
          }

          if (route.name === 'BuyerFeedback') {
            return <Star color={color} size={size} />;
          }

          return <House color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen component={BuyerHomeScreen} name="BuyerHome" options={{ title: 'Home' }} />
      <Tab.Screen component={BuyerRequestsScreen} name="BuyerRequests" options={{ title: 'Requests' }} />
      <Tab.Screen component={BuyerInvoicesScreen} name="BuyerInvoices" options={{ title: 'Invoices' }} />
      <Tab.Screen component={BuyerFeedbackScreen} name="BuyerFeedback" options={{ title: 'Feedback' }} />
    </Tab.Navigator>
  );
}
