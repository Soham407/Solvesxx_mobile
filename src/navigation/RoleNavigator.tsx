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

export function RoleNavigator({ role }: RoleNavigatorProps) {
  if (role === 'security_guard') {
    return <GuardNavigator />;
  }

  if (role === 'employee') {
    return <HRMSNavigator />;
  }

  if (role === 'resident') {
    return <ResidentNavigator />;
  }

  if (
    role === 'security_supervisor' ||
    role === 'society_manager' ||
    role === 'admin' ||
    role === 'super_admin' ||
    role === 'company_md' ||
    role === 'company_hod' ||
    role === 'site_supervisor' ||
    role === 'account' ||
    role === 'storekeeper'
  ) {
    return <OversightNavigator />;
  }

  if (role === 'buyer') {
    return <BuyerNavigator />;
  }

  if (isServiceRole(role)) {
    return <ServiceNavigator />;
  }

  if (role === 'supplier' || role === 'vendor') {
    return <SupplierNavigator />;
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
