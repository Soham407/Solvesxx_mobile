import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarClock, Percent, Users } from 'lucide-react-native';

import { MetricCard } from '../../components/guard/MetricCard';
import { InfoCard } from '../../components/shared/InfoCard';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useAppStore } from '../../store/useAppStore';
import { useHODStore } from '../../store/useHODStore';

function toPercent(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

export function HODHomeScreen() {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const pendingLeaveCount = useHODStore((state) => state.pendingLeaveCount);
  const attendanceRate = useHODStore((state) => state.attendanceRate);
  const teamSize = useHODStore((state) => state.teamSize);
  const isLoading = useHODStore((state) => state.isLoading);
  const refresh = useHODStore((state) => state.refresh);
  const [refreshing, setRefreshing] = useState(false);

  const dashboardIsEmpty = useMemo(
    () => pendingLeaveCount === 0 && attendanceRate === 0 && teamSize === 0,
    [attendanceRate, pendingLeaveCount, teamSize],
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh(profile);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>HOD PORTAL</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>HOD Dashboard</Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>Track leave approvals, team attendance, and overall workforce health from one view.</Text>
        </View>

        {isLoading && dashboardIsEmpty ? (
          <InfoCard>
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={[styles.caption, { color: colors.mutedForeground }]}>Loading HOD dashboard...</Text>
            </View>
          </InfoCard>
        ) : null}

        <View style={styles.metricsGrid}>
          <View style={styles.metricCell}>
            <MetricCard
              icon={<CalendarClock color={colors.warning} size={20} />}
              label="Pending leave"
              value={String(pendingLeaveCount)}
            />
          </View>
          <View style={styles.metricCell}>
            <MetricCard
              icon={<Percent color={colors.primary} size={20} />}
              label="Today's attendance"
              value={toPercent(attendanceRate)}
            />
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCell}>
            <MetricCard
              icon={<Users color={colors.info} size={20} />}
              label="Team size"
              value={String(teamSize)}
            />
          </View>
          <View style={styles.metricCell}>
            <InfoCard>
              <View style={styles.statusCard}>
                <Text style={[styles.statusLabel, { color: colors.mutedForeground }]}>Status</Text>
                <Text style={[styles.statusValue, { color: colors.foreground }]}>
                  {isLoading ? 'Refreshing' : 'Updated'}
                </Text>
                <Text style={[styles.caption, { color: colors.mutedForeground }]}>Pull down to refresh this dashboard</Text>
              </View>
            </InfoCard>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['2xl'] + Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.xl,
  },
  header: {
    gap: Spacing.sm,
  },
  eyebrow: {
    fontFamily: FontFamily.sansExtraBold,
    fontSize: FontSize.xs,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize['3xl'],
    lineHeight: 36,
  },
  description: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    lineHeight: 24,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.base,
  },
  metricCell: {
    flex: 1,
  },
  loadingWrap: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusCard: {
    alignItems: 'center',
    gap: Spacing.xs,
    justifyContent: 'center',
    minHeight: 112,
  },
  statusLabel: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
  },
  statusValue: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize['2xl'],
    lineHeight: 28,
  },
  caption: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
});
