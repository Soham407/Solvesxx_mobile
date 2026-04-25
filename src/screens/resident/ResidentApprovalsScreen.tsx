import { useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Clock3, ShieldCheck, ShieldX } from 'lucide-react-native';

import { StatusChip } from '../../components/guard/StatusChip';
import { ActionButton } from '../../components/shared/ActionButton';
import { FormField } from '../../components/shared/FormField';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  approveResidentVisitor,
  denyResidentVisitor,
  fetchResidentPendingVisitors,
  isPreviewProfile,
  setResidentFrequentVisitor,
} from '../../lib/mobileBackend';
import type { ResidentTabParamList } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import { useGuardStore } from '../../store/useGuardStore';
import { useResidentPresenceStore } from '../../store/useResidentPresenceStore';
import type { ResidentPendingVisitor } from '../../types/resident';

type ResidentApprovalsScreenProps = BottomTabScreenProps<
  ResidentTabParamList,
  'ResidentApprovals'
>;

function formatCountdown(value: string | null) {
  if (!value) {
    return 'No deadline';
  }

  const remainingMs = new Date(value).getTime() - Date.now();

  if (remainingMs <= 0) {
    return 'Decision window expired';
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')} remaining`;
}

function hasRpcResultError(result: unknown): result is { success?: boolean; error?: string } {
  return Boolean(
    result &&
      typeof result === 'object' &&
      ('success' in result || 'error' in result),
  );
}

export function ResidentApprovalsScreen(_props: ResidentApprovalsScreenProps) {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const queryClient = useQueryClient();
  const previewMode = isPreviewProfile(profile);
  const previewVisitorLog = useGuardStore((state) => state.visitorLog);
  const approvePreviewVisitor = useGuardStore((state) => state.approveVisitor);
  const denyPreviewVisitor = useGuardStore((state) => state.denyVisitor);
  const setPreviewFrequentVisitor = useGuardStore((state) => state.setVisitorFrequent);
  const activeResidents = useResidentPresenceStore((state) => state.members);
  const hasLiveSync = useResidentPresenceStore((state) => state.hasLiveSync);
  const [message, setMessage] = useState<string | null>(null);
  const [denyModalOpen, setDenyModalOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<ResidentPendingVisitor | null>(null);
  const [denyReason, setDenyReason] = useState('');

  const visitorsQuery = useQuery({
    queryKey: ['resident', 'pending-visitors', profile?.userId],
    queryFn: fetchResidentPendingVisitors,
    enabled: Boolean(profile?.userId) && !previewMode,
    refetchInterval: hasLiveSync ? false : 30000,
  });

  const refreshVisitors = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['resident', 'pending-visitors', profile?.userId],
    });
  };

  const approveMutation = useMutation({
    mutationFn: async (visitorId: string) => {
      if (previewMode) {
        return approvePreviewVisitor(visitorId);
      }

      if (!profile?.userId) {
        throw new Error('Resident profile is missing');
      }

      return approveResidentVisitor(visitorId, profile.userId);
    },
    onSuccess: async (result) => {
      if (hasRpcResultError(result) && (result.success === false || result.error)) {
        setMessage(result.error ?? 'Visitor approval failed.');
        return;
      }

      setMessage('Visitor approved successfully.');
      await refreshVisitors();
    },
  });

  const denyMutation = useMutation({
    mutationFn: async (input: { visitorId: string; reason: string }) => {
      if (previewMode) {
        return denyPreviewVisitor(input.visitorId, input.reason);
      }

      if (!profile?.userId) {
        throw new Error('Resident profile is missing');
      }

      return denyResidentVisitor(input.visitorId, profile.userId, input.reason);
    },
    onSuccess: async (result) => {
      if (hasRpcResultError(result) && (result.success === false || result.error)) {
        setMessage(result.error ?? 'Visitor denial failed.');
        return;
      }

      setMessage('Visitor denied successfully.');
      setDenyModalOpen(false);
      setSelectedVisitor(null);
      setDenyReason('');
      await refreshVisitors();
    },
  });

  const frequentMutation = useMutation({
    mutationFn: async (input: { visitorId: string; isFrequent: boolean }) =>
      previewMode
        ? setPreviewFrequentVisitor(input.visitorId, input.isFrequent)
        : setResidentFrequentVisitor(input.visitorId, input.isFrequent),
    onSuccess: async (_data, variables) => {
      setMessage(
        variables.isFrequent
          ? 'Visitor saved as frequent.'
          : 'Visitor removed from frequent list.',
      );
      await refreshVisitors();
    },
  });

  const orderedVisitors = useMemo(
    () =>
      [
        ...(previewMode
          ? previewVisitorLog
              .filter((visitor) => visitor.status === 'inside')
              .map(
                (visitor): ResidentPendingVisitor => ({
                  id: visitor.id,
                  visitorName: visitor.name,
                  phone: visitor.phone,
                  purpose: visitor.purpose,
                  flatId: visitor.flatId,
                  flatLabel: visitor.destination,
                  vehicleNumber: visitor.vehicleNumber,
                  photoUrl: visitor.photoUrl ?? visitor.photoUri,
                  entryTime: visitor.recordedAt,
                  approvalStatus:
                    visitor.approvalStatus === 'checked_out' || visitor.approvalStatus === 'inside'
                      ? 'pending'
                      : (visitor.approvalStatus as ResidentPendingVisitor['approvalStatus']),
                  approvalDeadlineAt: visitor.approvalDeadlineAt,
                  isFrequentVisitor: visitor.frequentVisitor,
                  rejectionReason: null,
                }),
              )
          : visitorsQuery.data ?? []),
      ].sort((left, right) => {
        const leftTime = left.approvalDeadlineAt ? new Date(left.approvalDeadlineAt).getTime() : 0;
        const rightTime = right.approvalDeadlineAt ? new Date(right.approvalDeadlineAt).getTime() : 0;
        return leftTime - rightTime;
      }),
    [previewMode, previewVisitorLog, visitorsQuery.data],
  );

  const openDenyModal = (visitor: ResidentPendingVisitor) => {
    setSelectedVisitor(visitor);
    setDenyReason(visitor.rejectionReason ?? '');
    setDenyModalOpen(true);
  };

  const submitDeny = async () => {
    if (!selectedVisitor) {
      return;
    }

    const reason = denyReason.trim();

    if (!reason) {
      setMessage('Add a reason before denying the visitor.');
      return;
    }

    await denyMutation.mutateAsync({
      visitorId: selectedVisitor.id,
      reason,
    });
  };

  useEffect(() => {
    if (!selectedVisitor) {
      return;
    }

    const currentVisitor = orderedVisitors.find((visitor) => visitor.id === selectedVisitor.id);

    if (!currentVisitor || currentVisitor.approvalStatus !== 'pending') {
      setDenyModalOpen(false);
      setSelectedVisitor(null);
      setDenyReason('');
      setMessage('This visitor was updated from another resident session.');
    }
  }, [orderedVisitors, selectedVisitor]);

  return (
    <ScreenShell
      eyebrow="Gate Approval"
      title="Visitor approvals"
      description="Review guests waiting at your gate and make a quick decision."
    >
      <InfoCard>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Approval queue</Text>
        <Text style={[styles.copy, { color: colors.mutedForeground }]}>
          Each request stays here until you approve it, deny it, or the decision window expires.
        </Text>
        <Text style={[styles.copy, { color: colors.mutedForeground }]}>
          {hasLiveSync
            ? activeResidents.length
              ? `${activeResidents.map((resident) => resident.fullName).join(', ')} ${
                  activeResidents.length === 1 ? 'is' : 'are'
                } also watching this queue.`
              : 'Live sync is active for this queue.'
            : 'Live sync is reconnecting. Pull-to-refresh is not required.'}
        </Text>
        {message ? (
          <Text style={[styles.message, { color: colors.primary }]} testID="qa_resident_approvals_message">
            {message}
          </Text>
        ) : null}
      </InfoCard>

      {orderedVisitors.length ? (
        orderedVisitors.map((visitor, index) => (
          <InfoCard key={visitor.id}>
            <View style={styles.headerRow}>
              <View style={styles.visitorHeading} testID={`qa_resident_approval_card_${index}`}>
                <Text
                  style={[styles.visitorName, { color: colors.foreground }]}
                  testID={`qa_resident_approval_name_${index}`}
                >
                  {visitor.visitorName}
                </Text>
                <Text style={[styles.copy, { color: colors.mutedForeground }]}>
                  {visitor.flatLabel} · {visitor.purpose}
                </Text>
              </View>
              <StatusChip
                label={visitor.approvalStatus.replace(/_/g, ' ')}
                tone={
                  visitor.approvalStatus === 'approved'
                    ? 'success'
                    : visitor.approvalStatus === 'denied' || visitor.approvalStatus === 'timed_out'
                      ? 'danger'
                      : 'warning'
                }
              />
            </View>

            {visitor.photoUrl ? (
              <Image source={{ uri: visitor.photoUrl }} style={styles.photo} />
            ) : null}

            <View style={styles.metaRow}>
              <View style={styles.inlineMeta}>
                <Clock3 color={colors.warning} size={16} />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                  {formatCountdown(visitor.approvalDeadlineAt)}
                </Text>
              </View>
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                {visitor.phone || 'Phone unavailable'}
              </Text>
              {visitor.vehicleNumber ? (
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                  Vehicle: {visitor.vehicleNumber}
                </Text>
              ) : null}
            </View>

            <View style={styles.actionGroup}>
              <ActionButton
                label={approveMutation.isPending ? 'Approving...' : 'Approve'}
                disabled={
                  approveMutation.isPending ||
                  visitor.approvalStatus !== 'pending'
                }
                testID={`qa_resident_approve_visitor_${index}`}
                onPress={() => approveMutation.mutate(visitor.id)}
              />
              <ActionButton
                label={denyMutation.isPending ? 'Denying...' : 'Deny'}
                variant="danger"
                disabled={denyMutation.isPending || visitor.approvalStatus !== 'pending'}
                testID={`qa_resident_deny_visitor_${index}`}
                onPress={() => openDenyModal(visitor)}
              />
              <ActionButton
                label={
                  frequentMutation.isPending
                    ? 'Saving...'
                    : visitor.isFrequentVisitor
                      ? 'Remove trusted'
                      : 'Mark trusted'
                }
                variant="ghost"
                testID={`qa_resident_mark_frequent_${index}`}
                onPress={() =>
                  frequentMutation.mutate({
                    visitorId: visitor.id,
                    isFrequent: !visitor.isFrequentVisitor,
                  })
                }
              />
            </View>

            {visitor.rejectionReason ? (
              <View style={styles.inlineMeta}>
                <ShieldX color={colors.destructive} size={16} />
                <Text style={[styles.copy, { color: colors.mutedForeground }]}>
                  {visitor.rejectionReason}
                </Text>
              </View>
            ) : null}
          </InfoCard>
        ))
      ) : (
        <InfoCard>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>No pending entries</Text>
          <Text style={[styles.copy, { color: colors.mutedForeground }]}>
            New gate requests will appear here when security sends them to you.
          </Text>
        </InfoCard>
      )}

      <Modal
        animationType="slide"
        transparent
        visible={denyModalOpen}
        onRequestClose={() => setDenyModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Deny visitor</Text>
            <Text style={[styles.copy, { color: colors.mutedForeground }]}>
              Tell security why this guest should not be allowed in.
            </Text>

            <View style={styles.reasonPresetRow}>
              {['Not expecting this visitor', 'Please call me first', 'Try again later'].map((option) => (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  onPress={() => setDenyReason(option)}
                  style={[
                    styles.reasonPreset,
                    {
                      backgroundColor: denyReason === option ? colors.primary + '12' : colors.background,
                      borderColor: denyReason === option ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.reasonPresetLabel, { color: colors.foreground }]}>{option}</Text>
                </Pressable>
              ))}
            </View>

            <FormField
              label="Reason"
              helperText="This note will be shown to security."
              multiline
              numberOfLines={4}
              onChangeText={setDenyReason}
              style={styles.multilineInput}
              value={denyReason}
            />

            <View style={styles.modalActions}>
              <ActionButton label="Cancel" variant="ghost" onPress={() => setDenyModalOpen(false)} />
              <ActionButton
                label={denyMutation.isPending ? 'Denying...' : 'Confirm denial'}
                variant="danger"
                disabled={denyMutation.isPending}
                onPress={() => void submitDeny()}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontFamily: FontFamily.sansBold,
    fontSize: FontSize.lg,
  },
  copy: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  message: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  headerRow: {
    flexDirection: 'row',
    gap: Spacing.base,
    justifyContent: 'space-between',
  },
  visitorHeading: {
    flex: 1,
    gap: Spacing.xs,
  },
  visitorName: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
  photo: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: BorderRadius['2xl'],
  },
  metaRow: {
    gap: Spacing.sm,
  },
  metaText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  actionGroup: {
    gap: Spacing.base,
  },
  inlineMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    padding: Spacing.lg,
  },
  modalCard: {
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    gap: Spacing.base,
    padding: Spacing.xl,
  },
  modalTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xl,
  },
  reasonPresetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  reasonPreset: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  reasonPresetLabel: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
  },
  multilineInput: {
    minHeight: 112,
    paddingTop: Spacing.base,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.base,
  },
});
