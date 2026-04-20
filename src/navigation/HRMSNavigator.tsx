import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CalendarDays, FileText, House, ShieldCheck, WalletCards } from 'lucide-react-native';

import { useAppTheme } from '../hooks/useAppTheme';
import { HrmsAttendanceScreen } from '../screens/hrms/HrmsAttendanceScreen';
import { HrmsDocumentsScreen } from '../screens/hrms/HrmsDocumentsScreen';
import { HrmsHomeScreen } from '../screens/hrms/HrmsHomeScreen';
import { HrmsLeaveScreen } from '../screens/hrms/HrmsLeaveScreen';
import { HrmsPayslipsScreen } from '../screens/hrms/HrmsPayslipsScreen';
import type { HRMSTabParamList } from './types';

const Tab = createBottomTabNavigator<HRMSTabParamList>();

export function HRMSNavigator() {
  const { colors } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tab.Screen
        component={HrmsHomeScreen}
        name="HRMSHome"
        options={{
          tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
          tabBarLabel: 'Home',
          tabBarButtonTestID: 'qa_hrms_tab_home',
        }}
      />
      <Tab.Screen
        component={HrmsAttendanceScreen}
        name="HRMSAttendance"
        options={{
          tabBarIcon: ({ color, size }) => <ShieldCheck color={color} size={size} />,
          tabBarLabel: 'Attendance',
          tabBarButtonTestID: 'qa_hrms_tab_attendance',
        }}
      />
      <Tab.Screen
        component={HrmsLeaveScreen}
        name="HRMSLeave"
        options={{
          tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} />,
          tabBarLabel: 'Leave',
          tabBarButtonTestID: 'qa_hrms_tab_leave',
        }}
      />
      <Tab.Screen
        component={HrmsPayslipsScreen}
        name="HRMSPayslips"
        options={{
          tabBarIcon: ({ color, size }) => <WalletCards color={color} size={size} />,
          tabBarLabel: 'Payslips',
          tabBarButtonTestID: 'qa_hrms_tab_payslips',
        }}
      />
      <Tab.Screen
        component={HrmsDocumentsScreen}
        name="HRMSDocuments"
        options={{
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
          tabBarLabel: 'Documents',
          tabBarButtonTestID: 'qa_hrms_tab_documents',
        }}
      />
    </Tab.Navigator>
  );
}
