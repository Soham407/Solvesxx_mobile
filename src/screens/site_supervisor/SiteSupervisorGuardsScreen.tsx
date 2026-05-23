import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { StatusChip } from '../../components/guard/StatusChip';
import { ActionButton } from '../../components/shared/ActionButton';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { SiteSupervisorTabParamList } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import { useSiteSupervisorStore } from '../../store/useSiteSupervisorStore';

type SiteSupervisorGuardsScreenProps = BottomTabScreenProps<
  SiteSupervisorTabParamList,
  'SiteSupervisorGuards'
>;

function formatShiftStart(value: string) {
  return new Date(value).toLocaleString([], {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  });
}

function formatTimeAgo(value: string | null) {
  if (!value) {
    return 'No ping';
  }

  const ms = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(ms / (1000 * 60)));

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getStatusTone(status: 'active' | 'overdue-checkin' | 'offline') {
  if (status === 'active') {
    return 'success';
  }

  if (status === 'overdue-checkin') {
    return 'warning';
  }

  return 'danger';
}

function formatStatusLabel(status: 'active' | 'overdue-checkin' | 'offline') {
  return status.replace('-', ' ');
}

export function SiteSupervisorGuardsScreen(_props: SiteSupervisorGuardsScreenProps) {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const guards = useSiteSupervisorStore((state) => state.guards);
  const isLoading = useSiteSupervisorStore((state) => state.isLoading);
  const refresh = useSiteSupervisorStore((state) => state.refresh);
  const error = useSiteSupervisorStore((state) => state.error);

  const sortedGuards = useMemo(
    () =>
      [...guards].sort(
        (left, right) => new Date(right.shiftStart).getTime() - new Date(left.shiftStart).getTime(),
      ),
    [guards],
  );

  return (
    <ScreenShell
      eyebrow="Field Coverage"
      title="Guard Roster"
      description="Monitor on-shift guards with quick visibility into shift starts, GPS recency, and field status."
    >
      <InfoCard>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Shift roster</Text>
        <Text style={[styles.caption, { color: colors.mutedForeground }]}>Current on-shift assignments for this site.</Text>
        <ActionButton
          label={isLoading ? 'Refreshing...' : 'Refresh roster'}
          loading={isLoading}
          onPress={() => refresh(profile)}
          variant="secondary"
        />
        {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}
      </InfoCard>

      {isLoading ? (
        <InfoCard>
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>Loading guard roster...</Text>
        </InfoCard>
      ) : sortedGuards.length ? (
        sortedGuards.map((guard, index) => (
          <InfoCard key={guard.id}>
            <View style={styles.headerRow} testID={`qa_sitesup_guard_row_${index}`}>
              <View style={styles.copyWrap}>
                <Text style={[styles.guardName, { color: colors.foreground }]}>{guard.guardName}</Text>
                <Text style={[styles.caption, { color: colors.mutedForeground }]}>Shift start: {formatShiftStart(guard.shiftStart)}</Text>
                <Text style={[styles.caption, { color: colors.foreground }]}>Last GPS ping: {formatTimeAgo(guard.lastGpsPing)}</Text>
              </View>
              <StatusChip label={formatStatusLabel(guard.status)} tone={getStatusTone(guard.status)} />
            </View>
          </InfoCard>
        ))
      ) : (
        <InfoCard>
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>No guards currently on shift</Text>
        </InfoCard>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontFamily: FontFamily.sansBold,
    fontSize: FontSize.lg,
  },
  caption: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  errorText: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  headerRow: {
    flexDirection: 'row',
    gap: Spacing.base,
    justifyContent: 'space-between',
  },
  copyWrap: {
    flex: 1,
    gap: Spacing.xs,
  },
  guardName: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
});
