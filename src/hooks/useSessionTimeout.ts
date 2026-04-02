import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useAppStore } from '../store/useAppStore';

const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000;
const BIOMETRIC_RELOCK_MS = 5 * 60 * 1000;

export function useSessionTimeout() {
  const session = useAppStore((state) => state.session);
  const onboarding = useAppStore((state) => state.onboarding);
  const biometricCapability = useAppStore((state) => state.biometricCapability);
  const lastActivityAt = useAppStore((state) => state.lastActivityAt);
  const recordActivity = useAppStore((state) => state.recordActivity);
  const setBiometricLocked = useAppStore((state) => state.setBiometricLocked);
  const signOut = useAppStore((state) => state.signOut);

  useEffect(() => {
    if (!session) {
      return;
    }

    const checkTimeout = () => {
      if (!lastActivityAt) {
        return;
      }

      if (Date.now() - lastActivityAt >= SESSION_TIMEOUT_MS) {
        void signOut();
      }
    };

    checkTimeout();

    const interval = setInterval(checkTimeout, 60000);
    return () => clearInterval(interval);
  }, [lastActivityAt, session, signOut]);

  useEffect(() => {
    let backgroundedAt: number | null = null;

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        if (lastActivityAt && Date.now() - lastActivityAt >= SESSION_TIMEOUT_MS) {
          void signOut();
          return;
        }

        if (
          session &&
          onboarding.biometricEnabled &&
          biometricCapability.available &&
          backgroundedAt &&
          Date.now() - backgroundedAt >= BIOMETRIC_RELOCK_MS
        ) {
          setBiometricLocked(true);
        }

        backgroundedAt = null;
        void recordActivity(true);
        return;
      }

      if (nextAppState === 'background' || nextAppState === 'inactive') {
        backgroundedAt = Date.now();
      }
    });

    return () => subscription.remove();
  }, [
    biometricCapability.available,
    lastActivityAt,
    onboarding.biometricEnabled,
    recordActivity,
    session,
    setBiometricLocked,
    signOut,
  ]);
}
