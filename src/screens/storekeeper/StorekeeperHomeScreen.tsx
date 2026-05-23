import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AlertTriangle, Boxes, PackageCheck } from 'lucide-react-native';

import { MetricCard } from '../../components/guard/MetricCard';
import { ActionButton } from '../../components/shared/ActionButton';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useAppStore } from '../../store/useAppStore';
import { useStorekeeperStore } from '../../store/useStorekeeperStore';

export function StorekeeperHomeScreen() {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const totalItems = useStorekeeperStore((state) => state.totalItems);
  const lowStockCount = useStorekeeperStore((state) => state.lowStockCount);
  const pendingGRNCount = useStorekeeperStore((state) => state.pendingGRNCount);
  const isLoading = useStorekeeperStore((state) => state.isLoading);
  const errorMessage = useStorekeeperStore((state) => state.errorMessage);
  const refresh = useStorekeeperStore((state) => state.refresh);

  return (
    <ScreenShell
      eyebrow="Storekeeper"
      title="Inventory Overview"
      description="Track stock health, identify low-inventory items, and clear pending goods receipt verification."
    >
      <InfoCard>
        <View style={styles.headerRow}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Warehouse snapshot</Text>
          <ActionButton label="Refresh" variant="secondary" onPress={() => refresh(profile)} />
        </View>
        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>Loading inventory data...</Text>
          </View>
        ) : null}
        {errorMessage ? <Text style={[styles.errorText, { color: colors.destructive }]}>{errorMessage}</Text> : null}
      </InfoCard>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<Boxes color={colors.primary} size={20} />}
            label="Total items in stock"
            value={String(totalItems)}
          />
        </View>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<AlertTriangle color={colors.warning} size={20} />}
            label="Low stock count"
            value={String(lowStockCount)}
          />
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<PackageCheck color={colors.info} size={20} />}
            label="Pending GRN count"
            value={String(pendingGRNCount)}
          />
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.base,
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: FontFamily.sansBold,
    fontSize: FontSize.lg,
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  caption: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
  },
  errorText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.base,
  },
  metricCell: {
    flex: 1,
  },
});
