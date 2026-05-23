import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { AlertTriangle, BarChart3, Building2, Users } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MetricCard } from '../../components/guard/MetricCard';
import { InfoCard } from '../../components/shared/InfoCard';
import { LoadingScreen } from '../../components/shared/LoadingScreen';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { MDTabParamList } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import { useMDStore } from '../../store/useMDStore';

type MDHomeScreenProps = BottomTabScreenProps<MDTabParamList, 'MDHome'>;

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function MDHomeScreen(_props: MDHomeScreenProps) {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const hasHydrated = useMDStore((state) => state.hasHydrated);
  const monthlyRevenue = useMDStore((state) => state.monthlyRevenue);
  const headcount = useMDStore((state) => state.headcount);
  const activeIncidents = useMDStore((state) => state.activeIncidents);
  const pendingApprovalCount = useMDStore((state) => state.pendingApprovalCount);
  const refresh = useMDStore((state) => state.refresh);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const formattedRevenue = useMemo(
    () => currencyFormatter.format(Math.max(0, monthlyRevenue)),
    [monthlyRevenue],
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh(profile);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!hasHydrated) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: colors.background }}
      >
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>MD Dashboard</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Executive Overview</Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            Track revenue health, workforce strength, live security posture, and high-value approvals from one executive view.
          </Text>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCell}>
            <MetricCard
              icon={<BarChart3 color={colors.primary} size={20} />}
              label="Monthly revenue"
              value={formattedRevenue}
            />
          </View>
          <View style={styles.metricCell}>
            <MetricCard icon={<Users color={colors.success} size={20} />} label="Total headcount" value={String(headcount)} />
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCell}>
            <MetricCard
              icon={<AlertTriangle color={colors.warning} size={20} />}
              label="Active security incidents"
              value={String(activeIncidents)}
            />
          </View>
          <View style={styles.metricCell}>
            <MetricCard
              icon={<Building2 color={colors.info} size={20} />}
              label="Pending high-value approvals"
              value={String(pendingApprovalCount)}
            />
          </View>
        </View>

        <InfoCard>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Snapshot notes</Text>
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>
            Pull down to refresh this overview with the latest executive summary and approval queue.
          </Text>
        </InfoCard>
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
    textTransform: 'uppercase',
    letterSpacing: 2,
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
  sectionTitle: {
    fontFamily: FontFamily.sansBold,
    fontSize: FontSize.lg,
  },
  caption: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
});
