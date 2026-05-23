import { StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { AccountTabParamList } from '../../navigation/types';
import { useAccountStore } from '../../store/useAccountStore';

type AccountPaymentsScreenProps = BottomTabScreenProps<AccountTabParamList, 'AccountPayments'>;

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

export function AccountPaymentsScreen(_props: AccountPaymentsScreenProps) {
  const { colors } = useAppTheme();
  const isPaymentsLoading = useAccountStore((state) => state.isPaymentsLoading);
  const paymentItems = useAccountStore((state) => state.paymentItems);

  return (
    <ScreenShell
      eyebrow="Account"
      title="Payment Status"
      description="Monitor open invoices and due dates to prioritize customer follow-up and overdue recovery."
    >
      {isPaymentsLoading ? (
        <InfoCard>
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>Loading payment status...</Text>
        </InfoCard>
      ) : null}

      {paymentItems.length ? (
        paymentItems.map((item) => (
          <InfoCard key={item.id}>
            <View
              style={[
                styles.itemWrap,
                item.isOverdue
                  ? {
                      borderColor: colors.destructive,
                      borderRadius: 12,
                      borderWidth: 1,
                      padding: Spacing.base,
                    }
                  : null,
              ]}
            >
              <Text
                style={[
                  styles.invoiceTitle,
                  { color: item.isOverdue ? colors.destructive : colors.foreground },
                ]}
              >
                {item.invoiceNumber}
              </Text>
              <Text style={[styles.caption, { color: colors.mutedForeground }]}>{item.customerName}</Text>
              <Text style={[styles.caption, { color: colors.foreground }]}>
                Amount due: {currencyFormatter.format(item.amountDue)}
              </Text>
              <Text
                style={[
                  styles.caption,
                  { color: item.isOverdue ? colors.destructive : colors.mutedForeground },
                ]}
              >
                Due date: {formatDate(item.dueDate)}
              </Text>
            </View>
          </InfoCard>
        ))
      ) : (
        <InfoCard>
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>All payments up to date</Text>
        </InfoCard>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  itemWrap: {
    gap: Spacing.xs,
  },
  invoiceTitle: {
    fontFamily: FontFamily.sansBold,
    fontSize: FontSize.base,
  },
  caption: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
});
