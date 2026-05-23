import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { StatusChip } from '../../components/guard/StatusChip';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useHODStore } from '../../store/useHODStore';

function getStatusTone(status: 'present' | 'absent' | 'late' | 'unknown') {
  if (status === 'present') {
    return 'success' as const;
  }

  if (status === 'late') {
    return 'warning' as const;
  }

  if (status === 'absent') {
    return 'danger' as const;
  }

  return 'default' as const;
}

export function HODTeamScreen() {
  const { colors } = useAppTheme();
  const teamMembers = useHODStore((state) => state.teamMembers);
  const isLoading = useHODStore((state) => state.isLoading);

  const hasTeamMembers = useMemo(() => teamMembers.length > 0, [teamMembers]);

  return (
    <ScreenShell
      eyebrow="HOD PORTAL"
      title="My Team"
      description="View your team roster and today's attendance status at a glance."
    >
      {isLoading && !hasTeamMembers ? (
        <InfoCard>
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>Loading team data...</Text>
          </View>
        </InfoCard>
      ) : null}

      {hasTeamMembers ? (
        teamMembers.map((teamMember) => (
          <InfoCard key={teamMember.id}>
            <View style={styles.rowHeader}>
              <View style={styles.copyWrap}>
                <Text style={[styles.name, { color: colors.foreground }]}>{teamMember.name}</Text>
                <Text style={[styles.caption, { color: colors.mutedForeground }]}>{teamMember.designation}</Text>
              </View>
              <StatusChip label={teamMember.attendanceStatus} tone={getStatusTone(teamMember.attendanceStatus)} />
            </View>
          </InfoCard>
        ))
      ) : (
        <InfoCard>
          <Text style={[styles.emptyState, { color: colors.mutedForeground }]}>No team members found</Text>
        </InfoCard>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rowHeader: {
    flexDirection: 'row',
    gap: Spacing.base,
    justifyContent: 'space-between',
  },
  copyWrap: {
    flex: 1,
    gap: Spacing.xs,
  },
  name: {
    fontFamily: FontFamily.sansBold,
    fontSize: FontSize.lg,
  },
  caption: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  emptyState: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.base,
    lineHeight: 22,
    textAlign: 'center',
  },
});
