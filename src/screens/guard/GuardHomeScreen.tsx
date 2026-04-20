import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { AlertTriangle, ClipboardList, MapPin, ShieldAlert, Users } from 'lucide-react-native';

import { MetricCard } from '../../components/guard/MetricCard';
import { StatusChip } from '../../components/guard/StatusChip';
import { ActionButton } from '../../components/shared/ActionButton';
import { FormField } from '../../components/shared/FormField';
import { InfoCard } from '../../components/shared/InfoCard';
import { PreviewModeBanner } from '../../components/shared/PreviewModeBanner';
import { NotificationInboxCard } from '../../components/shared/NotificationInboxCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import { capturePhoto } from '../../lib/media';
import {
  fetchGuardVisitors,
  isPreviewProfile,
  recordGuardAttendanceAction,
  recordGuardGpsTracking,
  startGuardPanicAlert,
} from '../../lib/mobileBackend';
import {
  calculateDistanceMeters,
  getCurrentLocationFix,
  requestGeoFencePermissions,
} from '../../lib/location';
import {
  buildAssignedLocationSnapshot,
  getStagingAutomationImageUri,
  isStagingAutomationEnabled,
  isStagingAutomationProfile,
} from '../../lib/stagingAutomation';
import type { GuardTabParamList } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import { useGuardStore } from '../../store/useGuardStore';
import type { GuardLocationSnapshot } from '../../types/guard';
import type { GuardSosType } from '../../types/guard';

type GuardHomeScreenProps = BottomTabScreenProps<GuardTabParamList, 'GuardHome'>;

function formatTimestamp(value: string | null) {
  if (!value) {
    return 'Not yet';
  }

  return new Date(value).toLocaleString([], {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  });
}

function getTodayCount(values: Array<{ recordedAt: string }>) {
  const today = new Date().toDateString();
  return values.filter((value) => new Date(value.recordedAt).toDateString() === today).length;
}

