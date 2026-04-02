import { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FileText, House, Package, Truck } from 'lucide-react-native';

import { LoadingScreen } from '../components/shared/LoadingScreen';
import { Spacing } from '../constants/spacing';
import { FontFamily, FontSize } from '../constants/typography';
import { useAppTheme } from '../hooks/useAppTheme';
import { SupplierBillingScreen } from '../screens/supplier/SupplierBillingScreen';
import { SupplierHomeScreen } from '../screens/supplier/SupplierHomeScreen';
import { SupplierIndentsScreen } from '../screens/supplier/SupplierIndentsScreen';
import { SupplierOrdersScreen } from '../screens/supplier/SupplierOrdersScreen';
import { useAppStore } from '../store/useAppStore';
import { useSupplierStore } from '../store/useSupplierStore';
import type { SupplierTabParamList } from './types';

const Tab = createBottomTabNavigator<SupplierTabParamList>();

export function SupplierNavigator() {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const bootstrap = useSupplierStore((state) => state.bootstrap);
  const hasHydrated = useSupplierStore((state) => state.hasHydrated);

  useEffect(() => {
    void bootstrap(profile);
  }, [bootstrap, profile]);

  if (!hasHydrated) {
    return <LoadingScreen />;
  }

  return (
    <Tab.Navigator
      initialRouteName="SupplierHome"
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
          if (route.name === 'SupplierIndents') {
            return <Package color={color} size={size} />;
          }

          if (route.name === 'SupplierOrders') {
            return <Truck color={color} size={size} />;
          }

          if (route.name === 'SupplierBilling') {
            return <FileText color={color} size={size} />;
          }

          return <House color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen component={SupplierHomeScreen} name="SupplierHome" options={{ title: 'Home' }} />
      <Tab.Screen component={SupplierIndentsScreen} name="SupplierIndents" options={{ title: 'Indents' }} />
      <Tab.Screen component={SupplierOrdersScreen} name="SupplierOrders" options={{ title: 'Orders' }} />
      <Tab.Screen component={SupplierBillingScreen} name="SupplierBilling" options={{ title: 'Billing' }} />
    </Tab.Navigator>
  );
}
