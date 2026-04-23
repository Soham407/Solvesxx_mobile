import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { AlertTriangle, Camera, CheckCircle2, ClipboardList, Hash, Info } from 'lucide-react-native';

import { ProgressBar } from '../../components/guard/ProgressBar';
import { StatusChip } from '../../components/guard/StatusChip';
import { ActionButton } from '../../components/shared/ActionButton';
import { FormField } from '../../components/shared/FormField';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Toast } from '../../components/shared/Toast';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import { fetchGuardChecklistItems, isPreviewProfile, submitGuardChecklist } from '../../lib/mobileBackend';
import { capturePhoto } from '../../lib/media';
import type { GuardTabParamList } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import { useGuardStore } from '../../store/useGuardStore';
import type { GuardChecklistItem } from '../../types/guard';

type GuardChecklistScreenProps = BottomTabScreenProps<GuardTabParamList, 'GuardChecklist'>;

function formatCompletedAt(value: string | null) {
  if (!value) {
    return 'Pending';
  }

  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isChecklistReady(items: GuardChecklistItem[]) {
  return (
    items.length > 0 &&
    items.every((item) => {
      if (item.requiredEvidence && !item.evidenceUri) {
        return false;
      }

      if (item.inputType === 'numeric') {
        return item.numericValue.trim().length > 0;
      }

      return item.status === 'completed';
    })
  );
}

export function GuardChecklistScreen(_props: GuardChecklistScreenProps) {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const queryClient = useQueryClient();
  const previewMode = isPreviewProfile(profile);
  const previewChecklistItems = useGuardStore((state) => state.checklistItems);
  const previewChecklistSubmittedAt = useGuardStore((state) => state.checklistSubmittedAt);
  const isOfflineMode = useGuardStore((state) => state.isOfflineMode);
  const dutyStatus = useGuardStore((state) => state.dutyStatus);
  const toggleChecklistItem = useGuardStore((state) => state.toggleChecklistItem);
  const attachChecklistEvidence = useGuardStore((state) => state.attachChecklistEvidence);
  const submitPreviewChecklist = useGuardStore((state) => state.submitChecklist);
  const usePreviewFlow = previewMode || isOfflineMode;

  const remoteChecklistQuery = useQuery({
    queryKey: ['guard', 'checklist', profile?.userId],
    queryFn: fetchGuardChecklistItems,
    enabled: Boolean(profile?.userId) && !usePreviewFlow,
    refetchInterval: 60000,
  });

  const [draftItems, setDraftItems] = useState<GuardChecklistItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [infoVisible, setInfoVisible] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!usePreviewFlow && remoteChecklistQuery.data) {
      setDraftItems(remoteChecklistQuery.data);
    }
  }, [remoteChecklistQuery.data, usePreviewFlow]);

  const submitMutation = useMutation({
    mutationFn: async (items: GuardChecklistItem[]) => submitGuardChecklist(items),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['guard', 'checklist', profile?.userId],
      });
    },
  });

  const checklistItems = usePreviewFlow ? previewChecklistItems : draftItems;
  const checklistSubmittedAt = usePreviewFlow
    ? previewChecklistSubmittedAt
    : remoteChecklistQuery.data?.find((item) => item.completedAt)?.completedAt ?? null;

  const completedCount = useMemo(
    () =>
      checklistItems.filter((item) =>
        item.inputType === 'numeric'
          ? item.numericValue.trim().length > 0
          : item.status === 'completed',
      ).length,
    [checklistItems],
  );

  const progress = checklistItems.length ? (completedCount / checklistItems.length) * 100 : 0;
  const orderedChecklistItems = useMemo(() => {
    return [...checklistItems].sort((left, right) => {
      const leftPriority = left.requiredEvidence ? 0 : 1;
      const rightPriority = right.requiredEvidence ? 0 : 1;

      if (left.status !== right.status) {
        return left.status === 'pending' ? -1 : 1;
      }

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return left.title.localeCompare(right.title);
    });
  }, [checklistItems]);

  const updateRemoteDraftItem = (itemId: string, updater: (item: GuardChecklistItem) => GuardChecklistItem) => {
    setDraftItems((current) =>
      current.map((item) => (item.id === itemId ? updater(item) : item)),
    );
  };

  const handleToggle = async (itemId: string) => {
    if (dutyStatus === 'off_duty') {
      setMessage('You must clock in before completing checklist items.');
      return;
    }

    const item = checklistItems.find((entry) => entry.id === itemId);

    if (!item || checklistSubmittedAt) {
      return;
    }

    if (item.requiredEvidence && item.status === 'pending' && !item.evidenceUri) {
      setMessage(`Capture evidence for "${item.title}" before marking it complete.`);
      return;
    }

    if (item.inputType === 'numeric') {
      return;
    }

    setMessage(null);

    const becomingComplete = item.status === 'pending';

    if (usePreviewFlow) {
      await toggleChecklistItem(itemId);
    } else {
      updateRemoteDraftItem(itemId, (current) => {
        const isCompleted = current.status === 'completed';

        return {
          ...current,
          completedAt: isCompleted ? null : new Date().toISOString(),
          responseValue: isCompleted ? null : 'yes',
          status: isCompleted ? 'pending' : 'completed',
        };
      });
    }

    if (becomingComplete) {
      setToast(`"${item.title}" marked complete.`);
    }
  };

  const handleCaptureEvidence = async (itemId: string) => {
    setBusyItemId(itemId);
    setMessage(null);

    try {
      const photo = usePreviewFlow
        ? { uri: `qa://guard-checklist-evidence-${itemId}` }
        : await capturePhoto({
            cameraType: 'back',
            aspect: [4, 3],
          });

      if (!photo) {
        setMessage('Evidence capture was cancelled.');
        return;
      }

      if (usePreviewFlow) {
        await attachChecklistEvidence(itemId, photo.uri);
      } else {
        updateRemoteDraftItem(itemId, (current) => ({
          ...current,
          evidenceUri: photo.uri,
          status:
            current.inputType === 'numeric' && current.numericValue.trim().length === 0
              ? current.status
              : 'completed',
        }));
      }

      setMessage('Evidence attached successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not capture evidence right now.');
    } finally {
      setBusyItemId(null);
    }
  };

  const handleNumericValueChange = (itemId: string, value: string) => {
    updateRemoteDraftItem(itemId, (current) => ({
      ...current,
      completedAt: value.trim() ? new Date().toISOString() : null,
      numericValue: value,
      responseValue: value.trim() || null,
      status: value.trim() ? 'completed' : 'pending',
    }));
  };

  const handleSubmit = async () => {
    setMessage(null);

    if (usePreviewFlow) {
      const result = await submitPreviewChecklist();

      if (!result.submitted) {
        const nextMessage = 'Complete every checklist item before submitting the shift checklist.';
        setMessage(nextMessage);
        Alert.alert('Checklist incomplete', nextMessage);
        return;
      }

      const nextMessage =
        result.queued
          ? 'Checklist locked locally and queued for sync.'
          : 'Checklist submitted and locked for this shift.';
      setMessage(nextMessage);
      Alert.alert('Checklist submitted', nextMessage);
      return;
    }

    if (!isChecklistReady(checklistItems)) {
      const nextMessage = 'Complete every required response and attach proof before submitting.';
      setMessage(nextMessage);
      Alert.alert('Checklist incomplete', nextMessage);
      return;
    }

    try {
      const result = await submitMutation.mutateAsync(checklistItems);

      if (result?.success === false) {
        throw new Error(result.error ?? 'Checklist submission failed.');
      }

      const nextMessage = 'Checklist submitted through the backend workflow and locked for this shift.';
      setMessage(nextMessage);
      Alert.alert('Checklist submitted', nextMessage);
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : 'Checklist submission failed.';
      setMessage(nextMessage);
      Alert.alert('Checklist submission failed', nextMessage);
    }
  };

  return (
    <>
    <ScreenShell
      eyebrow="Daily Operations"
      title="Guard Checklist"
      description="Complete the shift checklist, attach proof where needed, and lock it once the round is finished."
      footer={
        <ActionButton
          label={
            checklistSubmittedAt
              ? 'Checklist locked'
              : submitMutation.isPending
                ? 'Submitting checklist...'
                : 'Submit and lock checklist'
          }
          loading={submitMutation.isPending}
          disabled={dutyStatus === 'off_duty' || Boolean(checklistSubmittedAt) || (!usePreviewFlow && !isChecklistReady(checklistItems))}
          testID="qa_guard_checklist_submit"
          onPress={() => void handleSubmit()}
        />
      }
    >
      {dutyStatus === 'off_duty' ? (
        <InfoCard>
          <View style={styles.warnRow}>
            <AlertTriangle color={colors.warning} size={18} />
            <View style={styles.warnCopy}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>You are off duty</Text>
              <Text style={[styles.caption, { color: colors.mutedForeground }]}>
                Return to the home screen and clock in before your shift actions are recorded.
              </Text>
            </View>
          </View>
        </InfoCard>
      ) : null}

      <InfoCard>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Shift progress</Text>
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>
              {completedCount} of {checklistItems.length} tasks complete
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable onPress={() => setInfoVisible(true)} hitSlop={10} testID="qa_guard_checklist_info">
              <Info color={colors.mutedForeground} size={18} />
            </Pressable>
            <StatusChip
              label={checklistSubmittedAt ? 'Locked' : usePreviewFlow ? 'Preview mode' : 'In progress'}
              tone={checklistSubmittedAt ? 'success' : usePreviewFlow ? 'warning' : 'info'}
            />
          </View>
        </View>
        <ProgressBar value={progress} />
        {message ? (
          <Text style={[styles.message, { color: colors.primary }]} testID="qa_guard_checklist_message">
            {message}
          </Text>
        ) : null}
        {checklistSubmittedAt ? (
          <Text style={[styles.caption, { color: colors.success }]}>
            Submitted at {new Date(checklistSubmittedAt).toLocaleString()}
          </Text>
        ) : null}
      </InfoCard>

      <Modal transparent animationType="fade" visible={infoVisible}>
        <Pressable style={styles.modalBackdrop} onPress={() => setInfoVisible(false)}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>How to finish this round</Text>
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>
              Finish the pending items first. If a task asks for photo proof, capture it before marking the task complete.
            </Text>
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>
              Tap anywhere outside to close.
            </Text>
          </View>
        </Pressable>
      </Modal>

      {orderedChecklistItems.map((item, index) => (
        <InfoCard key={item.id}>
          <Pressable
            disabled={Boolean(checklistSubmittedAt) || item.inputType === 'numeric'}
            onPress={() => void handleToggle(item.id)}
            testID={`qa_guard_checklist_toggle_${index}`}
            style={styles.itemHeader}
          >
            <View
              style={[
                styles.checkIcon,
                {
                  backgroundColor:
                    item.status === 'completed' ? colors.success : colors.secondary,
                  borderColor:
                    item.status === 'completed' ? colors.success : colors.border,
                },
              ]}
            >
              {item.status === 'completed' ? (
                <CheckCircle2 color={colors.successForeground} size={18} />
              ) : item.inputType === 'numeric' ? (
                <Hash color={colors.mutedForeground} size={18} />
              ) : (
                <ClipboardList color={colors.mutedForeground} size={18} />
              )}
            </View>
            <View style={styles.itemCopy}>
              <Text
                style={[styles.itemTitle, { color: colors.foreground }]}
                testID={`qa_guard_checklist_title_${index}`}
              >
                {item.title}
              </Text>
              <Text style={[styles.caption, { color: colors.mutedForeground }]}>{item.description}</Text>
            </View>
          </Pressable>

          <View style={styles.metaRow}>
            <StatusChip
              label={item.status === 'completed' ? 'Completed' : 'Pending'}
              tone={item.status === 'completed' ? 'success' : 'default'}
            />
            <StatusChip
              label={item.requiredEvidence ? 'Required' : 'Routine'}
              tone={item.requiredEvidence ? 'warning' : 'info'}
            />
            <StatusChip
              label={item.inputType === 'numeric' ? 'Reading' : 'Check'}
              tone={item.inputType === 'numeric' ? 'info' : 'default'}
            />
          </View>

          {item.inputType === 'numeric' ? (
            <FormField
              keyboardType="numeric"
              inputTestID={`qa_guard_checklist_numeric_${index}`}
              label={`Reading${item.numericUnitLabel ? ` (${item.numericUnitLabel})` : ''}`}
              onChangeText={(value) => handleNumericValueChange(item.id, value)}
              placeholder={
                item.numericMinValue != null && item.numericMaxValue != null
                  ? `${item.numericMinValue} - ${item.numericMaxValue}`
                  : 'Enter reading'
              }
              value={item.numericValue}
            />
          ) : null}

          <View style={styles.rowBetween}>
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              Updated: {formatCompletedAt(item.completedAt)}
            </Text>
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {item.evidenceUri ? 'Evidence attached' : 'No evidence attached'}
            </Text>
          </View>

          {item.inputType === 'yes_no' ? (
            <ActionButton
              label={item.status === 'completed' ? 'Mark pending' : 'Mark complete'}
              variant="ghost"
              disabled={Boolean(checklistSubmittedAt)}
              testID={`qa_guard_checklist_complete_${index}`}
              onPress={() => void handleToggle(item.id)}
            />
          ) : null}

          <ActionButton
            label={
              busyItemId === item.id
                ? 'Opening camera...'
                : item.evidenceUri
                  ? 'Retake evidence'
                  : 'Capture evidence'
            }
            variant="secondary"
            disabled={Boolean(checklistSubmittedAt) || busyItemId === item.id}
            testID={`qa_guard_checklist_evidence_${index}`}
            onPress={() => void handleCaptureEvidence(item.id)}
          />

          <View style={[styles.evidenceBadge, { backgroundColor: colors.secondary }]}>
            <Camera color={colors.info} size={16} />
            <Text style={[styles.evidenceText, { color: colors.foreground }]}>
              {item.evidenceUri
                ? 'Photo proof is attached and will be uploaded when this checklist is submitted.'
                : 'Use the back camera to attach proof if this task needs an image.'}
            </Text>
          </View>
        </InfoCard>
      ))}
    </ScreenShell>
    <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  warnRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  warnCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.base,
  },
  headerCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    gap: Spacing.base,
    width: '100%',
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
  message: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  itemHeader: {
    flexDirection: 'row',
    gap: Spacing.base,
  },
  checkIcon: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  itemTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.base,
  },
  metaText: {
    flex: 1,
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  evidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  evidenceText: {
    flex: 1,
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
});
