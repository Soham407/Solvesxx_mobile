import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { FileText, Package, Truck, TrendingUp } from 'lucide-react-native';

import { MetricCard } from '../../components/guard/MetricCard';
import { StatusChip } from '../../components/guard/StatusChip';
import { ActionButton } from '../../components/shared/ActionButton';
import { InfoCard } from '../../components/shared/InfoCard';
import { NotificationInboxCard } from '../../components/shared/NotificationInboxCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { SupplierTabParamList } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import { useSupplierStore } from '../../store/useSupplierStore';

type SupplierHomeScreenProps = BottomTabScreenProps<SupplierTabParamList, 'SupplierHome'>;

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function formatValue(value: string | null) {
  if (!value) {
    return 'Not yet';
  }

  return new Date(value).toLocaleString([], {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  });
}

export function SupplierHomeScreen({ navigation }: SupplierHomeScreenProps) {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const signOut = useAppStore((state) => state.signOut);
  const role = useSupplierStore((state) => state.role);
  const indents = useSupplierStore((state) => state.indents);
  const pos = useSupplierStore((state) => state.pos);
  const bills = useSupplierStore((state) => state.bills);
  const refreshedAt = useSupplierStore((state) => state.refreshedAt);
  const refreshPortal = useSupplierStore((state) => state.refreshPortal);
  const [message, setMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const openIndents = useMemo(
    () => indents.filter((indent) => indent.status === 'indent_forwarded').length,
    [indents],
  );
  const activePOs = useMemo(
    () => pos.filter((po) => ['sent_to_vendor', 'acknowledged', 'dispatched'].includes(po.status)).length,
    [pos],
  );
  const totalBilled = useMemo(
    () => bills.reduce((sum, bill) => sum + bill.totalAmountPaise, 0),
    [bills],
  );
  const recentPOs = useMemo(
    () =>
      [...pos]
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
        .slice(0, 3),
    [pos],
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setMessage(null);

    try {
      await refreshPortal();
      setMessage('Supplier fulfillment board refreshed with the latest local PO state.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <ScreenShell
      eyebrow={role === 'vendor' ? 'Vendor Portal' : 'Supplier Portal'}
      title={`${role === 'vendor' ? 'Vendor' : 'Supplier'} fulfillment desk`}
      description="Review new indents, acknowledge purchase orders, dispatch work, and keep the billing queue moving from mobile."
    >
      <InfoCard>
        <View style={styles.headerRow}>
          <View style={styles.copyWrap}>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>
              {profile?.fullName ?? 'Supplier account'}
            </Text>
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>
              Last refresh: {formatValue(refreshedAt)}
            </Text>
          </View>
          <StatusChip label={openIndents ? `${openIndents} new indents` : 'Stable'} tone={openIndents ? 'warning' : 'success'} />
        </View>
        {message ? <Text style={[styles.caption, { color: colors.primary }]}>{message}</Text> : null}
        <View style={styles.actionGroup}>
          <ActionButton
            label={isRefreshing ? 'Refreshing...' : 'Refresh supplier feed'}
            loading={isRefreshing}
            onPress={() => void handleRefresh()}
          />
          <ActionButton label="Sign out" variant="ghost" onPress={() => void signOut()} />
        </View>
      </InfoCard>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<Package color={colors.warning} size={20} />}
            label="Open indents"
            value={String(openIndents)}
            caption={`${indents.length} total routed requests`}
          />
        </View>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<Truck color={colors.primary} size={20} />}
            label="Active POs"
            value={String(activePOs)}
            caption="Awaiting acknowledge or dispatch"
          />
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<FileText color={colors.info} size={20} />}
            label="Bills"
            value={String(bills.length)}
            caption="Submitted and approved bills"
          />
        </View>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<TrendingUp color={colors.success} size={20} />}
            label="Total billed"
            value={currencyFormatter.format(totalBilled / 100)}
            caption="Current mobile billing queue"
          />
        </View>
      </View>

      <InfoCard>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent purchase orders</Text>
        {recentPOs.length ? (
          recentPOs.map((po) => (
            <View key={po.id} style={styles.recordRow}>
              <View style={styles.copyWrap}>
                <Text style={[styles.recordTitle, { color: colors.foreground }]}>{po.poNumber}</Text>
                <Text style={[styles.caption, { color: colors.mutedForeground }]}>
                  {po.title} | {currencyFormatter.format(po.grandTotalPaise / 100)}
                </Text>
              </View>
              <StatusChip
                label={po.status.replace(/_/g, ' ')}
                tone={po.status === 'received' ? 'success' : po.status === 'acknowledged' ? 'warning' : 'info'}
              />
            </View>
          ))
        ) : (
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>
            Purchase orders will appear here after indent acceptance creates a supplier order.
          </Text>
        )}
      </InfoCard>

      <InfoCard>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick actions</Text>
        <View style={styles.actionGroup}>
          <ActionButton label="Review indents" variant="secondary" onPress={() => navigation.navigate('SupplierIndents')} />
          <ActionButton label="Manage orders" variant="secondary" onPress={() => navigation.navigate('SupplierOrders')} />
          <ActionButton label="Open billing" variant="ghost" onPress={() => navigation.navigate('SupplierBilling')} />
        </View>
      </InfoCard>

      <NotificationInboxCard
        title="Supplier notifications"
        description="Phase 7 previews the new-indent route and keeps a local trail of dispatch-ready supplier alerts."
        actions={[
          {
            label: 'Preview new indent',
            route: 'new_indent',
            variant: 'secondary',
          },
        ]}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    gap: Spacing.base,
    justifyContent: 'space-between',
  },
  copyWrap: {
    flex: 1,
    gap: Spacing.xs,
  },
  heroTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize['2xl'],
    lineHeight: 30,
  },
  caption: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  actionGroup: {
    gap: Spacing.base,
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
  recordRow: {
    flexDirection: 'row',
    gap: Spacing.base,
    justifyContent: 'space-between',
  },
  recordTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
});
