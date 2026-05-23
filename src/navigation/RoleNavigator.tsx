import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AccountNavigator } from './AccountNavigator';
import { AdminNavigator } from './AdminNavigator';
import { BuyerNavigator } from './BuyerNavigator';
import { GuardNavigator } from './GuardNavigator';
import { HODNavigator } from './HODNavigator';
import { HRMSNavigator } from './HRMSNavigator';
import { MDNavigator } from './MDNavigator';
import { OversightNavigator } from './OversightNavigator';
import { ResidentNavigator } from './ResidentNavigator';
import { ServiceNavigator } from './ServiceNavigator';
import { SiteSupervisorNavigator } from './SiteSupervisorNavigator';
import { StorekeeperNavigator } from './StorekeeperNavigator';
import { SupplierNavigator } from './SupplierNavigator';
import { SuperAdminNavigator } from './SuperAdminNavigator';
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

  if (role === 'security_supervisor' || role === 'society_manager') {
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

  if (role === 'company_hod') {
    return <HODNavigator />;
  }

  if (role === 'account') {
    return <AccountNavigator />;
  }

  if (role === 'storekeeper') {
    return <StorekeeperNavigator />;
  }

  if (role === 'site_supervisor') {
    return <SiteSupervisorNavigator />;
  }

  if (role === 'company_md') {
    return <MDNavigator />;
  }

  if (role === 'admin') {
    return <AdminNavigator />;
  }

  if (role === 'super_admin') {
    return <SuperAdminNavigator />;
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
