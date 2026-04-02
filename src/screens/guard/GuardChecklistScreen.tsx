import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Camera, CheckCircle2, ClipboardList } from 'lucide-react-native';

import { ProgressBar } from '../../components/guard/ProgressBar';
import { StatusChip } from '../../components/guard/StatusChip';
import { ActionButton } from '../../components/shared/ActionButton';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import { capturePhoto } from '../../lib/media';
import type { GuardTabParamList } from '../../navigation/types';
import { useGuardStore } from '../../store/useGuardStore';

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

export function GuardChecklistScreen(_props: GuardChecklistScreenProps) {
  const { colors } = useAppTheme();
  const checklistItems = useGuardStore((state) => state.checklistItems);
  const checklistSubmittedAt = useGuardStore((state) => state.checklistSubmittedAt);
  const isOfflineMode = useGuardStore((state) => state.isOfflineMode);
  const toggleChecklistItem = useGuardStore((state) => state.toggleChecklistItem);
  const attachChecklistEvidence = useGuardStore((state) => state.attachChecklistEvidence);
  const submitChecklist = useGuardStore((state) => state.submitChecklist);

  const [message, setMessage] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const completedCount = useMemo(
    () => checklistItems.filter((item) => item.status === 'completed').length,
    [checklistItems],
  );

  const progress = checklistItems.length ? (completedCount / checklistItems.length) * 100 : 0;

  const handleToggle = async (itemId: string) => {
    const item = checklistItems.find((entry) => entry.id === itemId);

    if (!item || checklistSubmittedAt) {
      return;
    }

    if (item.requiredEvidence && item.status === 'pending' && !item.evidenceUri) {
      setMessage(`Capture evidence for "${item.title}" before marking it complete.`);
      return;
    }

    setMessage(null);
    await toggleChecklistItem(itemId);
  };

  const handleCaptureEvidence = async (itemId: string) => {
    setBusyItemId(itemId);
    setMessage(null);

    try {
      const photo = await capturePhoto({
        cameraType: 'back',
        aspect: [4, 3],
      });

      if (!photo) {
        setMessage('Evidence capture was cancelled.');
        return;
      }

      await attachChecklistEvidence(itemId, photo.uri);
      setMessage('Evidence attached successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not capture evidence right now.');
    } finally {
      setBusyItemId(null);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await submitChecklist();

      if (!result.submitted) {
        setMessage('Complete every checklist item before submitting the shift checklist.');
        return;
      }

      setMessage(
        result.queued
          ? 'Checklist locked locally and queued for sync.'
          : 'Checklist submitted and locked for this shift.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenShell
      eyebrow="Daily Operations"
      title="Guard Checklist"
      description="Complete the daily security checklist, attach photo proof where needed, and lock it once the shift is fully verified."
      footer={
        <ActionButton
          label={checklistSubmittedAt ? 'Checklist locked' : 'Submit and lock checklist'}
          loading={isSubmitting}
          disabled={Boolean(checklistSubmittedAt)}
          onPress={() => void handleSubmit()}
        />
      }
    >
      <InfoCard>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Shift progress</Text>
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>
              {completedCount} of {checklistItems.length} tasks complete
            </Text>
          </View>
          <StatusChip
            label={checklistSubmittedAt ? 'Locked' : isOfflineMode ? 'Offline-safe' : 'Ready to sync'}
            tone={checklistSubmittedAt ? 'success' : isOfflineMode ? 'warning' : 'info'}
          />
        </View>
        <ProgressBar value={progress} />
        {message ? <Text style={[styles.message, { color: colors.primary }]}>{message}</Text> : null}
        {checklistSubmittedAt ? (
          <Text style={[styles.caption, { color: colors.success }]}>
            Submitted at {new Date(checklistSubmittedAt).toLocaleString()}
          </Text>
        ) : null}
      </InfoCard>

      {checklistItems.map((item) => (
        <InfoCard key={item.id}>
          <Pressable
            disabled={Boolean(checklistSubmittedAt)}
            onPress={() => void handleToggle(item.id)}
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
              ) : (
                <ClipboardList color={colors.mutedForeground} size={18} />
              )}
            </View>
            <View style={styles.itemCopy}>
              <Text style={[styles.itemTitle, { color: colors.foreground }]}>{item.title}</Text>
              <Text style={[styles.caption, { color: colors.mutedForeground }]}>{item.description}</Text>
            </View>
          </Pressable>

          <View style={styles.metaRow}>
            <StatusChip
              label={item.status === 'completed' ? 'Completed' : 'Pending'}
              tone={item.status === 'completed' ? 'success' : 'default'}
            />
            <StatusChip
              label={item.requiredEvidence ? 'Photo proof required' : 'Visual check'}
              tone={item.requiredEvidence ? 'warning' : 'info'}
            />
          </View>

          <View style={styles.rowBetween}>
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              Updated: {formatCompletedAt(item.completedAt)}
            </Text>
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {item.evidenceUri ? 'Evidence attached' : 'No evidence attached'}
            </Text>
          </View>

          <ActionButton
            label={busyItemId === item.id ? 'Opening camera...' : item.evidenceUri ? 'Retake evidence' : 'Capture evidence'}
            variant="secondary"
            disabled={Boolean(checklistSubmittedAt) || busyItemId === item.id}
            onPress={() => void handleCaptureEvidence(item.id)}
          />

          <View style={[styles.evidenceBadge, { backgroundColor: colors.secondary }]}>
            <Camera color={colors.info} size={16} />
            <Text style={[styles.evidenceText, { color: colors.foreground }]}>
              {item.evidenceUri
                ? 'Evidence saved on device for this checklist item.'
                : 'Use the back camera to attach a work-proof image.'}
            </Text>
          </View>
        </InfoCard>
      ))}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.base,
  },
  headerCopy: {
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
