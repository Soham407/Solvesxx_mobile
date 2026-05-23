import { StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { AlertTriangle, CircleDollarSign, FileClock, Wallet } from 'lucide-react-native';

import { MetricCard } from '../../components/guard/MetricCard';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { AccountTabParamList } from '../../navigation/types';
import { useAccountStore } from '../../store/useAccountStore';

type AccountHomeScreenProps = BottomTabScreenProps<AccountTabParamList, 'AccountHome'>;

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function AccountHomeScreen(_props: AccountHomeScreenProps) {
  const { colors } = useAppTheme();
  const isSummaryLoading = useAccountStore((state) => state.isSummaryLoading);
  const todayCollections = useAccountStore((state) => state.todayCollections);
  const outstandingReceivables = useAccountStore((state) => state.outstandingReceivables);
  const pendingBillsCount = useAccountStore((state) => state.pendingBillsCount);
  const overduePmtCount = useAccountStore((state) => state.overduePmtCount);
  const errorMessage = useAccountStore((state) => state.errorMessage);

  return (
    <ScreenShell
      eyebrow="Account"
      title="Finance Summary"
      description="Track daily collection, receivables, pending bills, and overdue payments from one account dashboard."
    >
      {isSummaryLoading ? (
        <InfoCard>
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Loading finance summary...
          </Text>
        </InfoCard>
      ) : null}

      {errorMessage ? (
        <InfoCard>
          <Text style={[styles.errorText, { color: colors.warning }]}>{errorMessage}</Text>
        </InfoCard>
      ) : null}

      <View style={styles.metricsGrid}>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<Wallet color={colors.success} size={20} />}
            label="Today's collections"
            value={currencyFormatter.format(todayCollections)}
          />
        </View>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<CircleDollarSign color={colors.info} size={20} />}
            label="Outstanding receivables"
            value={currencyFormatter.format(outstandingReceivables)}
          />
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<FileClock color={colors.warning} size={20} />}
            label="Pending bills"
            value={String(pendingBillsCount)}
          />
        </View>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<AlertTriangle color={colors.destructive} size={20} />}
            label="Overdue payments"
            value={String(overduePmtCount)}
          />
        </View>
      </View>
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
  errorText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
});
