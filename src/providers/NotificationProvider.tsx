import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';

import { useAppStore } from '../store/useAppStore';
import { useNotificationStore } from '../store/useNotificationStore';

export function NotificationProvider() {
  const profile = useAppStore((state) => state.profile);
  const session = useAppStore((state) => state.session);
  const bootstrap = useNotificationStore((state) => state.bootstrap);
  const registerDevice = useNotificationStore((state) => state.registerDevice);

  useEffect(() => {
    void bootstrap(profile);
  }, [bootstrap, profile]);

  useEffect(() => {
    if (!profile || !session) {
      return;
    }

    void registerDevice(profile);
  }, [profile, registerDevice, session]);

  useEffect(() => {
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      void useNotificationStore.getState().ingestDeliveredNotification(notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const recordId =
        typeof response.notification.request.content.data?.recordId === 'string'
          ? response.notification.request.content.data.recordId
          : null;

      if (recordId) {
        void useNotificationStore.getState().ingestDeliveredNotification(response.notification);
        void useNotificationStore.getState().markRead(recordId);
      }
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return null;
}
