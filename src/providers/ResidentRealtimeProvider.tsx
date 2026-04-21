import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';
import { isPreviewProfile } from '../lib/mobileBackend';
import { useAppStore } from '../store/useAppStore';
import { useResidentPresenceStore } from '../store/useResidentPresenceStore';

interface ResidentRealtimeContext {
  flatId: string;
  fullName: string | null;
  residentId: string;
}

function normalizePresenceMembers(
  state: Record<string, Array<Record<string, unknown>>>,
  currentUserId: string,
): Array<{
  residentId: string | null;
  surface: 'mobile' | 'web' | 'unknown';
  userId: string;
  fullName: string;
  joinedAt: string;
}> {
  const members = Object.values(state)
    .flat()
    .map((entry) => {
      const surface: 'mobile' | 'web' | 'unknown' =
        entry.surface === 'mobile' || entry.surface === 'web' ? entry.surface : 'unknown';

      return {
        residentId: typeof entry.residentId === 'string' ? entry.residentId : null,
        surface,
        userId: typeof entry.userId === 'string' ? entry.userId : '',
        fullName:
          typeof entry.fullName === 'string' && entry.fullName.trim().length
            ? entry.fullName.trim()
            : 'Resident',
        joinedAt:
          typeof entry.joinedAt === 'string' && entry.joinedAt.trim().length
            ? entry.joinedAt
            : new Date().toISOString(),
      };
    })
    .filter((entry) => entry.userId && entry.userId !== currentUserId);

  const deduped = new Map<string, (typeof members)[number]>();

  for (const member of members) {
    const existing = deduped.get(member.userId);

    if (!existing || new Date(member.joinedAt).getTime() > new Date(existing.joinedAt).getTime()) {
      deduped.set(member.userId, member);
    }
  }

  return [...deduped.values()].sort((left, right) => left.fullName.localeCompare(right.fullName));
}

async function fetchResidentRealtimeContext(userId: string) {
  const { data, error } = await supabase
    .from('residents')
    .select('id, flat_id, full_name')
    .eq('auth_user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data?.id || !data.flat_id) {
    return null;
  }

  return {
    residentId: data.id,
    flatId: data.flat_id,
    fullName: data.full_name ?? null,
  } satisfies ResidentRealtimeContext;
}

export function ResidentRealtimeProvider() {
  const profile = useAppStore((state) => state.profile);
  const queryClient = useQueryClient();
  const setPresenceSnapshot = useResidentPresenceStore((state) => state.setPresenceSnapshot);
  const resetPresence = useResidentPresenceStore((state) => state.reset);

  useEffect(() => {
    if (!profile || profile.role !== 'resident' || isPreviewProfile(profile)) {
      resetPresence();
      return;
    }

    let isActive = true;
    let visitorChannel:
      | ReturnType<typeof supabase.channel>
      | null = null;
    let presenceChannel:
      | ReturnType<typeof supabase.channel>
      | null = null;

    const connect = async () => {
      const residentContext = await fetchResidentRealtimeContext(profile.userId);

      if (!isActive || !residentContext) {
        resetPresence();
        return;
      }

      visitorChannel = supabase
        .channel(`resident-visitors:${residentContext.flatId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'visitors',
            filter: `flat_id=eq.${residentContext.flatId}`,
          },
          () => {
            void queryClient.invalidateQueries({
              queryKey: ['resident', 'pending-visitors', profile.userId],
            });
          },
        )
        .subscribe();

      presenceChannel = supabase.channel(`resident-presence:${residentContext.flatId}`, {
        config: {
          presence: {
            key: profile.userId,
          },
        },
      });

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const members = normalizePresenceMembers(presenceChannel!.presenceState(), profile.userId);
          setPresenceSnapshot({
            flatId: residentContext.flatId,
            hasLiveSync: true,
            members,
          });
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel?.track({
              userId: profile.userId,
              residentId: residentContext.residentId,
              fullName: residentContext.fullName ?? profile.fullName ?? 'Resident',
              surface: 'mobile',
              joinedAt: new Date().toISOString(),
            });
          }

          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            setPresenceSnapshot({
              flatId: residentContext.flatId,
              hasLiveSync: false,
              members: [],
            });
          }
        });
    };

    void connect();

    return () => {
      isActive = false;
      resetPresence();

      if (visitorChannel) {
        void supabase.removeChannel(visitorChannel);
      }

      if (presenceChannel) {
        void supabase.removeChannel(presenceChannel);
      }
    };
  }, [profile, queryClient, resetPresence, setPresenceSnapshot]);

  return null;
}
