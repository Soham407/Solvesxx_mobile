import { useEffect } from 'react';

import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

export function useAppBootstrap() {
  const bootstrap = useAppStore((state) => state.bootstrap);

  useEffect(() => {
    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void useAppStore
        .getState()
        .handleSession(session, { lockWithBiometrics: false });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [bootstrap]);
}
