import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { StatusChip } from '../../components/guard/StatusChip';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useStorekeeperStore } from '../../store/useStorekeeperStore';

export function StorekeeperAlertsScreen() {
  const { colors } = useAppTheme();
  const isLoading = useStorekeeperStore((state) => state.isLoading);
  const stockAlerts = useStorekeeperStore((state) => state.stockAlerts);

  return (
    <ScreenShell
      eyebrow="Storekeeper"
      title="Stock Alerts"
      description="Review low-stock items and prioritize replenishment before operations are impacted."
    >
      {isLoading ? (
        <InfoCard>
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>Loading stock alerts...</Text>
          </View>
        </InfoCard>
      ) : null}

      {!isLoading && stockAlerts.length === 0 ? (
        <InfoCard>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>All stock levels are healthy</Text>
        </InfoCard>
      ) : null}

      {!isLoading &&
        stockAlerts.map((alert) => (
          <InfoCard key={alert.id}>
            <View style={styles.headerRow}>
              <Text style={[styles.itemName, { color: colors.foreground }]}>{alert.itemName}</Text>
              <StatusChip label={alert.severity} tone={alert.severity === 'critical' ? 'danger' : 'warning'} />
            </View>
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>Location: {alert.locationName}</Text>
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>Current quantity: {alert.currentQuantity} {alert.unit}</Text>
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>Minimum threshold: {alert.minThreshold} {alert.unit}</Text>
          </InfoCard>
        ))}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.base,
    justifyContent: 'space-between',
  },
  itemName: {
    flex: 1,
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
  caption: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
  },
  emptyText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.base,
  },
});
