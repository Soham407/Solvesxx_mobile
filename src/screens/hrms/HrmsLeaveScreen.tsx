import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CalendarRange, CircleCheckBig, FileClock } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../../components/shared/ActionButton';
import { FormField } from '../../components/shared/FormField';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  calculateInclusiveLeaveDays,
  fetchHrmsLeaveSnapshot,
  submitHrmsLeaveApplication,
} from '../../lib/hrms';
import type { HRMSTabParamList } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';

type HrmsLeaveScreenProps = BottomTabScreenProps<HRMSTabParamList, 'HRMSLeave'>;

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function HrmsLeaveScreen(_props: HrmsLeaveScreenProps) {
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const profile = useAppStore((state) => state.profile);
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');

  const leaveQuery = useQuery({
    queryKey: ['hrms', 'leave', profile?.employeeId],
    queryFn: () => fetchHrmsLeaveSnapshot(profile),
    enabled: Boolean(profile),
  });

  useEffect(() => {
    if (!selectedLeaveTypeId && leaveQuery.data?.leaveTypes[0]?.id) {
      setSelectedLeaveTypeId(leaveQuery.data.leaveTypes[0].id);
    }
  }, [leaveQuery.data?.leaveTypes, selectedLeaveTypeId]);

  const selectedType = useMemo(
    () =>
      leaveQuery.data?.leaveTypes.find((item) => item.id === selectedLeaveTypeId) ?? null,
    [leaveQuery.data?.leaveTypes, selectedLeaveTypeId],
  );

  const requestedDays =
    fromDate && toDate ? calculateInclusiveLeaveDays(fromDate, toDate) : 0;

  const leaveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedType) {
        throw new Error('Choose a leave type first.');
      }

      return submitHrmsLeaveApplication({
        fromDate,
        leaveTypeCode: selectedType.code,
        leaveTypeId: selectedType.id,
        leaveTypeName: selectedType.name,
        profile,
        reason,
        toDate,
      });
    },
    onSuccess: async () => {
      setFromDate('');
      setToDate('');
      setReason('');

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['hrms', 'leave', profile?.employeeId] }),
        queryClient.invalidateQueries({ queryKey: ['hrms', 'dashboard', profile?.employeeId, profile?.role] }),
      ]);
    },
  });

  return (
    <ScreenShell
      eyebrow="HRMS leave"
      title="Leave desk"
      description="Request time away, keep the reason short and specific, and track approval decisions without leaving the mobile workspace."
      footer={
        <ActionButton
          label="Submit leave request"
          loading={leaveMutation.isPending}
          onPress={() => leaveMutation.mutate()}
          testID="qa_hrms_submit_leave"
        />
      }
    >
      <InfoCard>
        <View style={styles.headerRow}>
          <CalendarRange color={colors.warning} size={22} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Available balances</Text>
        </View>
        <View style={styles.chipWrap}>
          {leaveQuery.data?.leaveTypes.map((item) => (
            <Pressable
              key={item.id}
              testID={`qa_hrms_leave_type_${item.code}`}
              onPress={() => setSelectedLeaveTypeId(item.id)}
              style={[
                styles.balanceChip,
                {
                  backgroundColor:
                    selectedLeaveTypeId === item.id ? colors.secondary : colors.card,
                  borderColor: colors.border,
                },
                selectedLeaveTypeId === item.id && styles.balanceChipActive,
              ]}
            >
              <Text style={[styles.balanceChipTitle, { color: colors.foreground }]}>{item.name}</Text>
              <Text style={[styles.balanceChipValue, { color: colors.foreground }]}>
                {item.remainingDays} days
              </Text>
            </Pressable>
          ))}
        </View>
      </InfoCard>

      <InfoCard>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>New request</Text>
        <Text style={[styles.helperCopy, { color: colors.mutedForeground }]}>
          Use `YYYY-MM-DD` dates to keep the request consistent with the existing Supabase schema.
        </Text>
        <FormField
          helperText={selectedType ? `${selectedType.remainingDays} day(s) remaining.` : undefined}
          inputTestID="qa_hrms_leave_start_date"
          label="Start date"
          onChangeText={setFromDate}
          placeholder="2026-04-10"
          value={fromDate}
        />
        <FormField
          helperText={requestedDays > 0 ? `${requestedDays} day(s) requested.` : undefined}
          inputTestID="qa_hrms_leave_end_date"
          label="End date"
          onChangeText={setToDate}
          placeholder="2026-04-12"
          value={toDate}
        />
        <FormField
          helperText="This note is shown to the reporting supervisor."
          inputTestID="qa_hrms_leave_reason"
          label="Reason"
          multiline
          numberOfLines={4}
          onChangeText={setReason}
          placeholder="Family commitment, medical appointment, or planned travel..."
          style={styles.multilineInput}
          textAlignVertical="top"
          value={reason}
        />
        {leaveMutation.error instanceof Error ? (
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            {leaveMutation.error.message}
          </Text>
        ) : null}
      </InfoCard>

      <InfoCard>
        <View style={styles.headerRow}>
          <FileClock color={colors.info} size={22} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Request history</Text>
        </View>
        {leaveQuery.data?.applications.length ? (
          leaveQuery.data.applications.map((item, index) => (
            <View
              key={item.id}
              style={[styles.requestRow, { borderColor: colors.border }]}
              testID={`qa_hrms_leave_request_row_${index}`}
            >
              <View style={styles.requestCopy}>
                <Text
                  style={[styles.requestTitle, { color: colors.foreground }]}
                  testID={`qa_hrms_leave_request_title_${index}`}
                >
                  {item.leaveTypeName}
                </Text>
                <Text style={[styles.helperCopy, { color: colors.mutedForeground }]}>
                  {formatDateLabel(item.fromDate)} to {formatDateLabel(item.toDate)} | {item.numberOfDays} day(s)
                </Text>
                <Text
                  style={[styles.helperCopy, { color: colors.mutedForeground }]}
                  testID={`qa_hrms_leave_request_reason_${index}`}
                >
                  {item.reason}
                </Text>
              </View>
              <View style={styles.requestMeta}>
                <Text
                  style={[styles.statusText, { color: colors.foreground }]}
                  testID={`qa_hrms_leave_request_status_${index}`}
                >
                  {item.status}
                </Text>
                <Text style={[styles.syncText, { color: colors.info }]}>
                  {item.syncStatus === 'synced'
                    ? 'Synced'
                    : item.syncStatus === 'pending'
                      ? 'Queued locally'
                      : 'Preview'}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyRow}>
            <CircleCheckBig color={colors.success} size={20} />
            <Text style={[styles.helperCopy, { color: colors.mutedForeground }]}>
              No leave requests yet. Your submitted applications will appear here.
            </Text>
          </View>
        )}
      </InfoCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cardTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.md,
  },
  helperCopy: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  balanceChip: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.xs,
    minWidth: 132,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  balanceChipActive: {
    opacity: 0.92,
  },
  balanceChipTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.sm,
  },
  balanceChipValue: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xl,
  },
  multilineInput: {
    minHeight: 120,
    paddingTop: Spacing.base,
  },
  errorText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
  },
  requestRow: {
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: Spacing.base,
    paddingTop: Spacing.base,
  },
  requestCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  requestTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
  requestMeta: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  statusText: {
    fontFamily: FontFamily.sansBold,
    fontSize: FontSize.sm,
    textTransform: 'capitalize',
  },
  syncText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
  },
  emptyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
