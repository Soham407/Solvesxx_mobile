import { StyleSheet, Text, View } from 'react-native';
import { BellRing, LogIn, UserCheck, UserRound } from 'lucide-react-native';

import { MetricCard } from '../../components/guard/MetricCard';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useAdminStore } from '../../store/useAdminStore';

export function AdminHomeScreen() {
  const { colors } = useAppTheme();
  const isLoading = useAdminStore((state) => state.isLoading);
  const activeUsersCount = useAdminStore((state) => state.activeUsersCount);
  const loginsToday = useAdminStore((state) => state.loginsToday);
  const pendingOnboarding = useAdminStore((state) => state.pendingOnboarding);
  const systemAlerts = useAdminStore((state) => state.systemAlerts);

  return (
    <ScreenShell
      eyebrow="Admin"
      title="Admin Dashboard"
      description="Track user activity, onboarding progress, and platform alerts from a single control surface."
    >
      {isLoading ? (
        <InfoCard>
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading dashboard data...</Text>
        </InfoCard>
      ) : null}

      <View style={styles.metricsGrid}>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<UserCheck color={colors.success} size={20} />}
            label="Active users"
            value={String(activeUsersCount)}
          />
        </View>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<LogIn color={colors.info} size={20} />}
            label="Logins today"
            value={String(loginsToday)}
          />
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<UserRound color={colors.warning} size={20} />}
            label="Pending onboarding"
            value={String(pendingOnboarding)}
          />
        </View>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<BellRing color={colors.destructive} size={20} />}
            label="System alerts"
            value={String(systemAlerts)}
          />
        </View>
      </View>

      <InfoCard>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Operations pulse</Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>Use the Users tab to search profiles, review last login activity, and deactivate access where needed.</Text>
      </InfoCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.base,
  },
  metricCell: {
    flex: 1,
  },
  loadingText: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
  },
  sectionTitle: {
    fontFamily: FontFamily.sansBold,
    fontSize: FontSize.lg,
  },
  description: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
});
