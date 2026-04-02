import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Clock3, FileText, ShoppingCart, TrendingUp } from 'lucide-react-native';

import { MetricCard } from '../../components/guard/MetricCard';
import { StatusChip } from '../../components/guard/StatusChip';
import { ActionButton } from '../../components/shared/ActionButton';
import { InfoCard } from '../../components/shared/InfoCard';
import { NotificationInboxCard } from '../../components/shared/NotificationInboxCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { BuyerTabParamList } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import { useBuyerStore } from '../../store/useBuyerStore';

type BuyerHomeScreenProps = BottomTabScreenProps<BuyerTabParamList, 'BuyerHome'>;

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

export function BuyerHomeScreen({ navigation }: BuyerHomeScreenProps) {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const signOut = useAppStore((state) => state.signOut);
  const requests = useBuyerStore((state) => state.requests);
  const invoices = useBuyerStore((state) => state.invoices);
  const feedback = useBuyerStore((state) => state.feedback);
  const refreshedAt = useBuyerStore((state) => state.refreshedAt);
  const refreshDashboard = useBuyerStore((state) => state.refreshDashboard);
  const [message, setMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const pendingCount = useMemo(
    () => requests.filter((request) => request.status === 'pending').length,
    [requests],
  );
  const activeCount = useMemo(
    () =>
      requests.filter((request) =>
        ['indent_forwarded', 'po_issued', 'po_received', 'po_dispatched', 'material_received', 'bill_generated'].includes(
          request.status,
        ),
      ).length,
    [requests],
  );
  const completedCount = useMemo(
    () => requests.filter((request) => request.status === 'completed').length,
    [requests],
  );
  const outstandingAmount = useMemo(
    () => invoices.reduce((sum, invoice) => sum + invoice.dueAmountPaise, 0),
    [invoices],
  );
  const recentRequests = useMemo(
    () =>
      [...requests]
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
        .slice(0, 3),
    [requests],
  );
  const latestInvoice = useMemo(
    () =>
      [...invoices].sort(
        (left, right) => new Date(right.invoiceDate).getTime() - new Date(left.invoiceDate).getTime(),
      )[0] ?? null,
    [invoices],
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setMessage(null);

    try {
      await refreshDashboard();
      setMessage('Buyer order timeline refreshed with the latest local workflow state.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <ScreenShell
      eyebrow="Buyer Portal"
      title={`Order and requisition desk for ${profile?.fullName?.split(' ')[0] ?? 'Buyer'}`}
      description="Create service or material requests, track open orders, and keep invoice follow-up visible from one mobile workspace."
    >
      <InfoCard>
        <View style={styles.headerRow}>
          <View style={styles.copyWrap}>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>Fulfillment pulse</Text>
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>
              Last refresh: {formatValue(refreshedAt)}
            </Text>
          </View>
          <StatusChip
            label={pendingCount ? `${pendingCount} pending` : 'Moving'}
            tone={pendingCount ? 'warning' : 'success'}
          />
        </View>
        {message ? <Text style={[styles.caption, { color: colors.primary }]}>{message}</Text> : null}
        <View style={styles.actionGroup}>
          <ActionButton
            label={isRefreshing ? 'Refreshing...' : 'Refresh buyer feed'}
            loading={isRefreshing}
            onPress={() => void handleRefresh()}
          />
          <ActionButton label="Sign out" variant="ghost" onPress={() => void signOut()} />
        </View>
      </InfoCard>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<ShoppingCart color={colors.primary} size={20} />}
            label="Total requests"
            value={String(requests.length)}
            caption={`${activeCount} currently active`}
          />
        </View>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<Clock3 color={colors.warning} size={20} />}
            label="Pending approval"
            value={String(pendingCount)}
            caption="Waiting to move downstream"
          />
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<TrendingUp color={colors.success} size={20} />}
            label="Completed"
            value={String(completedCount)}
            caption={`${feedback.length} feedback entries submitted`}
          />
        </View>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<FileText color={colors.info} size={20} />}
            label="Outstanding"
            value={currencyFormatter.format(outstandingAmount / 100)}
            caption={`${invoices.length} invoices in the buyer ledger`}
          />
        </View>
      </View>

      <InfoCard>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent requests</Text>
        {recentRequests.length ? (
          recentRequests.map((request) => (
            <View key={request.id} style={styles.recordRow}>
              <View style={styles.copyWrap}>
                <Text style={[styles.recordTitle, { color: colors.foreground }]}>{request.title}</Text>
                <Text style={[styles.caption, { color: colors.mutedForeground }]}>
                  {request.requestNumber} | {request.categoryLabel} | {request.locationName}
                </Text>
              </View>
              <StatusChip
                label={request.status.replace(/_/g, ' ')}
                tone={request.status === 'pending' ? 'warning' : request.status === 'completed' ? 'success' : 'info'}
              />
            </View>
          ))
        ) : (
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>
            No buyer requests have been created in this workspace yet.
          </Text>
        )}
      </InfoCard>

      <InfoCard>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Invoice follow-up</Text>
        {latestInvoice ? (
          <>
            <Text style={[styles.recordTitle, { color: colors.foreground }]}>{latestInvoice.invoiceNumber}</Text>
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>
              {latestInvoice.supplierName} | Due {formatValue(latestInvoice.dueDate)}
            </Text>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>
              {currencyFormatter.format(latestInvoice.dueAmountPaise / 100)}
            </Text>
            <View style={styles.statusWrap}>
              <StatusChip label={latestInvoice.status} tone={latestInvoice.status === 'disputed' ? 'danger' : latestInvoice.status === 'acknowledged' ? 'success' : 'info'} />
              <StatusChip label={latestInvoice.paymentStatus} tone={latestInvoice.paymentStatus === 'paid' ? 'success' : latestInvoice.paymentStatus === 'partial' ? 'warning' : 'danger'} />
            </View>
          </>
        ) : (
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>
            Buyer invoice records will appear here after supplier billing reaches the buyer desk.
          </Text>
        )}
      </InfoCard>

      <InfoCard>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick actions</Text>
        <View style={styles.actionGroup}>
          <ActionButton label="Create request" variant="secondary" onPress={() => navigation.navigate('BuyerRequests')} />
          <ActionButton label="Open invoices" variant="secondary" onPress={() => navigation.navigate('BuyerInvoices')} />
          <ActionButton label="Submit feedback" variant="ghost" onPress={() => navigation.navigate('BuyerFeedback')} />
        </View>
      </InfoCard>

      <NotificationInboxCard
        title="Buyer notifications"
        description="Use this preview lane to verify Phase 7 order-status pushes and the in-app audit history."
        actions={[
          {
            label: 'Preview order update',
            route: 'order_status_change',
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
  statusWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
});
