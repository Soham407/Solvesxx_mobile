import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CheckSquare } from 'lucide-react-native';

import { ActionButton } from '../../components/shared/ActionButton';
import { InfoCard } from '../../components/shared/InfoCard';
import { LoadingScreen } from '../../components/shared/LoadingScreen';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { MDTabParamList } from '../../navigation/types';
import { useMDStore } from '../../store/useMDStore';
import type { MDApprovalItem } from '../../lib/mdBackend';

type MDApprovalsScreenProps = BottomTabScreenProps<MDTabParamList, 'MDApprovals'>;

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function getTypeLabel(type: MDApprovalItem['type']) {
  if (type === 'budget_exception') {
    return 'Budget exception';
  }

  if (type === 'policy_exception') {
    return 'Policy exception';
  }

  return 'PO above ₹1L';
}

export function MDApprovalsScreen(_props: MDApprovalsScreenProps) {
  const { colors } = useAppTheme();
  const hasHydrated = useMDStore((state) => state.hasHydrated);
  const approvalItems = useMDStore((state) => state.approvalItems);
  const approveItem = useMDStore((state) => state.approveItem);
  const rejectItem = useMDStore((state) => state.rejectItem);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const orderedItems = useMemo(
    () =>
      [...approvalItems].sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      ),
    [approvalItems],
  );

  const handleApprove = async (itemId: string) => {
    setProcessingId(itemId);
    setMessage(null);
    try {
      await approveItem(itemId);
      setMessage('Approval decision recorded.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (itemId: string) => {
    setProcessingId(itemId);
    setMessage(null);
    try {
      await rejectItem(itemId);
      setMessage('Rejection decision recorded.');
    } finally {
      setProcessingId(null);
    }
  };

  if (!hasHydrated) {
    return <LoadingScreen />;
  }

  return (
    <ScreenShell
      eyebrow="Executive Approvals"
      title="Pending Approvals"
      description="Review high-value purchase orders, budget exceptions, and policy exceptions that require MD sign-off."
    >
      <InfoCard>
        <View style={styles.headerRow}>
          <View style={styles.copyWrap}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Approval queue
            </Text>
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>
              Items include PO above ₹1L, budget exceptions, and policy exceptions.
            </Text>
          </View>
          <CheckSquare color={colors.primary} size={22} />
        </View>
        {message ? <Text style={[styles.caption, { color: colors.primary }]}>{message}</Text> : null}
      </InfoCard>

      <InfoCard>
        {orderedItems.length ? (
          orderedItems.map((item, index) => {
            const isProcessing = processingId === item.id;

            return (
              <View key={item.id} style={styles.itemCard} testID={`qa_md_approval_item_${index}`}>
                <Text style={[styles.typeLabel, { color: colors.primary }]}>{getTypeLabel(item.type)}</Text>
                <Text style={[styles.itemTitle, { color: colors.foreground }]}>{item.description}</Text>
                <Text style={[styles.caption, { color: colors.mutedForeground }]}>
                  Requested by: {item.requestedBy}
                </Text>
                <Text style={[styles.caption, { color: colors.mutedForeground }]}>
                  Department: {item.department}
                </Text>
                <Text style={[styles.amount, { color: colors.foreground }]}>
                  {currencyFormatter.format(Math.max(0, item.amount))}
                </Text>
                <View style={styles.actionRow}>
                  <View style={styles.actionCell}>
                    <ActionButton
                      label="Approve"
                      loading={isProcessing}
                      onPress={() => void handleApprove(item.id)}
                      testID={`qa_md_approve_${index}`}
                    />
                  </View>
                  <View style={styles.actionCell}>
                    <ActionButton
                      label="Reject"
                      variant="danger"
                      loading={isProcessing}
                      onPress={() => void handleReject(item.id)}
                      testID={`qa_md_reject_${index}`}
                    />
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>No pending approvals</Text>
        )}
      </InfoCard>
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
  sectionTitle: {
    fontFamily: FontFamily.sansBold,
    fontSize: FontSize.lg,
  },
  caption: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  itemCard: {
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
  },
  typeLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.sm,
  },
  itemTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
    lineHeight: 22,
  },
  amount: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xl,
    lineHeight: 28,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.base,
    marginTop: Spacing.xs,
  },
  actionCell: {
    flex: 1,
  },
});