export function GuardHomeScreen({ navigation }: GuardHomeScreenProps) {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const dutyStatus = useGuardStore((state) => state.dutyStatus);
  const isOfflineMode = useGuardStore((state) => state.isOfflineMode);
  const offlineQueue = useGuardStore((state) => state.offlineQueue);
  const lastSyncAt = useGuardStore((state) => state.lastSyncAt);
  const attendanceLog = useGuardStore((state) => state.attendanceLog);
  const visitorLog = useGuardStore((state) => state.visitorLog);
  const sosEvents = useGuardStore((state) => state.sosEvents);
  const lastPatrolResetAt = useGuardStore((state) => state.lastPatrolResetAt);
  const lastKnownLocation = useGuardStore((state) => state.lastKnownLocation);
  const setOfflineMode = useGuardStore((state) => state.setOfflineMode);
  const rememberLocation = useGuardStore((state) => state.rememberLocation);
  const clockIn = useGuardStore((state) => state.clockIn);
  const clockOut = useGuardStore((state) => state.clockOut);
  const triggerSos = useGuardStore((state) => state.triggerSos);
  const resetPatrolClock = useGuardStore((state) => state.resetPatrolClock);
  const flushOfflineQueue = useGuardStore((state) => state.flushOfflineQueue);
  const signOut = useAppStore((state) => state.signOut);
  const previewMode = isPreviewProfile(profile);
  const usePreviewFlow = previewMode || isOfflineMode;

  const [message, setMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [selectedSosType, setSelectedSosType] = useState<GuardSosType>('panic');
  const [sosNote, setSosNote] = useState('');
  const [statusDetailsOpen, setStatusDetailsOpen] = useState(previewMode);

  const visitorsQuery = useQuery({
    queryKey: ['guard', 'visitors', profile?.userId],
    queryFn: () => fetchGuardVisitors(true),
    enabled: Boolean(profile?.userId) && !usePreviewFlow,
    refetchInterval: 10000,
  });

  const pendingVisitors = useMemo(
    () =>
      usePreviewFlow
        ? visitorLog.filter((entry) => entry.status === 'inside').length
        : (visitorsQuery.data ?? []).filter((entry) => entry.status === 'inside').length,
    [usePreviewFlow, visitorLog, visitorsQuery.data],
  );

  const recentSosCount = useMemo(() => getTodayCount(sosEvents), [sosEvents]);
  const attendanceCount = useMemo(() => getTodayCount(attendanceLog), [attendanceLog]);
  const latestGuardEvidencePhotoUri = useMemo(
    () => attendanceLog.find((entry) => entry.photoUri)?.photoUri ?? profile?.employeePhotoUrl ?? null,
    [attendanceLog, profile?.employeePhotoUrl],
  );

  async function buildLocationSnapshot() {
    if (usePreviewFlow || (isStagingAutomationEnabled() && isStagingAutomationProfile(profile))) {
      const snapshot = buildAssignedLocationSnapshot(profile?.assignedLocation ?? null);

      await rememberLocation(snapshot);
      return snapshot;
    }

    if (!profile?.assignedLocation) {
      throw new Error('Assigned site is missing. Contact admin before using guard operations.');
    }

    const permissions = await requestGeoFencePermissions();

    if (!permissions.foregroundGranted) {
      throw new Error('Location access is required for guard attendance and SOS capture.');
    }

    const fix = await getCurrentLocationFix();
    const assignedLocation = profile.assignedLocation;

    let distanceFromAssignedSite: number | null = null;
    let withinGeoFence = true;

    if (
      assignedLocation?.latitude != null &&
      assignedLocation.longitude != null
    ) {
      distanceFromAssignedSite = calculateDistanceMeters(
        fix.coords.latitude,
        fix.coords.longitude,
        assignedLocation.latitude,
        assignedLocation.longitude,
      );
      withinGeoFence = distanceFromAssignedSite <= assignedLocation.geoFenceRadius;
    }

    const snapshot: GuardLocationSnapshot = {
      latitude: fix.coords.latitude,
      longitude: fix.coords.longitude,
      capturedAt: new Date().toISOString(),
      distanceFromAssignedSite,
      withinGeoFence,
    };

    await rememberLocation(snapshot);
    await recordGuardGpsTracking({
      profile,
      location: snapshot,
      batteryLevel: null,
    });
    return snapshot;
  }

  const handleRefreshLocation = async () => {
    setIsBusy(true);
    setMessage(null);

    try {
      const location = await buildLocationSnapshot();
      setMessage(
        location.distanceFromAssignedSite == null
          ? 'Live location refreshed.'
          : `Live location refreshed. You are ${location.distanceFromAssignedSite}m from the assigned site.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not refresh the live location.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDutyAction = async () => {
    setIsBusy(true);
    setMessage(null);

    try {
      const location = await buildLocationSnapshot();
      const photo = usePreviewFlow
        ? { uri: 'qa://guard-preview-selfie' }
        : await capturePhoto({
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
            ? 'Move closer to the assigned site before clocking in.'
            : `You are ${location.distanceFromAssignedSite}m away. Move inside the geo-fence to clock in.`,
        );
        return;
      }

      const result =
        dutyStatus === 'off_duty'
          ? (await recordGuardAttendanceAction({
              action: 'check-in',
              profile,
              location,
              photoUri: photo.uri,
            }),
            await clockIn({
              location,
              photoUri: photo.uri,
            }))
          : (await recordGuardAttendanceAction({
              action: 'check-out',
              profile,
              location,
              photoUri: photo.uri,
              fallbackClockInEntry:
                attendanceLog.find((entry) => entry.action === 'clock_in') ?? null,
            }),
            await clockOut({
              location,
              photoUri: photo.uri,
            }));

      setMessage(
        dutyStatus === 'off_duty'
          ? result.queued
            ? 'Clock-in captured offline. It will sync when the app is back online.'
            : 'Shift started successfully.'
          : result.queued
            ? 'Clock-out saved offline. It will sync when connectivity returns.'
            : 'Shift closed successfully.',
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Attendance could not be completed.');
    } finally {
      setIsBusy(false);
    }
  };

  const submitSosAlert = async (options: {
    alertType: GuardSosType;
    location: GuardLocationSnapshot;
    note: string;
    photoUri: string;
  }) => {
    if (!usePreviewFlow) {
      const backendResult = await startGuardPanicAlert({
        alertType: options.alertType,
        note: options.note,
        location: options.location,
        photoUri: options.photoUri,
      });

      if (backendResult?.success === false) {
        throw new Error(backendResult.error ?? 'SOS could not be sent.');
      }
    }

    const result = await triggerSos({
      alertType: options.alertType,
      note: options.note,
      location: options.location,
      photoUri: options.photoUri,
    });

    setMessage(
      usePreviewFlow && result.queued
        ? 'SOS recorded offline with photo evidence. It is waiting in the sync queue.'
        : 'SOS alert recorded with live location and sent into the supervisor escalation flow.',
    );
  };

  const getDefaultSosNote = (alertType: GuardSosType) => {
    if (alertType === 'inactivity') {
      return 'Guard manually raised an inactivity escalation with supporting evidence.';
    }

    if (alertType === 'geo_fence_breach') {
      return 'Guard manually reported a geo-fence breach with supporting evidence.';
    }

    return 'Guard manually triggered the panic workflow with supporting evidence.';
  };

  const handleTriggerSos = async (options: { alertType: GuardSosType; note: string }) => {
    if (isBusy) {
      return;
    }

    setIsBusy(true);
    setMessage(null);

    try {
      const location = await buildLocationSnapshot();

      if (usePreviewFlow) {
        await submitSosAlert({
          alertType: options.alertType,
          location,
          note: options.note || getDefaultSosNote(options.alertType),
          photoUri: 'qa://guard-preview-sos',
        });
        return;
      }

      if (isStagingAutomationEnabled() && isStagingAutomationProfile(profile)) {
        await submitSosAlert({
          alertType: options.alertType,
          location,
          note: options.note || getDefaultSosNote(options.alertType),
          photoUri: getStagingAutomationImageUri(),
        });
        return;
      }

      const photo = await capturePhoto({
        cameraType: 'front',
        aspect: [1, 1],
      });

      if (!photo) {
        setMessage('SOS capture was cancelled before evidence was recorded.');
        return;
      }

      await submitSosAlert({
        alertType: options.alertType,
        location,
        note: options.note || getDefaultSosNote(options.alertType),
        photoUri: photo.uri ?? latestGuardEvidencePhotoUri ?? '',
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'SOS alert could not be created.');
    } finally {
      setIsBusy(false);
    }
  };

  const openSosFlow = () => {
    if (isBusy) {
      return;
    }

    setSosModalOpen(true);
  };

  const confirmSosFlow = async () => {
    setSosModalOpen(false);
    await handleTriggerSos({
      alertType: selectedSosType,
      note: sosNote.trim(),
    });
  };

  const handleSyncQueue = async () => {
    setIsSyncing(true);
    setMessage(null);

    try {
      const syncedCount = await flushOfflineQueue();
      setMessage(
        syncedCount
          ? `${syncedCount} queued action${syncedCount === 1 ? '' : 's'} reconciled locally and cleared from the offline queue.`
          : 'Nothing is waiting in the offline queue.',
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetPatrolTimer = async () => {
    setMessage(null);

    await resetPatrolClock();
    setMessage('Patrol timer reset successfully.');
  };

  const firstName = profile?.fullName?.split(' ')[0] ?? 'Guard';
  const geoStatusTone = lastKnownLocation?.withinGeoFence ? 'success' : 'warning';
  const statusSummary = lastKnownLocation?.withinGeoFence
    ? 'Inside assigned site'
    : lastKnownLocation?.capturedAt
      ? 'Needs location check'
      : 'Location not captured yet';

  return (
    <ScreenShell
      eyebrow="Security Guard"
      title={`Ready for duty, ${firstName}`}
      description="Use this workspace for attendance, visitor handling, and emergency response during a live shift."
    >
      {previewMode ? (
        <PreviewModeBanner description="This guard session is using preview/test identity paths. Validate real guard behavior only with a non-preview backend account." />
      ) : null}

      <InfoCard>
        <View style={styles.heroHeader}>
          <View style={styles.heroTitleWrap}>
            <StatusChip
              label={dutyStatus === 'on_duty' ? 'On duty' : 'Off duty'}
              tone={dutyStatus === 'on_duty' ? 'success' : 'default'}
            />
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>
              {profile?.assignedLocation?.locationName ?? 'Assigned site pending'}
            </Text>
          </View>
          <StatusChip label={isOfflineMode ? 'Offline mode' : 'Live sync'} tone={isOfflineMode ? 'warning' : 'info'} />
        </View>
        <Text style={[styles.heroCaption, { color: colors.mutedForeground }]}>
          Last patrol reset: {formatTimestamp(lastPatrolResetAt)}
        </Text>
        {message ? (
          <Text style={[styles.message, { color: colors.primary }]} testID="qa_guard_home_message">
            {message}
          </Text>
        ) : null}
        <View style={styles.heroActions}>
          <ActionButton
            label={dutyStatus === 'on_duty' ? 'Selfie clock out' : 'Selfie clock in'}
            loading={isBusy}
            testID="qa_guard_duty_action"
            onPress={() => void handleDutyAction()}
          />
          <ActionButton
            label="Refresh location"
            variant="secondary"
            disabled={isBusy}
            testID="qa_guard_refresh_location"
            onPress={() => void handleRefreshLocation()}
          />
        </View>
      </InfoCard>

      <InfoCard>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick actions</Text>
        <Text style={[styles.sectionCaption, { color: colors.mutedForeground }]}>
          Use these during a normal gate shift.
        </Text>
        <View style={styles.heroActions}>
          <ActionButton
            label="Log visitor"
            variant="secondary"
            testID="qa_guard_open_visitors"
            onPress={() => navigation.navigate('GuardVisitors')}
          />
          <ActionButton
            label="Open checklist"
            variant="secondary"
            testID="qa_guard_open_checklist"
            onPress={() => navigation.navigate('GuardChecklist')}
          />
          <ActionButton
            label="Emergency contacts"
            variant="ghost"
            testID="qa_guard_open_contacts"
            onPress={() => navigation.navigate('GuardContacts')}
          />
        </View>
      </InfoCard>

      <Pressable
        accessibilityRole="button"
        disabled={isBusy}
        onPress={openSosFlow}
        testID="qa_guard_sos_trigger"
        style={[
          styles.sosCard,
          {
            backgroundColor: colors.destructive,
            borderColor: colors.destructive,
            opacity: isBusy ? 0.7 : 1,
          },
        ]}
      >
        <ShieldAlert color={colors.destructiveForeground} size={28} />
        <Text style={[styles.sosTitle, { color: colors.destructiveForeground }]}>Send SOS Panic Alert</Text>
        <Text style={[styles.sosCaption, { color: colors.destructiveForeground }]}>
          Use this only for a real incident. You will choose the alert type, add a short note, and capture evidence with live location.
        </Text>
      </Pressable>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<ClipboardList color={colors.info} size={20} />}
            label="Clock events"
            value={String(attendanceCount)}
          />
        </View>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<Users color={colors.warning} size={20} />}
            label="Visitors inside"
            value={String(pendingVisitors)}
          />
        </View>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<AlertTriangle color={colors.destructive} size={20} />}
            label="SOS alerts"
            value={String(recentSosCount)}
          />
        </View>
      </View>

      <InfoCard>
        <Pressable
          accessibilityRole="button"
          onPress={() => setStatusDetailsOpen((current) => !current)}
          style={styles.rowBetween}
          testID="qa_guard_status_details_toggle"
        >
          <View style={styles.rowTitleWrap}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Shift status</Text>
            <Text style={[styles.sectionCaption, { color: colors.mutedForeground }]}>
              {statusSummary}
            </Text>
          </View>
          <StatusChip
            label={statusDetailsOpen ? 'Hide details' : 'Show details'}
            tone="info"
          />
        </Pressable>

        {statusDetailsOpen ? (
          <>
            <StatusChip
              label={lastKnownLocation?.withinGeoFence ? 'Within geo-fence' : 'Needs check'}
              tone={geoStatusTone}
            />
            <Text style={[styles.syncLine, { color: colors.foreground }]}>
              {lastKnownLocation?.distanceFromAssignedSite == null
                ? 'No live distance captured yet.'
                : `${lastKnownLocation.distanceFromAssignedSite}m from assigned site`}
            </Text>
            <Text style={[styles.sectionCaption, { color: colors.mutedForeground }]}>
              Latest snapshot: {formatTimestamp(lastKnownLocation?.capturedAt ?? null)}
            </Text>
            {previewMode ? (
              <>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleCopy}>
                    <Text style={[styles.toggleTitle, { color: colors.foreground }]}>Offline testing mode</Text>
                    <Text style={[styles.toggleCaption, { color: colors.mutedForeground }]}>
                      Queue attendance, checklist, visitor, and SOS actions locally until you sync them.
                    </Text>
                  </View>
                  <Switch
                    onValueChange={(value) => void setOfflineMode(value)}
                    testID="qa_guard_offline_mode"
                    thumbColor={colors.primaryForeground}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    value={isOfflineMode}
                  />
                </View>
                <Text style={[styles.syncLine, { color: colors.mutedForeground }]}>
                  Last successful sync: {formatTimestamp(lastSyncAt)}
                </Text>
              </>
            ) : null}
            <View style={styles.heroActions}>
              <ActionButton
                label="Reset patrol timer"
                variant="secondary"
                testID="qa_guard_reset_patrol"
                onPress={() => void handleResetPatrolTimer()}
              />
              {previewMode ? (
                <ActionButton
                  label={isSyncing ? 'Syncing...' : 'Sync queued actions'}
                  variant="ghost"
                  disabled={isOfflineMode || isSyncing}
                  testID="qa_guard_sync_queue"
                  onPress={() => void handleSyncQueue()}
                />
              ) : null}
            </View>
          </>
        ) : null}
      </InfoCard>

      <Modal
        animationType="slide"
        transparent
        visible={sosModalOpen}
        onRequestClose={() => setSosModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Create SOS Alert</Text>
            <Text style={[styles.modalCaption, { color: colors.mutedForeground }]}>
              Choose the alert category first. A front-camera evidence capture will start after you continue.
            </Text>

            <View style={styles.sosTypeList}>
              {[
                { key: 'panic', label: 'Panic / Emergency', helper: 'Immediate distress or unsafe situation.' },
                { key: 'inactivity', label: 'Inactivity Alert', helper: 'Manual escalation for missed patrol response.' },
                { key: 'geo_fence_breach', label: 'Geo-fence Breach', helper: 'Report a guard location breach with captured evidence.' },
              ].map((option) => {
                const active = selectedSosType === option.key;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => setSelectedSosType(option.key as GuardSosType)}
                    style={[
                      styles.sosTypeCard,
                      {
                        backgroundColor: active ? colors.primary + '12' : colors.background,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.sosTypeLabel, { color: colors.foreground }]}>{option.label}</Text>
                    <Text style={[styles.sosTypeHelper, { color: colors.mutedForeground }]}>{option.helper}</Text>
                  </Pressable>
                );
              })}
            </View>

            <FormField
              label="Incident note"
              helperText="Add a short note that will appear in the response center."
              multiline
              numberOfLines={4}
              onChangeText={setSosNote}
              style={styles.multilineInput}
              value={sosNote}
            />

            <View style={styles.modalActions}>
              <ActionButton label="Cancel" variant="ghost" onPress={() => setSosModalOpen(false)} />
              <ActionButton label="Continue to camera" variant="danger" onPress={() => void confirmSosFlow()} />
            </View>
          </View>
        </View>
      </Modal>
      {previewMode ? (
        <NotificationInboxCard
          title="Guard notification centre"
          description="Preview-only notification routes for internal QA flows."
          actions={[
            {
              label: 'Preview checklist reminder',
              route: 'checklist_reminder',
              variant: 'secondary',
            },
            {
              label: 'Preview visitor alert',
              route: 'visitor_at_gate',
              variant: 'ghost',
            },
            {
              label: 'Preview material delivery',
              route: 'material_delivery',
              variant: 'ghost',
            },
          ]}
        />
      ) : null}

    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.base,
  },
  heroTitleWrap: {
    flex: 1,
    gap: Spacing.sm,
  },
  heroTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize['2xl'],
    lineHeight: 28,
  },
  heroCaption: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  message: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  heroActions: {
    gap: Spacing.base,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    padding: Spacing.lg,
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    gap: Spacing.base,
  },
  modalTitle: {
    fontFamily: FontFamily.sansBold,
    fontSize: FontSize.xl,
  },
  modalCaption: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  sosTypeList: {
    gap: Spacing.sm,
  },
  sosTypeCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    gap: Spacing.xs,
  },
  sosTypeLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
  sosTypeHelper: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  multilineInput: {
    minHeight: 110,
    paddingTop: Spacing.base,
    textAlignVertical: 'top',
  },
  modalActions: {
    gap: Spacing.sm,
  },
  sosCard: {
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  sosTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize['2xl'],
  },
  sosCaption: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.base,
    lineHeight: 22,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.base,
  },
  metricCell: {
    flex: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.base,
  },
  rowTitleWrap: {
    flex: 1,
    gap: Spacing.xs,
  },
  sectionTitle: {
    fontFamily: FontFamily.sansBold,
    fontSize: FontSize.lg,
  },
  sectionCaption: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  syncLine: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
  },
  toggleCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  toggleTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
  toggleCaption: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
});
