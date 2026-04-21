import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { NotificationInboxCard } from '../../components/shared/NotificationInboxCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import type { ResidentTabParamList } from '../../navigation/types';

type ResidentNotificationsScreenProps = BottomTabScreenProps<
  ResidentTabParamList,
  'ResidentNotifications'
>;

export function ResidentNotificationsScreen(_props: ResidentNotificationsScreenProps) {
  return (
    <ScreenShell
      eyebrow="Resident Alerts"
      title="Alerts and updates"
      description="Review gate decisions and community updates in one place."
    >
      <NotificationInboxCard
        title="Recent updates"
        description="Visitor decisions, building alerts, and important notices appear here."
        endUserMode
        maxItems={12}
      />
    </ScreenShell>
  );
}
