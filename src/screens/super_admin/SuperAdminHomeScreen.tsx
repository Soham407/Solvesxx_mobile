import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { AlertTriangle, Building2, TriangleAlert, Users } from 'lucide-react-native';

import { MetricCard } from '../../components/guard/MetricCard';
import { ActionButton } from '../../components/shared/ActionButton';
import { InfoCard } from '../../components/shared/InfoCard';
import { LoadingScreen } from '../../components/shared/LoadingScreen';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { SuperAdminTabParamList } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import { useSuperAdminStore } from '../../store/useSuperAdminStore';

type SuperAdminHomeScreenProps = BottomTabScreenProps<SuperAdminTabParamList, 'SuperAdminHome'>;

export function SuperAdminHomeScreen({ navigation }: SuperAdminHomeScreenProps) {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const hasHydrated = useSuperAdminStore((state) => state.hasHydrated);
  const totalCompanies = useSuperAdminStore((state) => state.totalCompanies);
  const totalActiveUsers = useSuperAdminStore((state) => state.totalActiveUsers);
  const activeIncidents = useSuperAdminStore((state) => state.activeIncidents);
  const criticalAlertCount = useSuperAdminStore((state) => state.criticalAlertCount);
  const refresh = useSuperAdminStore((state) => state.refresh);
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!hasHydrated) {
    return <LoadingScreen message="Loading platform overview..." />;
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      await refresh(profile);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <ScreenShell
      eyebrow="Super Admin"
      title="Platform Overview"
      description="Track global company adoption, user footprint, and critical incident pressure from one control surface."
    >
      <InfoCard>
        <Text style={[styles.heading, { color: colors.foreground }]}>Global summary</Text>
        <Text style={[styles.copy, { color: colors.mutedForeground }]}>Live aggregates from all registered companies.</Text>
        <View style={styles.actions}>
          <ActionButton
            label={isRefreshing ? 'Refreshing...' : 'Refresh platform data'}
            loading={isRefreshing}
            onPress={() => void handleRefresh()}
          />
          <ActionButton
            label="Open companies"
            variant="secondary"
            onPress={() => navigation.navigate('SuperAdminCompanies')}
          />
        </View>
      </InfoCard>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<Building2 color={colors.primary} size={20} />}
            label="Total companies"
            value={String(totalCompanies)}
            caption="Active organizations on the platform"
          />
        </View>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<Users color={colors.info} size={20} />}
            label="Active users"
            value={String(totalActiveUsers)}
            caption="Users currently active across companies"
          />
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<AlertTriangle color={colors.warning} size={20} />}
            label="Active incidents"
            value={String(activeIncidents)}
            caption="Open incidents requiring operational attention"
          />
        </View>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<TriangleAlert color={colors.destructive} size={20} />}
            label="Critical alerts"
            value={String(criticalAlertCount)}
            caption="Companies currently marked critical"
          />
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontFamily: FontFamily.sansBold,
    fontSize: FontSize.lg,
  },
  copy: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  actions: {
    gap: Spacing.base,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.base,
  },
  metricCell: {
    flex: 1,
  },
});
