import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { StatusChip } from '../../components/guard/StatusChip';
import { ActionButton } from '../../components/shared/ActionButton';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useHODStore } from '../../store/useHODStore';

function formatDateRange(startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    return 'Dates pending';
  }

  const start = new Date(startDate).toLocaleDateString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const end = new Date(endDate).toLocaleDateString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return `${start} - ${end}`;
}

export function HODApprovalsScreen() {
  const { colors } = useAppTheme();
  const leaveRequests = useHODStore((state) => state.leaveRequests);
  const isLoading = useHODStore((state) => state.isLoading);
  const approveLeave = useHODStore((state) => state.approveLeave);
  const rejectLeave = useHODStore((state) => state.rejectLeave);
  const [busyLeaveId, setBusyLeaveId] = useState<string | null>(null);

  const pendingRequests = useMemo(
    () => leaveRequests.filter((leaveRequest) => leaveRequest.status === 'pending'),
    [leaveRequests],
  );

  const handleApprove = async (leaveId: string) => {
    setBusyLeaveId(leaveId);

    try {
      await approveLeave(leaveId);
    } finally {
      setBusyLeaveId(null);
    }
  };

  const handleReject = async (leaveId: string) => {
    setBusyLeaveId(leaveId);

    try {
      await rejectLeave(leaveId);
    } finally {
      setBusyLeaveId(null);
    }
  };

  return (
    <ScreenShell
      eyebrow="HOD PORTAL"
      title="Pending Approvals"
      description="Review and action pending leave requests from your reporting team."
    >
      {isLoading && !pendingRequests.length ? (
        <InfoCard>
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>Loading approvals...</Text>
          </View>
        </InfoCard>
      ) : null}

      {pendingRequests.length ? (
        pendingRequests.map((leaveRequest) => {
          const isBusy = busyLeaveId === leaveRequest.id;

          return (
            <InfoCard key={leaveRequest.id}>
              <View style={styles.rowHeader}>
                <View style={styles.copyWrap}>
                  <Text style={[styles.name, { color: colors.foreground }]}>{leaveRequest.employeeName}</Text>
                  <Text style={[styles.caption, { color: colors.mutedForeground }]}>
                    {leaveRequest.leaveType} | {formatDateRange(leaveRequest.startDate, leaveRequest.endDate)}
                  </Text>
                </View>
                <StatusChip label="pending" tone="warning" />
              </View>

              <Text style={[styles.reason, { color: colors.foreground }]}>{leaveRequest.reason}</Text>

              <View style={styles.actionRow}>
                <View style={styles.actionCell}>
                  <ActionButton
                    label="Approve"
                    variant="primary"
                    loading={isBusy}
                    disabled={isBusy}
                    onPress={() => void handleApprove(leaveRequest.id)}
                  />
                </View>
                <View style={styles.actionCell}>
                  <ActionButton
                    label="Reject"
                    variant="danger"
                    loading={isBusy}
                    disabled={isBusy}
                    onPress={() => void handleReject(leaveRequest.id)}
                  />
                </View>
              </View>
            </InfoCard>
          );
        })
      ) : (
        <InfoCard>
          <Text style={[styles.emptyState, { color: colors.mutedForeground }]}>No pending approvals</Text>
        </InfoCard>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  rowHeader: {
    flexDirection: 'row',
    gap: Spacing.base,
    justifyContent: 'space-between',
  },
  copyWrap: {
    flex: 1,
    gap: Spacing.xs,
  },
  loadingWrap: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  name: {
    fontFamily: FontFamily.sansBold,
    fontSize: FontSize.lg,
  },
  caption: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  reason: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.base,
  },
  actionCell: {
    flex: 1,
  },
  emptyState: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.base,
    lineHeight: 22,
    textAlign: 'center',
  },
});
