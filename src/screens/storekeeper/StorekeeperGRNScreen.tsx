import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusChip } from '../../components/guard/StatusChip';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useStorekeeperStore } from '../../store/useStorekeeperStore';

function formatDate(value: string) {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return 'Unknown date';
  }

  return timestamp.toLocaleDateString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function StorekeeperGRNScreen() {
  const { colors } = useAppTheme();
  const isLoading = useStorekeeperStore((state) => state.isLoading);
  const pendingGRNs = useStorekeeperStore((state) => state.pendingGRNs);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  return (
    <ScreenShell
      eyebrow="Storekeeper"
      title="Goods Receipt"
      description="Verify pending GRN records from suppliers and keep inbound inventory audit-ready."
    >
      {isLoading ? (
        <InfoCard>
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>Loading pending GRNs...</Text>
          </View>
        </InfoCard>
      ) : null}

      {!isLoading && pendingGRNs.length === 0 ? (
        <InfoCard>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No pending GRNs</Text>
        </InfoCard>
      ) : null}

      {!isLoading &&
        pendingGRNs.map((record) => {
          const isExpanded = expandedRecordId === record.id;

          return (
            <InfoCard key={record.id}>
              <Pressable
                onPress={() => setExpandedRecordId(isExpanded ? null : record.id)}
                style={styles.recordPressable}
              >
                <View style={styles.headerRow}>
                  <View style={styles.headerCopy}>
                    <Text style={[styles.recordTitle, { color: colors.foreground }]}>{record.grnNumber}</Text>
                    <Text style={[styles.caption, { color: colors.mutedForeground }]}>{record.supplierName}</Text>
                  </View>
                  <StatusChip label={record.status} tone={record.status === 'verified' ? 'success' : 'warning'} />
                </View>
                <Text style={[styles.caption, { color: colors.mutedForeground }]}>PO number: {record.poNumber}</Text>
                <Text style={[styles.caption, { color: colors.mutedForeground }]}>Items: {record.itemCount}</Text>
                <Text style={[styles.caption, { color: colors.mutedForeground }]}>Received date: {formatDate(record.receivedDate)}</Text>
                <Text style={[styles.toggleHint, { color: colors.primary }]}>
                  {isExpanded ? 'Tap to collapse details' : 'Tap to view details'}
                </Text>
              </Pressable>

              {isExpanded ? (
                <View style={[styles.detailBox, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
                  <Text style={[styles.detailText, { color: colors.foreground }]}>Supplier: {record.supplierName}</Text>
                  <Text style={[styles.detailText, { color: colors.foreground }]}>PO: {record.poNumber}</Text>
                  <Text style={[styles.detailText, { color: colors.foreground }]}>GRN status: {record.status}</Text>
                  <Text style={[styles.detailText, { color: colors.foreground }]}>Items listed: {record.itemCount}</Text>
                </View>
              ) : null}
            </InfoCard>
          );
        })}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  recordPressable: {
    gap: Spacing.xs,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.base,
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  recordTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
  caption: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
  },
  toggleHint: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
  detailBox: {
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    padding: Spacing.md,
  },
  detailText: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
  },
  emptyText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.base,
  },
});
