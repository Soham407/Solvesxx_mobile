import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Camera } from 'lucide-react-native';

import { StatusChip } from '../../components/guard/StatusChip';
import { ActionButton } from '../../components/shared/ActionButton';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  calculateDistanceMeters,
  getCurrentLocationFix,
  requestGeoFencePermissions,
} from '../../lib/location';
import { capturePhoto } from '../../lib/media';
import type { ServiceTabParamList } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import { getOrderedServiceTasks, useServiceStore } from '../../store/useServiceStore';
import type { ServiceLocationSnapshot, ServiceProofStage, ServiceRole } from '../../types/service';

type ServiceProofScreenProps = BottomTabScreenProps<ServiceTabParamList, 'ServiceProof'>;

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

function getProofTitle(role: ServiceRole) {
  if (role === 'delivery_boy') {
    return 'Delivery proof and attendance';
  }

  if (role === 'pest_control_technician') {
    return 'Safety, attendance, and service proof';
  }

  return 'Attendance and proof capture';
}

export function ServiceProofScreen(_props: ServiceProofScreenProps) {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const role = useServiceStore((state) => state.role);
  const dutyStatus = useServiceStore((state) => state.dutyStatus);
  const lastKnownLocation = useServiceStore((state) => state.lastKnownLocation);
  const attendanceLog = useServiceStore((state) => state.attendanceLog);
  const ppeChecklist = useServiceStore((state) => state.ppeChecklist);
  const tasks = useServiceStore((state) => state.tasks);
  const rememberLocation = useServiceStore((state) => state.rememberLocation);
  const checkInWithSelfie = useServiceStore((state) => state.checkInWithSelfie);
  const checkOutWithSelfie = useServiceStore((state) => state.checkOutWithSelfie);
  const togglePPEItem = useServiceStore((state) => state.togglePPEItem);
  const attachTaskProof = useServiceStore((state) => state.attachTaskProof);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const orderedTasks = useMemo(() => getOrderedServiceTasks(tasks), [tasks]);
  const proofEligibleTasks = useMemo(
    () =>
      orderedTasks.filter((task) => task.status !== 'completed' && task.status !== 'delivered'),
    [orderedTasks],
  );

  useEffect(() => {
    if (!proofEligibleTasks.length) {
      if (selectedTaskId !== null) {
        setSelectedTaskId(null);
      }

      return;
    }

    const hasCurrentSelection = proofEligibleTasks.some((task) => task.id === selectedTaskId);

    if (!hasCurrentSelection) {
      setSelectedTaskId(proofEligibleTasks[0]?.id ?? null);
    }
  }, [proofEligibleTasks, selectedTaskId]);

  const selectedTask = proofEligibleTasks.find((task) => task.id === selectedTaskId) ?? null;

  async function buildLocationSnapshot() {
    const permissions = await requestGeoFencePermissions();

    if (!permissions.foregroundGranted) {
      throw new Error('Location access is required for service attendance.');
    }

    const fix = await getCurrentLocationFix();
    const assignedLocation = profile?.assignedLocation;

    let distanceFromAssignedSite: number | null = null;
    let withinGeoFence = true;

    if (assignedLocation?.latitude != null && assignedLocation.longitude != null) {
      distanceFromAssignedSite = calculateDistanceMeters(
        fix.coords.latitude,
        fix.coords.longitude,
        assignedLocation.latitude,
        assignedLocation.longitude,
      );
      withinGeoFence = distanceFromAssignedSite <= assignedLocation.geoFenceRadius;
    }

    const snapshot: ServiceLocationSnapshot = {
      latitude: fix.coords.latitude,
      longitude: fix.coords.longitude,
      capturedAt: new Date().toISOString(),
      distanceFromAssignedSite,
      withinGeoFence,
    };

    await rememberLocation(snapshot);
    return snapshot;
  }

  const handleAttendance = async () => {
    setIsBusy(true);
    setMessage(null);

    try {
      const location = await buildLocationSnapshot();
      const photo = await capturePhoto({
        cameraType: 'front',
        aspect: [1, 1],
      });

      if (!photo) {
        setMessage('Attendance capture was cancelled before the selfie was saved.');
        return;
      }

      if (dutyStatus === 'off_duty' && !location.withinGeoFence) {
        setMessage(
          location.distanceFromAssignedSite == null
            ? 'Move closer to the assigned site before checking in.'
            : `You are ${location.distanceFromAssignedSite}m away. Move inside the geo-fence to check in.`,
        );
        return;
      }

      if (dutyStatus === 'off_duty') {
        await checkInWithSelfie({
          location,
          photoUri: photo.uri,
        });
        setMessage('Attendance captured. Task actions are now unlocked.');
      } else {
        await checkOutWithSelfie({
          location,
          photoUri: photo.uri,
        });
        setMessage('Attendance closed for this service shift.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Attendance could not be updated.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleCaptureProof = async (stage: ServiceProofStage) => {
    if (!selectedTask) {
      setMessage('Select a task before capturing proof.');
      return;
    }

    if (dutyStatus !== 'on_duty') {
      setMessage('Complete selfie attendance before capturing service proof.');
      return;
    }

    if (selectedTask.taskType === 'delivery' && stage !== 'delivery') {
      setMessage('Use delivery proof capture for delivery tasks.');
      return;
    }

    if (selectedTask.taskType !== 'delivery' && stage === 'delivery') {
      setMessage('Delivery proof is only available on delivery tasks.');
      return;
    }

    setIsBusy(true);
    setMessage(null);

    try {
      const photo = await capturePhoto({
        cameraType: 'back',
        allowsEditing: false,
        aspect: [4, 3],
      });

      if (!photo) {
        setMessage('Proof capture was cancelled before the image was saved.');
        return;
      }

      await attachTaskProof(selectedTask.id, stage, photo.uri);
      setMessage(
        stage === 'before'
          ? `Before proof attached to ${selectedTask.referenceCode}.`
          : stage === 'after'
            ? `After proof attached to ${selectedTask.referenceCode}.`
            : `Delivery proof attached to ${selectedTask.referenceCode}.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Proof capture could not be completed.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <ScreenShell
      eyebrow="Service Proof"
      title={getProofTitle(role)}
      description="Capture selfie attendance, complete mandatory pest-control PPE checks, and attach job evidence directly to the active field task."
    >
      <InfoCard>
        <View style={styles.headerRow}>
          <View style={styles.copyWrap}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Attendance gate</Text>
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>
              Last service attendance action: {formatTimestamp(attendanceLog[0]?.recordedAt ?? null)}
            </Text>
          </View>
          <Camera color={colors.primary} size={22} />
        </View>
        {message ? (
          <Text style={[styles.caption, { color: colors.primary }]} testID="qa_service_proof_message">
            {message}
          </Text>
        ) : null}
        <Text style={[styles.caption, { color: colors.foreground }]}>
          Latest location: {formatTimestamp(lastKnownLocation?.capturedAt ?? null)}
        </Text>
        <Text style={[styles.caption, { color: colors.foreground }]}>
          {lastKnownLocation?.distanceFromAssignedSite == null
            ? 'No geo-fence snapshot captured yet.'
            : `${lastKnownLocation.distanceFromAssignedSite}m from the assigned site`}
        </Text>
        <ActionButton
          label={dutyStatus === 'on_duty' ? 'Check out with selfie' : 'Check in with selfie'}
          loading={isBusy}
          onPress={() => void handleAttendance()}
          testID="qa_service_attendance_button"
        />
      </InfoCard>

      {role === 'pest_control_technician' ? (
        <InfoCard>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mandatory PPE checklist</Text>
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>
            Pest-control work cannot start until every required item is checked off.
          </Text>
          <View style={styles.ppeWrap}>
            {ppeChecklist.map((item) => (
              <Pressable
                key={item.id}
                testID={`qa_service_ppe_${item.id}`}
                accessibilityRole="button"
                onPress={() => void togglePPEItem(item.id)}
                style={[
                  styles.ppeItem,
                  {
                    backgroundColor: item.checked ? colors.success : colors.secondary,
                    borderColor: item.checked ? colors.success : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.ppeLabel,
                    { color: item.checked ? colors.successForeground : colors.foreground },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </InfoCard>
      ) : null}

      <InfoCard>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Proof target</Text>
        <View style={styles.selectorWrap}>
          {proofEligibleTasks.length ? (
            proofEligibleTasks.map((task, index) => {
              const isSelected = task.id === selectedTaskId;

              return (
                <Pressable
                  key={task.id}
                  testID={`qa_service_proof_task_${index}`}
                  accessibilityRole="button"
                  onPress={() => setSelectedTaskId(task.id)}
                  style={[
                    styles.selectorButton,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.secondary,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.selectorLabel,
                      { color: isSelected ? colors.primaryForeground : colors.foreground },
                    ]}
                  >
                    {task.referenceCode}
                  </Text>
                </Pressable>
              );
            })
          ) : (
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>
              No open task is waiting for proof right now.
            </Text>
          )}
        </View>

        {selectedTask ? (
          <>
            <View style={styles.headerRow}>
              <View style={styles.copyWrap}>
                <Text
                  style={[styles.taskTitle, { color: colors.foreground }]}
                  testID="qa_service_proof_selected_title"
                >
                  {selectedTask.title}
                </Text>
                <Text style={[styles.caption, { color: colors.mutedForeground }]}>
                  {selectedTask.referenceCode} | {selectedTask.locationName}
                </Text>
              </View>
              <StatusChip label={selectedTask.status.replace(/_/g, ' ')} tone="info" />
            </View>
            <Text style={[styles.caption, { color: colors.foreground }]}>
              Before proof: {selectedTask.beforePhotoUri ? 'attached' : 'pending'}
            </Text>
            <Text style={[styles.caption, { color: colors.foreground }]}>
              After proof: {selectedTask.afterPhotoUri ? 'attached' : 'pending'}
            </Text>
            {selectedTask.taskType === 'delivery' ? (
              <Text style={[styles.caption, { color: colors.foreground }]}>
                Delivery proof: {selectedTask.deliveryProofUri ? 'attached' : 'pending'}
              </Text>
            ) : null}
            <View style={styles.actionStack}>
              {selectedTask.taskType === 'delivery' ? (
                <ActionButton
                  label="Capture delivery proof"
                  variant="secondary"
                  disabled={isBusy}
                  onPress={() => void handleCaptureProof('delivery')}
                />
              ) : (
                <>
                  <ActionButton
                    label="Capture before photo"
                    variant="secondary"
                    disabled={isBusy}
                    onPress={() => void handleCaptureProof('before')}
                  />
                  <ActionButton
                    label="Capture after photo"
                    variant="ghost"
                    disabled={isBusy}
                    onPress={() => void handleCaptureProof('after')}
                  />
                </>
              )}
            </View>
          </>
        ) : null}
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
  ppeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  ppeItem: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  ppeLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.sm,
  },
  selectorWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  selectorButton: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  selectorLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.sm,
  },
  taskTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
  actionStack: {
    gap: Spacing.base,
  },
});
