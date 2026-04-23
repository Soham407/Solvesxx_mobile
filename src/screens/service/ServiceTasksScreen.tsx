import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { ClipboardList } from 'lucide-react-native';

import { StatusChip } from '../../components/guard/StatusChip';
import { ActionButton } from '../../components/shared/ActionButton';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Toast } from '../../components/shared/Toast';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { ServiceTabParamList } from '../../navigation/types';
import { getOrderedServiceTasks, useServiceStore } from '../../store/useServiceStore';
import type { ServiceTaskRecord } from '../../types/service';

type ServiceTasksScreenProps = BottomTabScreenProps<ServiceTabParamList, 'ServiceTasks'>;

function formatTimestamp(value: string | null) {
  if (!value) {
    return 'Not yet';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

function getStatusTone(status: ServiceTaskRecord['status']) {
  if (status === 'completed' || status === 'delivered') {
    return 'success';
  }

  if (status === 'awaiting_material') {
    return 'warning';
  }

  return 'info';
}

function getProofSummary(task: ServiceTaskRecord) {
  if (task.taskType === 'delivery') {
    return task.deliveryProofUri ? 'Delivery proof attached' : 'Delivery proof pending';
  }

  if (task.requiresBeforeAfterPhotos) {
    if (task.beforePhotoUri && task.afterPhotoUri) {
      return 'Before and after proof attached';
    }

    if (task.beforePhotoUri || task.afterPhotoUri) {
      return 'One of the required proof photos is still missing';
    }

    return 'Before and after proof still required';
  }

  return 'Proof photos are optional for this task';
}

export function ServiceTasksScreen(_props: ServiceTasksScreenProps) {
  const { colors } = useAppTheme();
  const tasks = useServiceStore((state) => state.tasks);
  const startTask = useServiceStore((state) => state.startTask);
  const advanceDeliveryTask = useServiceStore((state) => state.advanceDeliveryTask);
  const completeTask = useServiceStore((state) => state.completeTask);
  const orderedTasks = useMemo(() => getOrderedServiceTasks(tasks), [tasks]);
  const [toast, setToast] = useState<string | null>(null);

  const handleStart = async (task: ServiceTaskRecord) => {
    const result = await startTask(task.id);
    setToast(
      result.started
        ? task.taskType === 'delivery'
          ? `${task.referenceCode} picked up and ready for transit.`
          : `${task.referenceCode} is now live in the field workspace.`
        : result.reason ?? 'The task could not be started right now.',
    );
  };

  const handleAdvanceDelivery = async (task: ServiceTaskRecord) => {
    const result = await advanceDeliveryTask(task.id);
    const nextMessage =
      task.status === 'picked_up'
        ? `${task.referenceCode} moved into in-transit status.`
        : `${task.referenceCode} was delivered and closed.`;
    setToast(result.advanced ? nextMessage : result.reason ?? 'Delivery status could not change.');
  };

  const handleComplete = async (task: ServiceTaskRecord) => {
    const result = await completeTask(task.id);
    setToast(
      result.completed
        ? `${task.referenceCode} completed and ready for manager follow-up.`
        : result.reason ?? 'The task could not be completed right now.',
    );
  };

  return (
    <>
    <ScreenShell
      eyebrow="Service Tasks"
      title="Assigned jobs and field progression"
      description="Start work, advance delivery states, and close service jobs only after the required proof and approvals are in place."
    >
      <InfoCard>
        <View style={styles.headerRow}>
          <View style={styles.copyWrap}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Task board</Text>
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>
              This board mirrors the Phase 5 workflow states used by the mobile service roles.
            </Text>
          </View>
          <ClipboardList color={colors.primary} size={22} />
        </View>
      </InfoCard>

      <InfoCard>
        {orderedTasks.length ? (
          orderedTasks.map((task, index) => (
            <View key={task.id} style={styles.taskCard} testID={`qa_service_task_card_${index}`}>
              <View style={styles.headerRow}>
                <View style={styles.copyWrap}>
                  <Text
                    style={[styles.taskTitle, { color: colors.foreground }]}
                    testID={`qa_service_task_title_${index}`}
                  >
                    {task.title}
                  </Text>
                  <Text style={[styles.caption, { color: colors.mutedForeground }]}>
                    {task.referenceCode} | {task.locationName}
                  </Text>
                </View>
                <View testID={`qa_service_task_status_${index}`}>
                  <StatusChip label={task.status.replace(/_/g, ' ')} tone={getStatusTone(task.status)} />
                </View>
              </View>
              <Text style={[styles.caption, { color: colors.foreground }]}>{task.description}</Text>
              <Text style={[styles.caption, { color: colors.mutedForeground }]}>
                Scheduled {formatTimestamp(task.scheduledFor)} | Started {formatTimestamp(task.startedAt)}
              </Text>
              <Text style={[styles.caption, { color: colors.foreground }]}>
                {getProofSummary(task)}
              </Text>
              {task.requiresResidentNotification ? (
                <Text style={[styles.caption, { color: colors.foreground }]}>
                  Resident notification:{' '}
                  {task.residentNotificationSentAt
                    ? `sent at ${formatTimestamp(task.residentNotificationSentAt)}`
                    : 'will auto-send when work starts'}
                </Text>
              ) : null}
              {task.notes ? (
                <Text style={[styles.caption, { color: colors.foreground }]}>{task.notes}</Text>
              ) : null}

              {task.status === 'assigned' ? (
                <ActionButton
                  label={task.taskType === 'delivery' ? 'Mark picked up' : 'Start work'}
                  variant="secondary"
                  testID={`qa_service_task_start_${index}`}
                  onPress={() => void handleStart(task)}
                />
              ) : null}

              {task.taskType === 'delivery' && task.status === 'picked_up' ? (
                <ActionButton
                  label="Mark in transit"
                  variant="ghost"
                  testID={`qa_service_task_in_transit_${index}`}
                  onPress={() => void handleAdvanceDelivery(task)}
                />
              ) : null}

              {task.taskType === 'delivery' && task.status === 'in_transit' ? (
                <ActionButton
                  label="Mark delivered"
                  variant="ghost"
                  testID={`qa_service_task_delivered_${index}`}
                  onPress={() => void handleAdvanceDelivery(task)}
                />
              ) : null}

              {task.taskType !== 'delivery' && task.status === 'in_progress' ? (
                <ActionButton
                  label="Complete task"
                  variant="ghost"
                  testID={`qa_service_task_complete_${index}`}
                  onPress={() => void handleComplete(task)}
                />
              ) : null}

              {task.status === 'awaiting_material' ? (
                <Text style={[styles.caption, { color: colors.warning }]}>
                  Waiting on material approval or issue before the job can continue.
                </Text>
              ) : null}
            </View>
          ))
        ) : (
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>
            No active service tasks are currently assigned to this role.
          </Text>
        )}
      </InfoCard>
    </ScreenShell>
    <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
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
  taskCard: {
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  taskTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
});
