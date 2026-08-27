import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BuyerNavigator } from './BuyerNavigator';
import { GuardNavigator } from './GuardNavigator';
import { HRMSNavigator } from './HRMSNavigator';
import { OversightNavigator } from './OversightNavigator';
import { ResidentNavigator } from './ResidentNavigator';
import { ServiceNavigator } from './ServiceNavigator';
import { SupplierNavigator } from './SupplierNavigator';
import { RoleLandingScreen } from '../screens/app/RoleLandingScreen';
import { isServiceRole } from '../lib/roleAliases';
import type { AppRole } from '../types/app';
import type { RoleStackParamList } from './types';

const Stack = createNativeStackNavigator<RoleStackParamList>();

interface RoleNavigatorProps {
  role: AppRole | null;
}

const NAVIGATORS: Partial<Record<AppRole, React.ComponentType>> = {
  security_guard: GuardNavigator,
  employee: HRMSNavigator,
  resident: ResidentNavigator,
  security_supervisor: OversightNavigator,
  society_manager: OversightNavigator,
  buyer: BuyerNavigator,
  supplier: SupplierNavigator,
  vendor: SupplierNavigator,
};

export function RoleNavigator({ role }: RoleNavigatorProps) {
  if (role) {
    const Navigator = NAVIGATORS[role];
    if (Navigator) {
      return <Navigator />;
    }
    if (isServiceRole(role)) {
      return <ServiceNavigator />;
    }
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        component={RoleLandingScreen}
        initialParams={{ role }}
        name="RoleLanding"
      />
    </Stack.Navigator>
  );
}
