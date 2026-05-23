import { StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { StatusChip } from '../../components/guard/StatusChip';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { AccountTabParamList } from '../../navigation/types';
import { useAccountStore } from '../../store/useAccountStore';
import type { BillRecord } from '../../lib/accountBackend';

type AccountBillsScreenProps = BottomTabScreenProps<AccountTabParamList, 'AccountBills'>;

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

function getStatusTone(status: BillRecord['status']) {
  if (status === 'paid') {
    return 'success';
  }

  if (status === 'overdue') {
    return 'danger';
  }

  return 'warning';
}

export function AccountBillsScreen(_props: AccountBillsScreenProps) {
  const { colors } = useAppTheme();
  const isBillsLoading = useAccountStore((state) => state.isBillsLoading);
  const recentBills = useAccountStore((state) => state.recentBills);

  return (
    <ScreenShell
      eyebrow="Account"
      title="Recent Bills"
      description="Review purchase and sale bills with quick status visibility for payables and collections follow-up."
    >
      {isBillsLoading ? (
        <InfoCard>
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>Loading recent bills...</Text>
        </InfoCard>
      ) : null}

      {recentBills.length ? (
        recentBills.map((bill) => (
          <InfoCard key={bill.id}>
            <View style={styles.headerRow}>
              <View style={styles.copyWrap}>
                <Text style={[styles.billTitle, { color: colors.foreground }]}>{bill.billNumber}</Text>
                <Text style={[styles.caption, { color: colors.mutedForeground }]}>
                  {bill.partyName}
                </Text>
              </View>
              <StatusChip label={bill.status} tone={getStatusTone(bill.status)} />
            </View>
            <Text style={[styles.caption, { color: colors.foreground }]}>
              {bill.type === 'purchase' ? 'Purchase' : 'Sale'} | {currencyFormatter.format(bill.amount)}
            </Text>
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>{formatDate(bill.date)}</Text>
          </InfoCard>
        ))
      ) : (
        <InfoCard>
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>No recent bills</Text>
        </InfoCard>
      )}
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
  billTitle: {
    fontFamily: FontFamily.sansBold,
    fontSize: FontSize.base,
  },
  caption: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
});
